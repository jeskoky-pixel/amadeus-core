import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {atomicJson} from '../core/store.js';
import {createNativeService} from './xhs-native-service.js';
import {XhsLoginController} from './xhs-login-controller.js';
const fail=code=>{throw Error('CORE_PLATFORM_'+code);};
const reads=new Set(['browse','search','read','comments']);
const writes=new Set(['like','comment','reply']);
export function makeXhsNativeAdapter({root,workspaceId,serviceFactory=createNativeService,now=()=>Date.now()}){
 let active=null,starting=null,disposed=false,stage='not_configured';
 const observed=new Map();
 const scope=(credentials,identity)=>JSON.stringify([workspaceId(),credentials?.accountId,identity?.sessionId]);
 async function service(){
  if(disposed)fail('REVOKED');const workspace=workspaceId();if(!workspace)fail('WORKSPACE_REQUIRED');
  if(active?.workspace===workspace)return active;
  if(starting){await starting;return service();}
  starting=(async()=>{
   if(active)await active.native.stop();active=null;stage='service_starting';
   const dir=path.join(root,createHash('sha256').update(workspace).digest('hex'));
   const native=await serviceFactory({root:dir,workspaceId:workspace});
   if(disposed||workspace!==workspaceId()){await native.stop();fail('REVOKED');}
   const binding=path.join(dir,'account-binding.json');
   const storage={inspect:async()=>{const raw=fs.existsSync(native.cookiesPath)?fs.readFileSync(native.cookiesPath):null;const meta=fs.existsSync(binding)?JSON.parse(fs.readFileSync(binding,'utf8')):null;return {valid:raw?.subarray(0,20).toString()==='AMADEUS-XHS-DPAPI-1\n',accountId:meta?.accountId};},bind:async(w,accountId)=>{if(w!==workspace||w!==workspaceId())fail('REVOKED');atomicJson(binding,{schema:1,workspaceId:w,accountId});}};
   const controller=new XhsLoginController({client:native.client,storage,workspaceId:workspace,now});
   active={workspace,native,controller};stage='service_ready';return active;
  })();try{return await starting;}finally{starting=null;}
 }
 function result(identity){return {identity,credentials:{accountId:identity.accountId},expiresAt:now()+24*60*60*1000,scopes:['read']};}
 async function validated(expected){const a=await service();await a.controller.check({restore:true});const identity=a.controller.identity;if(!identity||!['identity_verified','ready_for_read','restored'].includes(a.controller.state))fail(a.controller.identityPending?'IDENTITY_UNVERIFIED':'LOGIN_REQUIRED');if(expected&&identity.accountId!==expected)fail('IDENTITY_MISMATCH');return result(identity);}
 return Object.freeze({id:'xiaohongshu-browser',name:'小红书 · 本地执行服务',version:'0.2.0-alpha.6',contractVersion:2,mode:'real',requiresAccount:true,
  capabilities:['browse','search','read','comments','like','comment','reply'],socialWrites:true,authMethods:['local-service-qr'],storage:'windows-dpapi',
  diagnosticStatus:()=>({backend:'native-rest',version:'v2.7.0-amadeus.1',stage:active?.controller.state??stage,...(active?{login:active.controller.status(),service:active.native.supervisor.status()}:{}),writes:'available-live-acceptance-pending'}),
  async beginLogin(input){if(input?.acceptBrowser!==true)fail('USER_CONSENT_REQUIRED');const a=await service();const status=await a.controller.begin();if(!status.pending&&!a.controller.identityPending)fail('LOGIN_START_FAILED');return {private:{workspace:a.workspace},public:{method:'local-service-qr',verificationUrl:'https://www.xiaohongshu.com',qrDataUrl:status.pending?.qrDataUrl??null,expiresAt:now()+240000,intervalMs:15000}};},
  async pollLogin(state){const a=await service();if(state.workspace!==a.workspace)fail('REVOKED');await a.controller.check();if(a.controller.state==='identity_verified')return result(a.controller.identity);if(a.controller.state==='login_expired')fail('CREDENTIALS_EXPIRED');return {pending:true};},
  restoreLogin:({accountId})=>validated(accountId),validateAccount:credentials=>validated(credentials?.accountId),
  async execute(operation,input,{credentials,identity,assertAuthorized,signal}={}){
   if(!reads.has(operation)&&!writes.has(operation))fail('UNSUPPORTED');const a=await service();
   if(typeof assertAuthorized!=='function')fail('PERMISSION_REQUIRED');assertAuthorized();
   const key=scope(credentials,identity);let seen=observed.get(key);
   if(!seen){if(observed.size>=100)observed.delete(observed.keys().next().value);seen=new Map();observed.set(key,seen);}
   const prior=seen.get(input?.id);
   if(writes.has(operation)&&(!prior||now()-prior.at>3600000))fail('TARGET_NOT_OBSERVED');
   const effective={...input,...((writes.has(operation)||!input?.xsecToken)&&prior?{xsecToken:prior.token}:{})};
   const value=await a.native.client.execute(operation,effective,{accountId:credentials?.accountId,assertAuthorized,signal});
   assertAuthorized();
   if(reads.has(operation)){
    const remember=(id,token)=>{if(/^[a-f0-9]{24}$/.test(id)&&typeof token==='string'&&token&&token.length<=4096){if(seen.size>=200)seen.delete(seen.keys().next().value);seen.set(id,{token,at:now()});}};
    if(['browse','search'].includes(operation))for(const item of value.feeds??[])remember(item.id,item.xsecToken);
    if(['read','comments'].includes(operation))remember(input?.id,effective.xsecToken);
   }
   if(writes.has(operation)){if(value.providerAcknowledged!==true||value.operation!==operation||value.contentId!==input.id)fail('ACTION_UNKNOWN');return {status:'confirmed',operation,contentId:input.id,confirmation:'upstream-acknowledged',liveAcceptance:'pending'};}
   if(operation==='read'&&['identity_verified'].includes(a.controller.state))a.controller.recordRead({accountId:credentials.accountId,workspaceId:a.workspace,contentId:input.id,sourceUrl:'https://www.xiaohongshu.com/explore/'+input.id});
   // Bounded observation; never silently truncate a large platform response.
   const observation={...(input?.id?{contentId:input.id,sourceUrl:'https://www.xiaohongshu.com/explore/'+input.id}:{}),data:value};if(Buffer.byteLength(JSON.stringify(observation))>60000)fail('RESULT_LIMIT');return observation;
  },
  // Logout cancels work but retains encrypted bytes for explicit recovery; deleting
  // credentials is a separate Host action. Closing the UI never calls either.
  async logout(){observed.clear();if(active){active.controller.cancel();await active.native.stop();active=null;stage='service_stopped';}},
  async clearSession(){
   const workspace=workspaceId();if(!workspace)fail('WORKSPACE_REQUIRED');
   if(active){await active.native.stop();active=null;}
   if(workspace!==workspaceId())fail('REVOKED');
   const hash=createHash('sha256').update(workspace).digest('hex'),dir=path.join(root,hash);
   const file=path.join(dir,'workspaces',hash,'cookies.json');
   for(const target of [file,file+'.bak',path.join(dir,'account-binding.json')])if(fs.existsSync(target))fs.unlinkSync(target);
   stage='not_configured';
  },
  async dispose(){observed.clear();disposed=true;if(starting)await starting.catch(()=>{});if(active)await active.native.stop();active=null;},
 });
}
