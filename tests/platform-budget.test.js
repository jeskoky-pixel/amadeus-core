import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PlatformRegistry } from '../src/platforms/registry.js';

const identity={activityId:'a',sessionId:'s',workspaceId:'w'};
test('daily budget survives restart, failure, re-registration and clock rollback',async t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'core-budget-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const budgetFile=path.join(root,'budget.json');let time=5*86400000;
  const make=()=>{
    const registry=new PlatformRegistry({budgetFile,now:()=>time});
    const unregister=registry.register({id:'test',contractVersion:1,simulated:true,capabilities:['read'],
      execute:async()=>{throw Error('NETWORK_FAILURE');}});
    registry.configure('test',{enabled:true,permissions:['read'],maxRequests:1});
    return {registry,unregister};
  };
  let {registry,unregister}=make();
  await assert.rejects(registry.execute('test','read',{},identity),/NETWORK_FAILURE/);
  unregister();({registry}=make());
  await assert.rejects(registry.execute('test','read',{},identity),/CORE_PLATFORM_BUDGET/);
  time-=86400000;({registry}=make());
  await assert.rejects(registry.execute('test','read',{},identity),/CORE_PLATFORM_BUDGET/);
  time=6*86400000;
  await assert.rejects(registry.execute('test','read',{},identity),/NETWORK_FAILURE/);
  assert.equal(JSON.parse(fs.readFileSync(budgetFile)).used.test,1);
});

test('aborted queued call never dispatches and late result is rejected',async()=>{
  const registry=new PlatformRegistry();let finish,calls=0;
  registry.register({id:'test',contractVersion:1,simulated:true,capabilities:['read'],execute:()=>{
    calls++;return new Promise(resolve=>{finish=resolve;});
  }});
  registry.configure('test',{enabled:true,permissions:['read']});
  const controller=new AbortController();
  const first=registry.execute('test','read',{},identity,{signal:controller.signal});
  const second=registry.execute('test','read',{},identity,{signal:controller.signal});
  const checked=Promise.all([assert.rejects(first,/CANCELLED/),assert.rejects(second,/CANCELLED/)]);
  await new Promise(resolve=>setImmediate(resolve));
  controller.abort(Error('CANCELLED'));finish({text:'late'});await checked;
  assert.equal(calls,1);assert.equal(registry.list()[0].used,1);
});
