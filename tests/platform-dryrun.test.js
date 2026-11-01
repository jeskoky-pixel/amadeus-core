import test from 'node:test';import assert from 'node:assert/strict';import {PlatformRegistry} from '../src/platforms/registry.js';import {makeBilibiliMock,makeXiaohongshuMock} from '../src/platforms/mock-platforms.js';
const identity={sessionId:'synthetic-session',workspaceId:'synthetic-workspace',activityId:'synthetic-activity'};
test('social dry-run uses actual registry permission route and each platform grant stays independent',async()=>{
 const r=new PlatformRegistry();r.register(makeBilibiliMock());r.register(makeXiaohongshuMock());for(const p of r.list())r.configure(p.id,{enabled:true,permissions:['read']});
 for(const id of ['simulation-bilibili','simulation-xiaohongshu'])await assert.rejects(r.execute(id,'comment',{id:'robot-demo',text:'synthetic'},identity),/DENIED/);
 r.configure('simulation-bilibili',{enabled:true,permissions:['read','comment']});const value=await r.execute('simulation-bilibili','comment',{id:'robot-demo',text:'synthetic'},identity);assert.equal(value.externalAction,false);assert.equal(value.evidenceLevel,'simulation');assert.equal(value.observedEvidence.dryRun,true);
 await assert.rejects(r.execute('simulation-xiaohongshu','comment',{id:'robot-demo',text:'synthetic'},identity),/DENIED/);
 r.configure('simulation-bilibili',{enabled:false});await assert.rejects(r.execute('simulation-bilibili','comment',{id:'robot-demo',text:'synthetic'},identity),/DENIED/);
});
