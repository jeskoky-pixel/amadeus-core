import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {CoreActivity} from '../src/core/activity.js';
import {observe,finish} from '../src/core/model-exploration.js';
import {PlatformRegistry,makeSimulatedAdapter} from '../src/platforms/registry.js';

function fixture(t,{recordStatus='stored'}={}){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'core-model-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const ws={id:'w',sessionIds:['activity','other']};let starts=0,records=0,checkpoints=0;
  const runtime={root,status:'ready',store:{state:{workspaceId:'w',activitySessionId:'activity',explorationEnabled:true}},
    ctx:{workspaceRegistry:{get:()=>ws,list:()=>[ws]},sessions:{get:id=>({id,header:{origin:'user'}})}},
    bridges:{memory:{unifiedRuntime:{}},life:{api:{startActivity:async()=>({id:'a'+(++starts),status:'running'}),checkpointActivity:async()=>{checkpoints++;},pauseActivity:async()=>{},finishActivity:async()=>({status:'completed'}),cancelActivity:async()=>({status:'cancelled'})}}},
    experiences:{record:async()=>({eventId:'event'+(++records),status:recordStatus})},platforms:new PlatformRegistry()};
  for(const id of ['simulation-bilibili','simulation-xiaohongshu']){
    runtime.platforms.register(makeSimulatedAdapter(id,[{id:'robot-demo',text:'synthetic'}]));
    runtime.platforms.configure(id,{enabled:true,permissions:['read','search','browse'],maxRequests:20});
  }
  runtime.activity=new CoreActivity(runtime);
  return {runtime,counts:()=>({starts,records}),checkpointCount:()=>checkpoints};
}
const input={goal:'Choose based on synthetic interest',platform:'simulation-bilibili',operation:'browse'};
test('model chooses consecutive platforms in one persistent Life activity and can finish naturally',async t=>{
  const {runtime,counts}=fixture(t);
  const a=await observe(runtime,'activity',input);
  const b=await observe(runtime,'activity',{...input,platform:'simulation-xiaohongshu'});
  assert.equal(a.observation.sessionId,b.observation.sessionId);
  assert.equal(a.observation.activityId,b.observation.activityId);
  assert.deepEqual(counts(),{starts:1,records:2});
  assert.equal((await finish(runtime,'activity')).status,'completed');
  assert.equal(runtime.activity.saved.phase,'Idle');
});
test('other Session, disabled mode and social writes are refused before Life starts',async t=>{
  const {runtime,counts}=fixture(t);
  await assert.rejects(observe(runtime,'other',input),/SESSION_REQUIRED/);
  await assert.rejects(observe(runtime,'activity',{...input,operation:'publish'}),/INPUT/);
  runtime.store.state.explorationEnabled=false;
  await assert.rejects(observe(runtime,'activity',input),/DISABLED/);
  assert.deepEqual(counts(),{starts:0,records:0});
});
test('expired activity pauses and a restart never replays completed observations',async t=>{
  const {runtime,counts}=fixture(t);await observe(runtime,'activity',input);
  runtime.activity.saved.last.deadlineAt=new Date(0).toISOString();
  await assert.rejects(observe(runtime,'activity',input),/BUDGET/);
  assert.equal(runtime.activity.saved.phase,'Paused');
  runtime.activity=new CoreActivity(runtime);
  await assert.rejects(observe(runtime,'activity',input),/RESUME_REQUIRED/);
  assert.equal(counts().records,1);
});
test('step budget closes an activity after six attempts',async t=>{
  const {runtime,counts}=fixture(t);
  for(let i=0;i<6;i++)await observe(runtime,'activity',input);
  assert.deepEqual(counts(),{starts:1,records:6});
  assert.equal(runtime.activity.saved.phase,'Idle');
});
test('revocation during a provider wait rejects the result and writes no experience',async t=>{
  const {runtime,counts}=fixture(t);let resolve;
  runtime.platforms=new PlatformRegistry();runtime.platforms.register({id:'simulation-bilibili',simulated:true,contractVersion:1,capabilities:['browse'],execute:()=>new Promise(r=>{resolve=r;})});
  runtime.platforms.configure('simulation-bilibili',{enabled:true,permissions:['browse']});
  const pending=observe(runtime,'activity',input);await new Promise(r=>setImmediate(r));
  runtime.platforms.configure('simulation-bilibili',{enabled:false});resolve({text:'late'});
  await assert.rejects(pending,/REVOKED/);assert.equal(counts().records,0);
});

test('unconfirmed Experience pauses Activity without a success step or Life checkpoint',async t=>{
  const {runtime,checkpointCount}=fixture(t,{recordStatus:'pending'});
  await assert.rejects(observe(runtime,'activity',input),error=>error.code==='CORE_EXPERIENCE_NOT_STORED');
  assert.equal(checkpointCount(),0);
  assert.equal(runtime.activity.saved.last.steps,0);
  assert.deepEqual(runtime.activity.saved.last.events,[]);
  assert.equal(runtime.activity.saved.phase,'Paused');
});

