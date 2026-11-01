import {member} from './host.js';
import {waitWithSignal} from './deadline.js';
import {PLATFORM_READS} from '../platforms/registry.js';

function actor(runtime,sessionId,requireEnabled=true){
  if(runtime.status!=='ready'||(requireEnabled&&runtime.store.state.explorationEnabled!==true))throw Error('CORE_EXPLORATION_DISABLED');
  if(!sessionId||sessionId!==runtime.store.state.activitySessionId)throw Error('CORE_ACTIVITY_SESSION_REQUIRED');
  member(runtime.ctx,runtime.store.state.workspaceId,sessionId);
  if(!runtime.bridges.life?.api||(requireEnabled&&!runtime.bridges.memory?.unifiedRuntime))throw Error('CORE_ACTIVITY_MODULE_REQUIRED');
}

export function canExplore(runtime,sessionId){
  try{actor(runtime,sessionId);return true;}catch{return false;}
}

async function endActivity(runtime,sessionId,last){
  const life=runtime.bridges.life.api,activity=runtime.activity,scope=`session:${sessionId}`;
  try{
    const view=await life.getActivityStatus?.(last.activityId,scope);
    if(view?.revoked)throw Error('CORE_ACTIVITY_FINISH_UNCONFIRMED');
    const status=view?.activity?.status??(activity.saved.phase==='Paused'?'paused':'running');
    let ended;
    if(['completed','cancelled','failed'].includes(status))ended={status};
    else if(status==='running'&&activity.saved.phase!=='Paused')ended=await life.finishActivity(last.activityId,scope,'completed');
    else ended=await life.cancelActivity(last.activityId,scope);
    if(!['completed','cancelled','failed'].includes(ended?.status))throw Error('CORE_ACTIVITY_FINISH_UNCONFIRMED');
    activity.saved.phase='Idle';activity.persist();return {status:ended.status,eventIds:[...last.events]};
  }catch(error){activity.saved.phase='Paused';activity.persist();throw error;}
}

// This is a tool-driven continuation in the existing persistent Agent. Life
// remains the only wake scheduler; Core never invokes an extra model or timer
// to manufacture decisions. State/Memory/Persona retain their normal injection.
export async function observe(runtime,sessionId,input){
  actor(runtime,sessionId);
  const activity=runtime.activity,life=runtime.bridges.life.api,scope=`session:${sessionId}`;
  if(activity.busy)throw Error('CORE_ACTIVITY_BUSY');
  if(!input||!['simulation-bilibili','simulation-xiaohongshu'].includes(input.platform)||
    !PLATFORM_READS.includes(input.operation)||typeof input.goal!=='string'||
    !input.goal.trim()||input.goal.length>1024||
    (input.query!==undefined&&(typeof input.query!=='string'||input.query.length>512))||
    (input.id!==undefined&&(typeof input.id!=='string'||input.id.length>128)))throw Error('CORE_EXPLORATION_INPUT');
  if(activity.saved.phase==='Paused')throw Error('CORE_ACTIVITY_RESUME_REQUIRED');
  activity.busy=true;
  let last=activity.saved.last;
  let controller,timer;
  try{
    if(activity.saved.phase==='Idle'){
      const budget=runtime.store.state.activityBudgetMs??120000;
      if(!Number.isSafeInteger(budget)||budget<10000||budget>300000)throw Error('CORE_ACTIVITY_BUDGET');
      const deadlineAt=new Date(Date.now()+budget).toISOString();
      const created=await life.startActivity({description:input.goal,ownerScope:scope,providerId:activity.id,deadlineAt});
      if(created.status!=='running')throw Error('CORE_ACTIVITY_START_FAILED');
      last=activity.saved.last={mode:'model',activityId:created.id,sessionId,goal:input.goal,
        deadlineAt,attempts:0,steps:0,events:[]};
      activity.saved.phase='Exploring';activity.persist();
    }
    if(last?.mode!=='model'||last.sessionId!==sessionId)throw Error('CORE_ACTIVITY_BUSY');
    const remaining=Date.parse(last.deadlineAt)-Date.now();
    if(!Number.isFinite(remaining)||remaining<=0||last.attempts>=6)throw Error('CORE_ACTIVITY_BUDGET');
    const step=last.attempts++;activity.persist();
    controller=activity.controller=new AbortController();
    timer=setTimeout(()=>controller.abort(Error('CORE_ACTIVITY_DEADLINE')),Math.min(remaining,30000));
    const observation=await waitWithSignal(()=>runtime.platforms.execute(input.platform,input.operation,
      {id:input.id,query:input.query},{activityId:last.activityId,sessionId,workspaceId:runtime.store.state.workspaceId},
      {signal:controller.signal}),controller.signal);
    controller.signal.throwIfAborted();actor(runtime,sessionId);
    const event=await runtime.experiences.record({platform:input.platform,operation:input.operation,
      activityId:last.activityId,sessionId,step,observation});
    last.steps++;last.events.push(event.eventId);activity.persist();
    await life.checkpointActivity(last.activityId,scope);
    if(last.attempts>=6){
      await endActivity(runtime,sessionId,last);
    }
    return {eventId:event.eventId,observation,remainingSteps:6-last.attempts,deadlineAt:last.deadlineAt};
  }catch(error){
    if(last?.mode==='model'&&last.activityId){
      if(activity.saved.phase!=='Idle'){
        activity.saved.phase='Paused';try{await life.pauseActivity(last.activityId,scope);}catch{}
      }
    }
    throw error;
  }finally{
    clearTimeout(timer);controller?.abort(Error('CORE_ACTIVITY_FINISHED'));activity.controller=null;
    activity.busy=false;activity.persist();
  }
}

export async function finish(runtime,sessionId){
  actor(runtime,sessionId,false);const activity=runtime.activity,last=activity.saved.last;
  if(activity.busy)throw Error('CORE_ACTIVITY_BUSY');
  if(!last?.activityId){activity.saved.phase='Idle';activity.persist();return {status:'idle'};}
  return endActivity(runtime,sessionId,last);
}

export function registerExplorationTools(ctx,runtime){
  ctx.tools.register({name:'amadeus_explore_read',
    description:'Only in the prepared Core Activity Session: choose simulated platform reads based on your interests. Synthetic evidence, not real platforms. At most six requests; configurable total wall-clock budget (default two minutes), each request at most 30 seconds. You may stay silent or finish at any time.',
    parameters:{type:'object',properties:{goal:{type:'string',maxLength:1024},platform:{type:'string',enum:['simulation-bilibili','simulation-xiaohongshu']},operation:{type:'string',enum:PLATFORM_READS},id:{type:'string',maxLength:128},query:{type:'string',maxLength:512}},required:['goal','platform','operation'],additionalProperties:false},
    execute:(args,exec)=>runtime.serial(()=>observe(runtime,exec?.agent?.session?.id,args)),
    output:{schema:{type:'object',additionalProperties:true},render:(_args,value)=>[{type:'text',text:JSON.stringify(value)}]}});
  ctx.tools.register({name:'amadeus_explore_finish',description:'End the current Core simulated exploration. Do not continue merely to spend the remaining budget.',
    parameters:{type:'object',properties:{},additionalProperties:false},
    execute:(_args,exec)=>runtime.serial(()=>finish(runtime,exec?.agent?.session?.id)),
    output:{schema:{type:'object',additionalProperties:true},render:(_args,value)=>[{type:'text',text:JSON.stringify(value)}]}});
}
