import fs from 'node:fs';
import path from 'node:path';
import { LocalVirtualProvider } from '../modules/life/src/life-v1.js';
import { atomicJson } from './store.js';
import { host, member } from './host.js';
import { waitWithSignal } from './deadline.js';

// Reuses Life's provider/ledger transitions. No timer, independent wake queue,
// platform login or outbound sender exists here.
export class CoreActivity extends LocalVirtualProvider {
  constructor(runtime){
    super({id:'amadeus-core-exploration'});this.runtime=runtime;
    this.file=path.join(runtime.root,'activity.json');
    this.saved=fs.existsSync(this.file)?JSON.parse(fs.readFileSync(this.file,'utf8')):{schema:1,phase:'Idle',activities:{},last:null};
    if(this.saved.schema!==1)throw Error('CORE_ACTIVITY_SCHEMA');
    this.activities=new Map(Object.entries(this.saved.activities));
    for(const entry of this.activities.values())if(entry.status==='running')entry.status='paused';
    if(['Exploring','Deliberating'].includes(this.saved.phase))this.saved.phase='Paused';
    this.busy=false;this.cancelled=false;
  }
  persist(){this.saved.activities=Object.fromEntries(this.activities);atomicJson(this.file,this.saved);}
  start(input){const result=super.start(input);this.persist();return result;}
  transition(input,result,phase){
    if(result.status!=='unknown'&&this.saved.last?.activityId===input.activityId){
      this.saved.phase=phase;
      if(phase!=='Exploring'){this.cancelled=true;this.controller?.abort(Error('CORE_ACTIVITY_STOPPED'));}
    }
    this.persist();return result;
  }
  pause(input){return this.transition(input,super.pause(input),'Paused');}
  resume(input){
    const last=this.saved.last;
    if(last?.activityId===input.activityId&&last.mode==='model'&&
      (!Number.isFinite(Date.parse(last.deadlineAt))||Date.parse(last.deadlineAt)<=Date.now()||last.attempts>=6))throw Error('CORE_ACTIVITY_BUDGET');
    const result=super.resume(input);
    if(result.status==='running'&&last?.activityId===input.activityId&&last.mode==='model'){this.cancelled=false;this.saved.phase='Exploring';}
    this.persist();return result;
  }
  cancel(input){return this.transition(input,super.cancel(input),'Idle');}
  complete(input){return this.transition(input,super.complete(input),'Idle');}
  fail(input){return this.transition(input,super.fail(input),'Idle');}
  checkpoint(input){const result=super.checkpoint(input);this.persist();return result;}
  summary(){return {phase:this.saved.phase,busy:this.busy,last:this.saved.last,sessionId:this.runtime.store.state.activitySessionId};}
  async recover(){
    const last=this.saved.last,life=this.runtime.bridges.life?.api;
    if(!last?.activityId||!life?.getActivityStatus)return;
    try{
      await this.session();
      const result=await life.getActivityStatus(last.activityId,`session:${last.sessionId}`);
      this.saved.phase=!result.revoked&&['completed','cancelled','failed'].includes(result.activity?.status)?'Idle':'Paused';
    }catch{this.saved.phase='Paused';}
    this.persist();
  }
  async session(){
    const r=this.runtime,s=r.store.state,wasApplied=r.runningRevision===r.store.state.revision;
    if(s.activitySessionId){
      if(!host(r.ctx,'workspaceRegistry')?.get(s.workspaceId)?.sessionIds?.includes(s.activitySessionId))throw Error('CORE_SESSION_DENIED');
      if(!host(r.ctx,'sessions')?.get(s.activitySessionId)){
        const resolved=await host(r.ctx,'sessionController')?.resolveAgent(s.activitySessionId);
        if(!resolved?.agent)throw Error('CORE_ACTIVITY_SESSION_RESTORE_FAILED');
      }
      return member(r.ctx,s.workspaceId,s.activitySessionId);
    }
    if(s.activitySessionCreating)throw Error('CORE_ACTIVITY_SESSION_UNCERTAIN');
    r.store.update(s.revision,next=>{next.activitySessionCreating=true;});
    const result=await host(r.ctx,'sessionController')?.create({workspaceId:s.workspaceId,agentPreset:'standard'});
    if(!result?.sessionId)throw Error('CORE_ACTIVITY_SESSION_CREATE_FAILED');
    const session=member(r.ctx,s.workspaceId,result.sessionId);
    r.store.update(r.store.state.revision,next=>{next.activitySessionId=session.id;next.activitySessionCreating=false;});
    if(wasApplied)r.runningRevision=r.store.state.revision;
    if(r.bridges.life.api.getWorkspaceView?.().binding?.workspaceId!==s.workspaceId)
      r.bridges.life.api.bindWorkspace({workspaceId:s.workspaceId});
    return session;
  }
  async explore(decide,{maxSteps=6,maxDurationMs=30000}={}){
    if(this.busy)throw Error('CORE_ACTIVITY_BUSY');
    if(this.saved.phase!=='Idle')throw Error('CORE_ACTIVITY_BUSY');
    if(typeof decide!=='function'||!Number.isSafeInteger(maxSteps)||maxSteps<1||maxSteps>20||
      !Number.isSafeInteger(maxDurationMs)||maxDurationMs<100||maxDurationMs>60000)throw Error('CORE_ACTIVITY_BUDGET');
    const r=this.runtime,life=r.bridges.life?.api;
    if(!life||!r.bridges.memory?.unifiedRuntime)throw Error('CORE_ACTIVITY_MODULE_REQUIRED');
    this.busy=true;this.cancelled=false;let activity,scope,sessionId;
    const controller=this.controller=new AbortController(),signal=controller.signal;
    const timer=setTimeout(()=>controller.abort(Error('CORE_ACTIVITY_DEADLINE')),maxDurationMs);
    const bounded=task=>waitWithSignal(task,signal);
    try{
      this.saved.phase='Deliberating';this.saved.last=null;this.persist();
      const session=await this.session();sessionId=session.id;scope=`session:${sessionId}`;
      let decision=await bounded(()=>decide({step:0,observations:[],signal}));
      if(!decision){this.saved.phase='Idle';return {status:'idle',events:[]};}
      activity=await life.startActivity({description:'Bounded simulated cross-platform exploration',ownerScope:scope,providerId:this.id});
      if(activity.status!=='running')throw Error('CORE_ACTIVITY_START_FAILED');
      this.saved.phase='Exploring';this.saved.last={activityId:activity.id,sessionId,events:[],steps:0};this.persist();
      const deadline=Date.now()+maxDurationMs,observations=[];
      for(let step=0;decision && step<maxSteps;step++){
        if(this.cancelled||Date.now()>=deadline)throw Error('CORE_ACTIVITY_STOPPED');
        member(r.ctx,r.store.state.workspaceId,sessionId);
        const observation=await bounded(()=>r.platforms.execute(decision.platform,decision.operation,decision.input??{},
          {activityId:activity.id,sessionId,workspaceId:r.store.state.workspaceId},{signal}));
        signal.throwIfAborted();
        if(this.cancelled||Date.now()>=deadline)throw Error('CORE_ACTIVITY_STOPPED');
        const event=await r.experiences.record({platform:decision.platform,operation:decision.operation,
          activityId:activity.id,sessionId,observation,step});
        observations.push(observation);this.saved.last.events.push(event.eventId);this.saved.last.steps=step+1;this.persist();
        await life.checkpointActivity(activity.id,scope);
        decision=step+1<maxSteps?await bounded(()=>decide({step:step+1,observations:structuredClone(observations),signal})):null;
      }
      await life.finishActivity(activity.id,scope,'completed');this.saved.phase='Idle';
      return {status:'completed',...structuredClone(this.saved.last)};
    }catch(e){
      this.saved.phase='Paused';
      if(activity?.id)try{await life.pauseActivity(activity.id,scope);}catch{}
      throw e;
    }finally{clearTimeout(timer);controller.abort(Error('CORE_ACTIVITY_FINISHED'));this.controller=null;this.busy=false;this.persist();}
  }
}
