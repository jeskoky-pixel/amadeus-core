// Host-owned login evidence state. No UI timers, no direct credential contents.
// Integrate only with an accepted Supervisor and protected session store.
export class XhsLoginController {
 constructor({client,storage,workspaceId,now=()=>Date.now(),intervalMs=15000}){if(!workspaceId||intervalMs<10000)throw Error('CORE_PLATFORM_CONFIG');Object.assign(this,{client,storage,workspaceId,now,intervalMs});this.state='not_configured';this.identity=null;this.pending=null;this.events=[];this.epoch=0;this.nextCheck=0;this.checking=null;}
 transition(state){this.state=state;this.events.push({state,at:this.now()});this.events=this.events.slice(-30);}
 status(){return {state:this.state,accountId:this.identity?.accountId??null,pending:this.pending?{qrDataUrl:this.pending.qrDataUrl,expiresAt:this.pending.expiresAt}:null,events:this.events.map(x=>({...x}))};}
 begin(){
  if(this.beginning)return this.beginning;
  const task=this.runBegin();this.beginning=task;
  task.finally(()=>{if(this.beginning===task)this.beginning=null;});return task;
 }
 async runBegin(){if(this.pending)return this.status();const epoch=++this.epoch;this.transition('login_requested');try{const qr=await this.client.beginLogin();if(epoch!==this.epoch)return this.status();this.pending={qrDataUrl:qr.qrDataUrl??null,expiresAt:this.now()+(qr.expiresInMs??240000)};this.transition(qr.alreadyLoggedIn?'website_authenticated':'waiting_scan');return this.status();}catch{if(epoch===this.epoch)this.transition('service_unavailable');return this.status();}}
 async check({restore=false}={}){
  if(this.checking)return this.checking;if(this.now()<this.nextCheck)return this.status();this.nextCheck=this.now()+this.intervalMs;
  this.checking=this.runCheck(restore).finally(()=>{this.checking=null;});return this.checking;
 }
 async runCheck(restore){const epoch=this.epoch;if(restore)this.transition('restore_verifying');
  try{
   const saved=await this.storage.inspect(this.workspaceId);if(epoch!==this.epoch)return this.status();
   if(!saved?.valid){if(this.pending&&this.now()>this.pending.expiresAt){this.pending=null;this.transition('login_expired');}else if(restore)this.transition('session_invalid');return this.status();}
   this.transition('session_persisted');const identity=await this.client.account();if(epoch!==this.epoch)return this.status();
   if(!identity){this.transition('session_invalid');return this.status();}
   const expected=this.identity?.accountId??saved.accountId;if(expected&&identity.accountId!==expected){this.transition('identity_mismatch');return this.status();}
   if(typeof identity.accountId!=='string'||!identity.accountId){this.transition('website_authenticated');return this.status();}
   await this.storage.bind(this.workspaceId,identity.accountId);if(epoch!==this.epoch)return this.status();this.identity=identity;this.pending=null;this.transition('identity_verified');
   // ready_for_read/restored require a separate successful real read evidence.
   this.restorePending=restore;return this.status();
  }catch(error){if(epoch===this.epoch)this.transition(error.message==='CORE_PLATFORM_IDENTITY_UNVERIFIED'?'website_authenticated':error.message?.includes('STORAGE')?'storage_failed':'service_unavailable');return this.status();}
 }
 recordRead({accountId,workspaceId,contentId,sourceUrl}){if(this.state!=='identity_verified'||accountId!==this.identity?.accountId||workspaceId!==this.workspaceId||typeof contentId!=='string'||!contentId)throw Error('CORE_PLATFORM_READ_EVIDENCE');const url=new URL(sourceUrl);if(url.protocol!=='https:'||url.hostname!=='www.xiaohongshu.com'||url.pathname!=='/explore/'+contentId)throw Error('CORE_PLATFORM_READ_EVIDENCE');this.transition(this.restorePending?'restored':'ready_for_read');}
 cancel(){this.epoch++;this.pending=null;this.transition(this.identity?'identity_verified':'service_ready');}
}
