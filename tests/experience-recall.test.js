import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createStore} from '../src/modules/memory/src/store.js';
import {createService} from '../src/modules/memory/src/service.js';
import {Experiences} from '../src/core/experiences.js';
import {PlatformRegistry} from '../src/platforms/registry.js';

test('separate real activities stay separate searchable memories instead of appending beyond retrieval window',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'core-recall-')),store=createStore(':memory:');
 t.after(()=>{store.close();fs.rmSync(root,{recursive:true,force:true});});
 const service=createService({store,mirror:null,config:{}}),runtime={root,
  ctx:{workspaceRegistry:{get:()=>({id:'w',sessionIds:['s']}),list:()=>[{id:'w',sessionIds:['s']}]},sessions:{get:id=>({id,header:{origin:'user'}})}},
  store:{state:{workspaceId:'w'}},bridges:{memory:{unifiedRuntime:{authorize:{run:(_s,fn)=>fn()}},service}}};
 const journal=new Experiences(runtime),adapter={id:'bilibili',mode:'real',contractVersion:2,capabilities:['browse'],execute:async(_operation,input)=>({items:[{id:'BV1xx411c7mD',title:input.title,description:'实际返回的标题和简介，不代表观看视频',sourceUrl:'https://www.bilibili.com/video/BV1xx411c7mD'}]})};
 const registry=new PlatformRegistry({trustedRealAdapters:[adapter]});registry.register(adapter);registry.configure(adapter.id,{enabled:true,permissions:['browse'],maxRequests:10});
 const results=[];let lastObservation;
 for(const [activityId,title]of [['a1','琥珀航图的设计'],['a2','靛蓝引擎的新进展']]){
  const observation=await registry.execute('bilibili','browse',{title},{workspaceId:'w',sessionId:'s',activityId});
  lastObservation=observation;
  results.push(await journal.record({platform:'bilibili',activityId,sessionId:'s',operation:'browse',step:0,observation}));
 }
 assert.notEqual(results[0].memoryId,results[1].memoryId,'distinct activities must not merge by generic platform/operation title');
 assert.equal(store.count(),2);const row=store.getById(results[1].memoryId);
 assert.match(row.title,/B站/);assert.match(row.content.slice(0,3000),/靛蓝引擎的新进展/);
 assert.match(row.content.slice(0,3000),/B站/);assert.equal(JSON.parse(row.content).facts.untrustedContent,true);
 await journal.record({platform:'bilibili',activityId:'a2',sessionId:'s',operation:'browse',step:0,observation:lastObservation});
 assert.equal(store.count(),2,'existing journal receipt remains idempotent');
});

test('native XHS detail wrapper retains returned note text and comments in the compact summary',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'core-detail-recall-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));let saved;
 const runtime={root,ctx:{workspaceRegistry:{get:()=>({id:'w',sessionIds:['s']}),list:()=>[{id:'w',sessionIds:['s']}]},sessions:{get:id=>({id,header:{}})}},store:{state:{workspaceId:'w'}},bridges:{memory:{unifiedRuntime:{authorize:{run:(_s,fn)=>fn()}},service:{saveWithDedupe:row=>{saved=row;return{memory:{id:'memory'}};}}}}};
 const adapter={id:'xiaohongshu-browser',mode:'real',contractVersion:2,capabilities:['read'],execute:async()=>({data:{feed_id:'0123456789abcdef01234567',data:{note:{title:'灯塔修缮',desc:'使用青石修复塔基'},comments:{list:[{content:'潮水退去后施工'}]}}}})};
 const registry=new PlatformRegistry({trustedRealAdapters:[adapter]});registry.register(adapter);registry.configure(adapter.id,{enabled:true,permissions:['read']});
 const observation=await registry.execute(adapter.id,'read',{}, {workspaceId:'w',sessionId:'s',activityId:'a'});
 await new Experiences(runtime).record({platform:adapter.id,sessionId:'s',activityId:'a',operation:'read',step:0,observation});
 const summary=JSON.parse(saved.content).readableExperience;
 assert.equal(summary.items[0].description,'使用青石修复塔基');assert.deepEqual(summary.comments,['潮水退去后施工']);
});

test('large XHS metadata keeps only actual bounded observations near the start of a valid evidence record',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'core-xhs-recall-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));let saved;
 const runtime={root,ctx:{workspaceRegistry:{get:()=>({id:'w',sessionIds:['s']}),list:()=>[{id:'w',sessionIds:['s']}]},sessions:{get:id=>({id,header:{}})}},store:{state:{workspaceId:'w'}},bridges:{memory:{unifiedRuntime:{authorize:{run:(_s,fn)=>fn()}},service:{saveWithDedupe:row=>{saved=row;return{memory:{id:'memory'}};}}}}};
 const adapter={id:'xiaohongshu-browser',mode:'real',contractVersion:2,capabilities:['browse'],execute:async()=>({data:{feeds:[{id:'0123456789abcdef01234567',xsecToken:'synthetic-not-in-summary',noteCard:{displayTitle:'海边灯塔的修复记录',user:{nickname:'测试作者'},cover:{url:'https://example.invalid/'+('x'.repeat(12000))}}}]}})};
 const registry=new PlatformRegistry({trustedRealAdapters:[adapter]});registry.register(adapter);registry.configure(adapter.id,{enabled:true,permissions:['browse']});
 const observation=await registry.execute(adapter.id,'browse',{}, {workspaceId:'w',sessionId:'s',activityId:'a'});
 await new Experiences(runtime).record({platform:adapter.id,sessionId:'s',activityId:'a',operation:'browse',step:0,observation});
 const body=JSON.parse(saved.content);assert.match(saved.content.slice(0,3000),/小红书/);assert.match(saved.content.slice(0,3000),/海边灯塔的修复记录/);
 assert.equal(body.facts.untrustedContent,true);assert.equal(body.interpretation,null);
 assert.ok(!JSON.stringify(body.readableExperience).includes('synthetic-not-in-summary'));
});
