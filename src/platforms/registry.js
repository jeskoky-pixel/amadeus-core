import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { atomicJson } from '../core/store.js';
export const PLATFORM_READS=['read','search','browse','comments','related','subtitles','images'];
export const PLATFORM_SOCIAL=['like','favorite','comment','reply','follow','message','publish'];
const receipts=new WeakMap();
export function verifiedObservation(value){const saved=receipts.get(value);return saved&&saved.json===JSON.stringify(value)?saved.evidence:null;}
const OPERATIONS=new Set([...PLATFORM_READS,...PLATFORM_SOCIAL]);
const validId=s=>typeof s==='string'&&/^[a-z][a-z0-9-]{0,63}$/.test(s);

// Registration is trusted code, never an HTTP/model operation. This alpha only
// accepts live adapters only from the constructor's trusted composition root.
export class PlatformRegistry {
  constructor({budgetFile=null,now=()=>Date.now(),trustedRealAdapters=[],accounts=null,authorizeIdentity=null}={}){
    this.trustedRealAdapters=new WeakSet(trustedRealAdapters);this.accounts=accounts;this.authorizeIdentity=authorizeIdentity;
    this.entries=new Map();this.budgetFile=budgetFile;this.now=now;
    this.budget=budgetFile&&fs.existsSync(budgetFile)?JSON.parse(fs.readFileSync(budgetFile,'utf8')):
      {schema:1,day:Math.floor(now()/86400000),used:{}};
    if(this.budget.schema!==1||!Number.isSafeInteger(this.budget.day)||!this.budget.used||
      Object.values(this.budget.used).some(n=>!Number.isSafeInteger(n)||n<0))throw Error('CORE_PLATFORM_BUDGET_SCHEMA');
  }
  refreshBudget(){
    const day=Math.floor(this.now()/86400000);
    // Clock rollback cannot grant a second budget for a previously spent day.
    if(day>this.budget.day){
      const next={schema:1,day,used:{},...(this.budget.lastCalls?{lastCalls:this.budget.lastCalls}:{})};
      if(this.budgetFile)atomicJson(this.budgetFile,next);
      this.budget=next;for(const e of this.entries.values())e.used=0;
    }
  }
  register(adapter){
    if(!validId(adapter?.id)||!((adapter.contractVersion===1&&adapter.simulated===true)||(adapter.contractVersion===2&&adapter.mode==='real'&&this.trustedRealAdapters.has(adapter)))||typeof adapter.execute!=='function'||
      !Array.isArray(adapter.capabilities)||adapter.capabilities.some(c=>!OPERATIONS.has(c))) throw Error('CORE_PLATFORM_INVALID');
    if(this.entries.has(adapter.id))throw Error('CORE_PLATFORM_DUPLICATE');
    this.refreshBudget();
    const item={adapter,enabled:false,permissions:[],maxRequests:20,used:this.budget.used[adapter.id]??0,lastCall:this.budget.lastCalls?.[adapter.id],generation:0,tail:Promise.resolve()};
    this.entries.set(adapter.id,item);return ()=>{item.enabled=false;item.generation++;this.entries.delete(adapter.id);};
  }
  configure(id,{enabled,permissions=[],maxRequests=20,autonomous, minIntervalMs=0}){
    const e=this.entries.get(id);
    if(!e||typeof enabled!=='boolean'||!Array.isArray(permissions)||permissions.some(x=>!e.adapter.capabilities.includes(x))||
      !Number.isSafeInteger(minIntervalMs)||minIntervalMs<0||minIntervalMs>3600000||!Number.isSafeInteger(maxRequests)||maxRequests<1||maxRequests>1000)throw Error('CORE_PLATFORM_CONFIG');
    Object.assign(e,{enabled,autonomous:autonomous??e.adapter.simulated===true,minIntervalMs,permissions:[...new Set(permissions)],maxRequests,generation:e.generation+1});
    // Reconfiguration never resets the spent budget.
    return this.list().find(x=>x.id===id);
  }
  list(){return [...this.entries].map(([id,e])=>({id,name:e.adapter.name??id,version:e.adapter.version??'1',mode:e.adapter.simulated?'simulation':'real',simulated:e.adapter.simulated===true,authMethods:e.adapter.authMethods??[],account:this.accounts?.status(id)??null,autonomous:e.autonomous??e.adapter.simulated===true,minIntervalMs:e.minIntervalMs??0,enabled:e.enabled,capabilities:[...e.adapter.capabilities],permissions:[...e.permissions],used:e.used,maxRequests:e.maxRequests}));}
  execute(id,operation,input,identity,{signal}={}){
    const e=this.entries.get(id);
    if(!e)return Promise.reject(Error('CORE_PLATFORM_UNAVAILABLE'));
    const run=async()=>{
      signal?.throwIfAborted();
      this.authorizeIdentity?.(identity);
      for(const k of ['activityId','workspaceId','sessionId'])if(typeof identity?.[k]!=='string'||!identity[k])throw Error('CORE_PLATFORM_IDENTITY');
      if(!e.enabled||!OPERATIONS.has(operation)||!e.permissions.includes(operation))throw Error('CORE_PLATFORM_DENIED');
      if(!e.adapter.simulated&&PLATFORM_SOCIAL.includes(operation))throw Error('CORE_PLATFORM_UNSUPPORTED');
      const account=e.adapter.simulated?null:this.accounts?.context(id),accountEpoch=this.accounts?.epoch(id);
      if(e.adapter.requiresAccount&&!account)throw Error('CORE_PLATFORM_LOGIN_REQUIRED');
      this.refreshBudget();
      if(e.minIntervalMs>0&&e.lastCall!==undefined&&this.now()-e.lastCall<e.minIntervalMs)throw Error('CORE_PLATFORM_COOLDOWN');
      if(e.used>=e.maxRequests)throw Error('CORE_PLATFORM_BUDGET');
      const generation=e.generation;
      const next={...this.budget,used:{...this.budget.used,[id]:e.used+1},lastCalls:{...this.budget.lastCalls,[id]:this.now()}};
      // Charge before dispatch; crashes/uncertain failures never refund a call.
      if(this.budgetFile)atomicJson(this.budgetFile,next);
      this.budget=next;e.used++;e.lastCall=this.now();
      const result=await e.adapter.execute(operation,structuredClone(input),{signal,credentials:account?.credentials});
      signal?.throwIfAborted();
      this.authorizeIdentity?.(identity);
      if(!e.adapter.simulated&&(accountEpoch!==this.accounts?.epoch(id)||(account&&this.accounts?.context(id)?.accountId!==account.accountId)))throw Error('CORE_PLATFORM_REVOKED');
      if(!e.enabled||generation!==e.generation||!e.permissions.includes(operation))throw Error('CORE_PLATFORM_REVOKED');
      const serialized=JSON.stringify(result);
      if(!serialized||Buffer.byteLength(serialized)>65536)throw Error('CORE_PLATFORM_RESULT_LIMIT');
      const evidenceLevel=e.adapter.simulated?'simulation':'live-read';
      const receipt={eventId:randomUUID(),platform:id,accountId:account?.accountId??null,activityId:identity.activityId,
        sessionId:identity.sessionId,workspaceId:identity.workspaceId,evidenceLevel,operation,untrustedContent:true,
        observedEvidence:JSON.parse(serialized),occurredAt:new Date().toISOString(),externalAction:false};
      receipts.set(receipt,{json:JSON.stringify(receipt),evidence:{evidenceLevel,accountId:receipt.accountId,platform:id,operation,sessionId:identity.sessionId,workspaceId:identity.workspaceId,activityId:identity.activityId}});
      return receipt;
    };
    const next=e.tail.then(run,run);e.tail=next.catch(()=>{});return next;
  }
}

export function makeSimulatedAdapter(id,records){
  const fixed=structuredClone(records);
  if(!Array.isArray(fixed))throw Error('CORE_PLATFORM_FIXTURES');
  return Object.freeze({id,contractVersion:1,simulated:true,capabilities:['browse','search','read'],
    async execute(operation,input={}){
      if(operation==='read')return fixed.find(x=>x.id===input.id)??null;
      if(operation==='search')return fixed.filter(x=>JSON.stringify(x).includes(String(input.query??''))).slice(0,10);
      if(operation==='browse')return fixed.slice(0,10);
      throw Error('CORE_PLATFORM_UNSUPPORTED');
    }});
}
