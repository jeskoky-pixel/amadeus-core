import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {atomicJson} from '../core/store.js';
export const SERVER_ID=/^[a-z][a-z0-9-]{0,23}$/;
export const SESSION_TYPES=['ordinary','qq-group','qq-private'];
const strings=(v,max=100)=>Array.isArray(v)&&v.length<=max&&v.every(x=>typeof x==='string'&&x.length>0&&x.length<=200);
export function validateServer(input){
  const s=structuredClone(input);
  if(!s||!SERVER_ID.test(s.id)||typeof s.name!=='string'||!s.name.trim()||s.name.length>120||typeof s.enabled!=='boolean')throw Error('CORE_MCP_CONFIG');
  if(!['stdio','streamable-http'].includes(s.transport))throw Error('CORE_MCP_TRANSPORT');
  if(!Number.isSafeInteger(s.timeoutMs)||s.timeoutMs<100||s.timeoutMs>60000||!Number.isSafeInteger(s.dailyBudget)||s.dailyBudget<1||s.dailyBudget>10000)throw Error('CORE_MCP_BUDGET');
  if(!strings(s.sessionIds)||!strings(s.sessionTypes,3)||s.sessionTypes.some(t=>!SESSION_TYPES.includes(t)))throw Error('CORE_MCP_GRANTS');
  if(s.transport==='stdio'){
    if(typeof s.command!=='string'||!path.isAbsolute(s.command)||!strings(s.args,64))throw Error('CORE_MCP_COMMAND');
    if(/\.(?:cmd|bat|ps1)$/i.test(s.command)||['cmd.exe','powershell.exe','pwsh.exe','sh','bash'].includes(path.basename(s.command).toLowerCase()))throw Error('CORE_MCP_SHELL_DENIED');
    if(s.cwd!==undefined&&(typeof s.cwd!=='string'||!path.isAbsolute(s.cwd)))throw Error('CORE_MCP_CWD');
  }else{
    let url;try{url=new URL(s.url);}catch{throw Error('CORE_MCP_URL');}
    if(url.username||url.password||url.hash||url.search||!['https:','http:'].includes(url.protocol)||
      (url.protocol==='http:'&&!['localhost','127.0.0.1','[::1]'].includes(url.hostname)))throw Error('CORE_MCP_URL');
  }
  if(!s.tools||typeof s.tools!=='object'||Array.isArray(s.tools)||Object.keys(s.tools).length>128)throw Error('CORE_MCP_TOOLS');
  for(const [name,g] of Object.entries(s.tools)){
    if(!name||name.length>200||!g||typeof g.enabled!=='boolean'||!['read','write','system'].includes(g.category)||typeof g.allowSideEffects!=='boolean')throw Error('CORE_MCP_GRANTS');
  }
  if(s.credentialRef!==undefined&&(typeof s.credentialRef!=='string'||!/^secret_[a-f0-9-]{36}$/.test(s.credentialRef)))throw Error('CORE_MCP_CREDENTIAL_REF');
  if(s.envRefs!==undefined&&(!s.envRefs||Array.isArray(s.envRefs)||Object.entries(s.envRefs).some(([k,v])=>!/^\w{1,80}$/.test(k)||!/^secret_[a-f0-9-]{36}$/.test(v))))throw Error('CORE_MCP_CREDENTIAL_REF');
  // Reject secrets and unknown fields rather than silently preserving a token in a public config.
  const allowed=new Set(['id','name','enabled','transport','timeoutMs','dailyBudget','sessionIds','sessionTypes','command','args','cwd','url','tools','credentialRef','envRefs']);
  if(Object.keys(s).some(k=>!allowed.has(k)))throw Error('CORE_MCP_UNKNOWN_FIELD');
  return s;
}
export class McpStore{
  constructor(root){this.file=path.join(root,'mcp.json');this.secretFile=path.join(root,'mcp-secrets.private.json');
    this.state=fs.existsSync(this.file)?JSON.parse(fs.readFileSync(this.file,'utf8')):{schema:1,revision:0,servers:[],qqSeen:false,ordinary:{},day:Math.floor(Date.now()/86400000),usage:{}};
    if(this.state.schema!==1||!Number.isSafeInteger(this.state.revision)||!Array.isArray(this.state.servers)||this.state.servers.length>20)throw Error('CORE_MCP_SCHEMA');
    this.state.servers.forEach(validateServer);
    if(new Set(this.state.servers.map(s=>s.id)).size!==this.state.servers.length||!Number.isSafeInteger(this.state.day)||typeof this.state.qqSeen!=='boolean'||!this.state.ordinary||typeof this.state.ordinary!=='object'||Array.isArray(this.state.ordinary)||!this.state.usage||Object.values(this.state.usage).some(n=>!Number.isSafeInteger(n)||n<0))throw Error('CORE_MCP_SCHEMA');
    this.secrets=fs.existsSync(this.secretFile)?JSON.parse(fs.readFileSync(this.secretFile,'utf8')):{};
    if(!this.secrets||Array.isArray(this.secrets)||typeof this.secrets!=='object'||Object.entries(this.secrets).some(([k,v])=>!/^secret_[a-f0-9-]{36}$/.test(k)||typeof v!=='string'||v.length>8192))throw Error('CORE_MCP_SECRET_SCHEMA');
  }
  save(){atomicJson(this.file,this.state);}
  mutate(revision,fn){if(revision!==this.state.revision)throw Error('CORE_REVISION_CONFLICT');const prior=structuredClone(this.state);try{fn(this.state);this.state.revision++;atomicJson(path.join(path.dirname(this.file),'backups',`mcp-r${prior.revision}.json`),prior);this.save();}catch(e){this.state=prior;throw e;}}
  secret(value){if(typeof value!=='string'||!value||value.length>8192||/[\r\n]/.test(value))throw Error('CORE_MCP_SECRET');const ref='secret_'+randomUUID();const next={...this.secrets,[ref]:value};atomicJson(this.secretFile,next);this.secrets=next;return ref;}
  resolve(ref){if(!ref)return undefined;const value=this.secrets[ref];if(typeof value!=='string')throw Error('CORE_MCP_SECRET_MISSING');return value;}
  redact(value){let text=String(value);for(const secret of Object.values(this.secrets))if(secret)text=text.split(secret).join('[redacted]');return text;}
  sanitize(value){if(typeof value==='string')return this.redact(value);if(Array.isArray(value))return value.map(v=>this.sanitize(v));if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[this.redact(k),this.sanitize(v)]));return value;}
  charge(id,max){const day=Math.floor(Date.now()/86400000);if(day>this.state.day){this.state.day=day;this.state.usage={};}const used=this.state.usage[id]??0;if(used>=max)throw Error('CORE_MCP_BUDGET');this.state.usage[id]=used+1;this.save();}
}
