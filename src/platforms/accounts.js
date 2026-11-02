import fs from 'node:fs';
import QRCode from 'qrcode';
import {randomUUID} from 'node:crypto';
import {atomicJson} from '../core/store.js';

const fail=code=>{throw Error(`CORE_PLATFORM_${code}`);};
// Only account metadata is durable. Secrets and pending login challenges are
// process-local until a tested Host secure-storage contract is available.
export class AccountManager {
  #secrets=new Map(); #pending=new Map(); #adapters=new Map(); #epochs=new Map();
  constructor({file,workspaceId,now=()=>Date.now()}) {
    this.file=file;this.workspaceId=workspaceId;this.now=now;
    this.state=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{schema:1,accounts:[]};
    if(this.state.schema!==1||!Array.isArray(this.state.accounts))fail('ACCOUNT_SCHEMA');
    for(const a of this.state.accounts)if(a.status==='authenticated')a.status='credentials_expired';
  }
  register(adapter){if(this.#adapters.has(adapter.id))fail('DUPLICATE');this.#adapters.set(adapter.id,adapter);}
  epoch(id){return this.#epochs.get(id)??0;}
  invalidate(id){this.#epochs.set(id,this.epoch(id)+1);this.#pending.delete(id);for(const [k,s] of this.#secrets)if(s.platformId===id)this.#secrets.delete(k);}
  persist(){atomicJson(this.file,this.state);}
  list(id){return this.state.accounts.filter(a=>a.platformId===id&&a.workspaceId===this.workspaceId()).map(a=>({...a,status:a.expiresAt<=this.now()?'credentials_expired':a.status}));}
  status(id){const p=this.#pending.get(id);return {storage:'session-only',canRefresh:!!this.context(id,{allowExpired:true})?.credentials?.refreshToken,accounts:this.list(id),pending:p?{...p.public,loginId:p.loginId}:null};}
  async begin(id,input={}) {
    const adapter=this.#adapters.get(id);if(!adapter?.beginLogin)fail('UNSUPPORTED');
    const workspaceId=this.workspaceId();if(!workspaceId)fail('WORKSPACE_REQUIRED');
    this.invalidate(id);const epoch=this.epoch(id);await this.#adapters.get(id)?.logout?.();if(epoch!==this.epoch(id))fail('REVOKED');
    for(const a of this.state.accounts)if(a.platformId===id&&a.workspaceId===workspaceId)a.status='disabled';this.persist();
    const result=await adapter.beginLogin(input,{});
    if(epoch!==this.epoch(id))fail('REVOKED');
    const pub=result.public;
    if(!pub||!Number.isFinite(pub.expiresAt)||pub.expiresAt<=this.now()||typeof pub.verificationUrl!=='string')fail('INVALID_RESPONSE');
    const loginId=randomUUID();
    const qrDataUrl=pub.method==='dedicated-browser'?null:await QRCode.toDataURL(pub.verificationUrl,{width:240,margin:2});
    if(epoch!==this.epoch(id))fail('REVOKED');
    this.#pending.set(id,{private:result.private,public:{method:pub.method??null,qrDataUrl,verificationUrl:pub.verificationUrl,userCode:pub.userCode??null,expiresAt:pub.expiresAt,intervalMs:Math.max(1000,pub.intervalMs??2000)},workspaceId,loginId,nextPoll:0});
    return this.status(id);
  }
  async poll(id,loginId) {
    const p=this.#pending.get(id),epoch=this.epoch(id);
    if(!p||p.loginId!==loginId||p.workspaceId!==this.workspaceId())fail('LOGIN_MISSING');
    if(p.public.expiresAt<=this.now()){this.#pending.delete(id);fail('CREDENTIALS_EXPIRED');}
    if(p.nextPoll>this.now())fail('RATE_LIMITED');p.nextPoll=this.now()+p.public.intervalMs;
    const result=await this.#adapters.get(id).pollLogin(p.private,{});
    if(epoch!==this.epoch(id)||p.workspaceId!==this.workspaceId())fail('REVOKED');
    if(result.slowDown){p.public.intervalMs+=5000;p.nextPoll=this.now()+p.public.intervalMs;}
    if(result.pending)return {...this.status(id),scanned:result.scanned===true};
    const accountId=result.identity?.accountId;
    if(typeof accountId!=='string'||!accountId||accountId.length>256||!Number.isFinite(result.expiresAt)||result.expiresAt<=this.now())fail('INVALID_RESPONSE');
    const key=JSON.stringify([p.workspaceId,id,accountId]);
    this.#secrets.set(key,{platformId:id,credentials:result.credentials});
    const record={platformId:id,accountId,workspaceId:p.workspaceId,displayName:String(result.identity.displayName??accountId).slice(0,200),status:'authenticated',expiresAt:result.expiresAt,scopes:(result.scopes??[]).filter(x=>typeof x==='string').slice(0,20)};
    this.state.accounts=this.state.accounts.filter(a=>!(a.platformId===id&&a.accountId===accountId&&a.workspaceId===p.workspaceId));this.state.accounts.push(record);
    this.#pending.delete(id);this.persist();return this.status(id);
  }
  context(id,{allowExpired=false}={}) {
    const a=this.list(id).find(a=>a.status==='authenticated'||(allowExpired&&a.status==='credentials_expired'));
    if(!a)return null;
    const secret=this.#secrets.get(JSON.stringify([a.workspaceId,id,a.accountId]));
    return secret?{accountId:a.accountId,credentials:secret.credentials,epoch:this.epoch(id)}:null;
  }
  async verify(id,{refresh=false}={}) {
    const c=this.context(id,{allowExpired:refresh}),epoch=this.epoch(id);if(!c)fail('LOGIN_REQUIRED');
    try {
      const adapter=this.#adapters.get(id);
      if(refresh&&!adapter.refreshAccount)fail('UNSUPPORTED');
      const result=await (refresh?adapter.refreshAccount:adapter.validateAccount)(c.credentials,{});
      if(epoch!==this.epoch(id))fail('REVOKED');
      if(result.identity.accountId!==c.accountId)fail('IDENTITY_MISMATCH');
      if(result.credentials){const key=JSON.stringify([this.workspaceId(),id,c.accountId]);this.#secrets.set(key,{platformId:id,credentials:result.credentials});const row=this.state.accounts.find(a=>a.platformId===id&&a.accountId===c.accountId&&a.workspaceId===this.workspaceId());row.expiresAt=result.expiresAt;row.status='authenticated';this.persist();}
      return this.status(id);
    }catch(e){this.logout(id);throw e;}
  }
  logout(id,{clear=false}={}) {
    this.invalidate(id);
    Promise.resolve(this.#adapters.get(id)?.logout?.()).catch(()=>{});
    if(clear)this.state.accounts=this.state.accounts.filter(a=>a.platformId!==id||a.workspaceId!==this.workspaceId());
    else for(const a of this.state.accounts)if(a.platformId===id&&a.workspaceId===this.workspaceId())a.status='disabled';
    this.persist();return this.status(id);
  }
  async revoke(id) {
    const c=this.context(id);this.logout(id);
    if(!c)return {remote:'not-requested',...this.status(id)};
    const adapter=this.#adapters.get(id);
    if(!adapter.revokeAccount)return {remote:'unsupported',...this.status(id)};
    await adapter.revokeAccount(c.credentials,{});return {remote:'revoked',...this.status(id)};
  }
  dispose(){for(const adapter of this.#adapters.values())Promise.resolve(adapter.dispose?.()).catch(()=>{});this.#secrets.clear();this.#pending.clear();for(const id of this.#adapters.keys())this.#epochs.set(id,this.epoch(id)+1);}
}