test('provider transitions preserve terminal state and ignore unrelated activity changes',async t=>{
  const {runtime}=fixture(t),a=runtime.activity;
  a.start({activityId:'active',purposeRef:'test'});
  a.start({activityId:'other',purposeRef:'test'});
  a.saved.last={mode:'model',activityId:'active',deadlineAt:new Date(Date.now()+10000).toISOString(),attempts:1};
  a.saved.phase='Exploring';a.controller=new AbortController();
  a.cancel({activityId:'other'});
  assert.equal(a.saved.phase,'Exploring');assert.equal(a.controller.signal.aborted,false);
  a.pause({activityId:'active'});assert.equal(a.saved.phase,'Paused');
  a.resume({activityId:'active'});assert.equal(a.saved.phase,'Exploring');
  a.cancel({activityId:'active'});assert.equal(a.saved.phase,'Idle');
  assert.equal(new CoreActivity(runtime).saved.phase,'Idle');
});

test('expired paused activity can be finished after disabling exploration, without replay',async t=>{
  const {runtime,counts}=fixture(t);await observe(runtime,'activity',input);
  runtime.activity.saved.last.deadlineAt=new Date(0).toISOString();
  await assert.rejects(observe(runtime,'activity',input),/BUDGET/);
  runtime.store.state.explorationEnabled=false;
  assert.equal((await finish(runtime,'activity')).status,'cancelled');
  assert.equal(runtime.activity.saved.phase,'Idle');assert.equal(counts().records,1);
});

test('activity prompt eligibility follows trusted membership and subagent exclusion',async t=>{
  const {canExplore}=await import('../src/core/model-exploration.js');
  const {runtime}=fixture(t);assert.equal(canExplore(runtime,'activity'),true);
  runtime.ctx.workspaceRegistry.get().sessionIds=[];
  assert.equal(canExplore(runtime,'activity'),false);
  runtime.ctx.workspaceRegistry.get().sessionIds=['activity'];
  runtime.ctx.sessions.get=()=>({id:'activity',header:{origin:'subagent'}});
  assert.equal(canExplore(runtime,'activity'),false);
});

test('unconfirmed Life completion is not reported as successful',async t=>{
  const {runtime}=fixture(t);await observe(runtime,'activity',input);
  runtime.bridges.life.api.finishActivity=async()=>({status:'unknown'});
  await assert.rejects(finish(runtime,'activity'),/FINISH_UNCONFIRMED/);
  assert.notEqual(runtime.activity.saved.phase,'Idle');
});

test('social model tool shares Life activity and refuses read-tool write escalation',async t=>{
 const {runtime,counts}=fixture(t),id='a'.repeat(24);const adapter={id:'xiaohongshu-browser',contractVersion:2,mode:'real',requiresAccount:true,socialWrites:true,capabilities:['comment'],execute:async(op,arg,ctx)=>{ctx.assertAuthorized();return {status:'confirmed',operation:op,contentId:arg.id};}};
 runtime.platforms=new PlatformRegistry({journalFile:path.join(runtime.root,'actions.json'),trustedRealAdapters:[adapter],accounts:{status:()=>null,context:()=>({accountId:'u',credentials:{}}),epoch:()=>0}});runtime.platforms.register(adapter);
 runtime.platforms.configure(adapter.id,{enabled:true,autonomous:true,permissions:['comment'],social:{noteIds:[id],sessionIds:['activity']}});
 const args={goal:'Synthetic interaction',platform:adapter.id,operation:'comment',id,text:'synthetic'};
 await assert.rejects(observe(runtime,'activity',args),/INPUT/);
 await assert.rejects(observe(runtime,'other',args,{social:true}),/SESSION_REQUIRED/);
 const result=await observe(runtime,'activity',args,{social:true});assert.equal(result.observation.evidenceLevel,'live-action');assert.deepEqual(counts(),{starts:1,records:1});
 await assert.rejects(observe(runtime,'activity',args,{social:true}),/ALREADY_RECORDED/);assert.deepEqual(counts(),{starts:1,records:1});
});

test('capability discovery exposes grants only to activity session and future platform appears in interact schema',async t=>{
 const {runtime}=fixture(t);const adapter={id:'future-platform',contractVersion:2,mode:'real',socialWrites:true,capabilities:['like'],normalizeSocialInput:(_op,input)=>input,execute:async()=>({})};runtime.platforms=new PlatformRegistry({trustedRealAdapters:[adapter]});runtime.platforms.register(adapter);
 const tools=new Map();const {registerExplorationTools}=await import('../src/core/model-exploration.js');registerExplorationTools({tools:{register:t=>tools.set(t.name,t)}},runtime);
 assert.ok(tools.get('amadeus_platform_interact').parameters.properties.platform.enum.includes('future-platform'));
 const discovery=tools.get('amadeus_platform_capabilities');assert.throws(()=>discovery.execute({}, {agent:{session:{id:'other'}}}),/ACTIVITY_SESSION_REQUIRED/);
 const result=discovery.execute({}, {agent:{session:{id:'activity'}}});assert.equal(result.contractVersion,1);assert.equal(result.platforms[0].enabled,false);assert.deepEqual(result.platforms[0].permissions,[]);assert.ok(!JSON.stringify(result).includes('cookie'));
});