import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Experiences } from '../src/core/experiences.js';

test('generation switch cannot resolve an old receipt against a replacement database',async t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'core-events-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const ws={id:'w',sessionIds:['s']},session={id:'s',header:{origin:'user'}};
  let reads=0,content='original';
  const runtime={root,store:{state:{workspaceId:'w'}},ctx:{
    workspaceRegistry:{get:()=>ws,list:()=>[ws]},sessions:{get:()=>session}},bridges:{memory:{
      unifiedRuntime:{authorize:{run:(_s,fn)=>fn(),delivery:()=>{}}},
      service:{saveWithDedupe:()=>({memory:{id:'colliding-row'}})},
      store:{getById:()=>{reads++;return {id:'colliding-row',content};}}
    }}};
  let events=new Experiences(runtime);
  const input={platform:'simulation-test',activityId:'a',sessionId:'s',operation:'read',observation:{text:'synthetic'},step:0};
  const original=await events.record(input);
  assert.equal(events.read(original.eventId,'s').memory.content,'original');
  runtime.store.state.dataGeneration='new';content='replacement';reads=0;
  assert.throws(()=>events.read(original.eventId,'s'),/CORE_EXPERIENCE_DENIED/);
  assert.equal(reads,0);assert.deepEqual(events.ownerList(),[]);
  const replacement=await events.record(input);
  assert.notEqual(replacement.eventId,original.eventId);
  events=new Experiences(runtime);
  assert.equal(events.read(replacement.eventId,'s').memory.content,'replacement');
  delete runtime.store.state.dataGeneration;content='original';
  assert.equal(events.read(original.eventId,'s').memory.content,'original');
  assert.throws(()=>events.read(replacement.eventId,'s'),/CORE_EXPERIENCE_DENIED/);
});
