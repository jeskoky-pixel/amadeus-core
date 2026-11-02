import {Client,StreamableHTTPClientTransport} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
import Ajv from 'ajv';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {atomicJson} from '../core/store.js';
import {McpStore,validateServer} from './store.js';
import {host,member} from '../core/host.js';
import {waitWithSignal} from '../core/deadline.js';
const ajv=new Ajv({strict:false,allErrors:false,validateFormats:false,ownProperties:true});
const bounded=(work,ms,outer)=>{const c=new AbortController();const abort=()=>c.abort(Error('CORE_MCP_CANCELLED'));outer?.addEventListener('abort',abort,{once:true});if(outer?.aborted)abort();const timer=setTimeout(()=>c.abort(Error('CORE_MCP_TIMEOUT')),ms);return waitWithSignal(()=>work(c.signal),c.signal).finally(()=>{clearTimeout(timer);outer?.removeEventListener('abort',abort);});};
const scrubEnv=()=>Object.fromEntries(['PATH','Path','SystemRoot','WINDIR','TEMP','TMP','HOME','USERPROFILE'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
export class McpManager{
  constructor(runtime){this.runtime=runtime;this.store=new McpStore(runtime.root);this.connections=new Map();this.revision=0;this.eventFile=path.join(runtime.root,'mcp-events.json');this.events=fs.existsSync(this.eventFile)?JSON.parse(fs.readFileSync(this.eventFile,'utf8')).events:[];if(!Array.isArray(this.events))throw Error('CORE_MCP_EVENT_SCHEMA');this.stopped=false;}
  config(id){return this.store.state.servers.find(s=>s.id===id);}
  identity(sessionId){
    const r=this.runtime,s=member(r.ctx,r.store.state.workspaceId,sessionId),qq=host(r.ctx,'qq');
    if(r.status!=='ready')throw Error('CORE_MCP_NOT_READY');
    if(qq){
      if(!this.store.state.qqSeen){this.store.state.qqSeen=true;this.store.save();}
      if(qq.sessionProvenanceVersion!==1)throw Error('CORE_MCP_IDENTITY');
      const type=qq.classifySession?.(sessionId)?.kind;
      if(type==='qq'){
        const scene=qq.resolveTrustedSessionScene?.(sessionId);
        if(!scene||scene.platform!=='qq'||scene.verified!==true||!['group','private'].includes(scene.kind))throw Error('CORE_MCP_IDENTITY');
        return 'qq-'+scene.kind;
      }
      if(type!=='ordinary'){
        // Optional reuse of Memory's durable, Host-validated ordinary provenance.
        // This is not a model-supplied identity or a grant to read any memory.
        const proof=r.bridges?.memory?.unifiedRuntime?.authorize?.(s);
        if(proof?.allowed!==true||proof.identity?.sourceKey!==`dsh:session:${sessionId}`||proof.identity?.scene)throw Error('CORE_MCP_IDENTITY');
      }
      const created=s.header.createdAt;
      if(created==null)throw Error('CORE_MCP_IDENTITY');
      if(this.store.state.ordinary[sessionId]!==created){this.store.state.ordinary[sessionId]=created;this.store.save();}
      return 'ordinary';
    }
    if(this.store.state.qqSeen&&(!Object.hasOwn(this.store.state.ordinary,sessionId)||s.header.createdAt==null||this.store.state.ordinary[sessionId]!==s.header.createdAt))throw Error('CORE_MCP_IDENTITY');
    if(typeof s.header.agentPreset!=='string'||!['standard','minimal','creator','creative','default'].includes(s.header.agentPreset))throw Error('CORE_MCP_IDENTITY');
    return 'ordinary';
  }
  allowed(cfg,tool,sessionId){const type=this.identity(sessionId),grant=cfg?.tools?.[tool];
    if(this.stopped||!cfg?.enabled||!(cfg.sessionIds.includes(sessionId)||cfg.sessionTypes.includes(type))||!grant?.enabled||
      (grant.category!=='read'&&!grant.allowSideEffects))throw Error('CORE_MCP_DENIED');
  }
  list(sessionId){
    this.identity(sessionId);const result=[];
    for(const cfg of this.store.state.servers){const c=this.connections.get(cfg.id);if(c?.status!=='connected')continue;
      for(const [name,t] of c.tools){try{this.allowed(cfg,name,sessionId);}catch{continue;}
        result.push({serverId:cfg.id,name,description:t.description,inputSchema:t.schema,untrusted:true});}}
    return result;
  }
  overview(){return {revision:this.store.state.revision,events:this.events.slice(-50),servers:this.store.state.servers.map(cfg=>{const c=this.connections.get(cfg.id);return {...structuredClone(cfg),status:c?.status??(cfg.enabled?'disconnected':'disabled'),error:c?.error??null,used:this.store.state.usage[cfg.id]??0,
    discovered:[...(c?.tools??[])].map(([name,t])=>({name,description:t.description,inputSchema:t.schema,untrusted:true}))};})};}
  async start(){this.stopped=false;await Promise.allSettled(this.store.state.servers.filter(s=>s.enabled).map(s=>this.connect(s.id)));}
  async disconnect(id){const c=this.connections.get(id);if(!c)return;c.status='disabled';c.generation++;c.abort.abort();c.tools.clear();try{await bounded(()=>c.client?.close(),3000);}catch{c.error='CORE_MCP_CLOSE_UNCONFIRMED';}if(c.error!=='CORE_MCP_CLOSE_UNCONFIRMED')this.connections.delete(id);}
  async connect(id){
    const cfg=this.config(id);if(!cfg?.enabled||this.stopped)throw Error('CORE_MCP_DISABLED');
    await this.disconnect(id);if(this.connections.has(id))throw Error('CORE_MCP_CLOSE_UNCONFIRMED');
    const c={status:'connecting',tools:new Map(),generation:++this.revision,abort:new AbortController(),client:null,error:null};this.connections.set(id,c);
    try{
      const headers=cfg.credentialRef?{Authorization:'Bearer '+this.store.resolve(cfg.credentialRef)}:{};
      const env=scrubEnv();for(const [key,ref] of Object.entries(cfg.envRefs??{}))env[key]=this.store.resolve(ref);
      c.transport=cfg.transport==='stdio'?new StdioClientTransport({command:cfg.command,args:cfg.args,env,cwd:cfg.cwd,stderr:'ignore'}):new StreamableHTTPClientTransport(new URL(cfg.url),{requestInit:{headers,redirect:'error'}});
      // External stderr is discarded; it must not expose credentials or block the pipe.
      c.client=new Client({name:'amadeus-core-mcp',version:'0.1.0-alpha.1'},{capabilities:{}});
      c.client.onerror=()=>{c.error='CORE_MCP_CONNECTION_ERROR';};
      c.client.onclose=()=>{if(c.status!=='disabled'&&c.status!=='error'){c.status='disconnected';c.tools.clear();}};
      await bounded(()=>c.client.connect(c.transport),cfg.timeoutMs,c.abort.signal);
      let cursor;const seen=new Set();
      do{const response=await bounded(signal=>c.client.listTools(cursor?{cursor}:undefined,{signal,timeout:cfg.timeoutMs}),cfg.timeoutMs,c.abort.signal);
        if(!Array.isArray(response.tools))throw Error('CORE_MCP_DISCOVERY');
        for(const tool of response.tools){
          if(typeof tool.name!=='string'||!tool.name||tool.name.length>200||c.tools.has(tool.name)||c.tools.size>=128)throw Error('CORE_MCP_TOOL_LIMIT');
          const schema=tool.inputSchema;if(!schema||Buffer.byteLength(JSON.stringify(schema))>65536)throw Error('CORE_MCP_SCHEMA');
          const validate=ajv.compile(schema);c.tools.set(tool.name,{schema:this.store.sanitize(schema),validate,description:this.store.redact(String(tool.description??'').slice(0,4096))});
        }
        cursor=response.nextCursor;if(cursor){if(seen.has(cursor)||seen.size>=16)throw Error('CORE_MCP_DISCOVERY');seen.add(cursor);}
      }while(cursor);
      if(c.abort.signal.aborted||!this.config(id)?.enabled)throw Error('CORE_MCP_DISABLED');c.status='connected';
      return this.overview();
    }catch{c.error='CORE_MCP_CONNECTION_FAILED';c.status='error';c.tools.clear();c.abort.abort();try{await bounded(()=>c.client?.close()??c.transport?.close(),3000);}catch{c.error='CORE_MCP_CLOSE_UNCONFIRMED';}return this.overview();}
  }
  async save(input,revision){
    const cfg=validateServer(input),prior=this.config(cfg.id);
    const connectionFields=['transport','command','args','cwd','envRefs','url','credentialRef','timeoutMs'];
    const unchanged=prior&&prior.enabled&&cfg.enabled&&connectionFields.every(k=>JSON.stringify(prior[k])===JSON.stringify(cfg[k]));
    this.store.mutate(revision,s=>{const i=s.servers.findIndex(v=>v.id===cfg.id);if(i<0){if(s.servers.length>=20)throw Error('CORE_MCP_SERVER_LIMIT');s.servers.push(cfg);}else s.servers[i]=cfg;});
    const connection=this.connections.get(cfg.id);
    if(unchanged&&connection?.status==='connected'){
      if(['tools','sessionIds','sessionTypes'].some(k=>JSON.stringify(prior[k])!==JSON.stringify(cfg[k])))connection.generation++;
      return this.overview();
    }
    await this.disconnect(cfg.id);if(cfg.enabled)await this.connect(cfg.id);return this.overview();
  }
  async remove(id,revision){this.store.mutate(revision,s=>{s.servers=s.servers.filter(c=>c.id!==id);});await this.disconnect(id);return this.overview();}
  async call(serverId,toolName,args,exec){
    const sessionId=exec?.agent?.session?.id,cfg=this.config(serverId);this.allowed(cfg,toolName,sessionId);
    const c=this.connections.get(serverId),tool=c?.tools.get(toolName);
    if(c?.status!=='connected'||!tool)throw Error('CORE_MCP_DISCONNECTED');
    if(c.inflight)throw Error('CORE_MCP_BUSY');
    if(c.lastCallAt&&Date.now()-c.lastCallAt<100)throw Error('CORE_MCP_RATE_LIMIT');
    if(!args||typeof args!=='object'||Array.isArray(args)||Buffer.byteLength(JSON.stringify(args))>65536||!tool.validate(args))throw Error('CORE_MCP_ARGUMENTS');
    c.inflight=true;c.lastCallAt=Date.now();const generation=c.generation;const start=Date.now();let outcome='failed';
    try{
      this.store.charge(serverId,cfg.dailyBudget);
      const signal=exec?.signal?AbortSignal.any([exec.signal,c.abort.signal]):c.abort.signal;
      const value=await bounded(signal=>c.client.callTool({name:toolName,arguments:args},{signal,timeout:cfg.timeoutMs}),cfg.timeoutMs,signal);
      this.allowed(this.config(serverId),toolName,sessionId);
      if(c.generation!==generation||c.status!=='connected')throw Error('CORE_MCP_REVOKED');
      const raw=JSON.stringify(value);if(!raw||Buffer.byteLength(raw)>65536)throw Error('CORE_MCP_RESULT_LIMIT');
      const safe=this.store.sanitize(JSON.parse(raw));outcome=value.isError?'tool-error':'completed';
      return {source:'mcp',serverId,toolName,untrusted:true,result:safe};
    }catch(e){throw Error(/^CORE_MCP_[A-Z_]+$/.test(e.message)?e.message:'CORE_MCP_CALL_FAILED');}
    finally{c.inflight=false;this.events.push({eventId:randomUUID(),source:'mcp',serverId,toolName,sessionId,outcome,durationMs:Date.now()-start,occurredAt:new Date().toISOString()});if(this.events.length>200)this.events.shift();atomicJson(this.eventFile,{schema:1,events:this.events});}
  }
  async dispose(){this.stopped=true;await Promise.allSettled([...this.connections.keys()].map(id=>this.disconnect(id)));}
}
