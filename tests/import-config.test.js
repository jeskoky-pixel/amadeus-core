import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { importConfigurations } from '../src/core/import-config.js';
import { CoreStore, MODULES } from '../src/core/store.js';

function fixture(t){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'core-config-import-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const runtime={root,store:new CoreStore(root)};
  const sources=Object.fromEntries(MODULES.map(n=>[n,path.join(root,'legacy',n)]));
  for(const n of MODULES){fs.mkdirSync(sources[n],{recursive:true});fs.mkdirSync(path.join(root,n));}
  const entries=MODULES.map(n=>({options:{name:`@fg-lab/amadeus-${n}`,disabled:true,config:{
    [n==='memory'?'memoryDir':n==='persona'?'dataDirectory':'databasePath']:
      ['life','state'].includes(n)?path.join(sources[n],`${n}.sqlite`):sources[n],
    preservedUnknown:{value:n}, enabled:false
  }}}));
  return {runtime,sources,entries,editor:{entries:()=>entries}};
}
test('legacy import preserves every config field from disabled trusted matching entries',t=>{
  const {runtime,sources,entries,editor}=fixture(t);
  const modules=importConfigurations(runtime,sources,editor);
  for(const [i,n] of MODULES.entries())assert.deepEqual(modules[n].config,entries[i].options.config);
  assert.deepEqual(runtime.store.state.modules.memory.config,{});
});
test('missing, ambiguous, active or mismatched config fails before any data switch',t=>{
  const {runtime,sources,entries,editor}=fixture(t);
  assert.throws(()=>importConfigurations(runtime,sources,{entries:()=>[]}),/CONFIG_UNAVAILABLE/);
  assert.throws(()=>importConfigurations(runtime,sources,{entries:()=>[...entries,entries[0]]}),/CONFIG_UNAVAILABLE/);
  entries[0].options.disabled=false;
  assert.throws(()=>importConfigurations(runtime,sources,editor),/CONFIG_UNAVAILABLE/);
  entries[0].options.disabled=true;entries[0].options.config.memoryDir=runtime.root;
  assert.throws(()=>importConfigurations(runtime,sources,editor),/SOURCE_MISMATCH/);
  assert.equal(runtime.store.state.revision,0);
});
test('internal generation copy preserves Core config without legacy entries',t=>{
  const {runtime}=fixture(t);
  runtime.store.update(0,s=>{s.modules.life.config={cooldownMinutes:37};});
  const sources=Object.fromEntries(MODULES.map(n=>[n,path.join(runtime.root,n)]));
  assert.deepEqual(importConfigurations(runtime,sources,null),runtime.store.state.modules);
});

test('known legacy default paths match actual released module semantics without scanning user data',async()=>{
  const {legacyDataPath}=await import('../src/core/import-config.js');const home=path.resolve('synthetic-home'),dshHome=path.resolve('synthetic-isolated-dsh');
  assert.equal(legacyDataPath('memory',{}, {home,dshHome}),path.join(home,'.dsh','memory'));
  assert.equal(legacyDataPath('life',{}, {home,dshHome}),path.join(dshHome,'amadeus-life'));
  assert.equal(legacyDataPath('state',{databasePath:''}, {home,dshHome}),path.join(dshHome,'amadeus-state'));
  assert.equal(legacyDataPath('persona',{}, {home,dshHome}),path.join(dshHome,'amadeus-persona'));
  assert.throws(()=>legacyDataPath('memory',{memoryDir:''},{home,dshHome}),/CONFIG_INVALID/);
});

test('external import still works before unused Core module directories exist',t=>{
 const {runtime,sources,editor}=fixture(t);for(const n of MODULES)fs.rmdirSync(path.join(runtime.root,n));
 assert.equal(importConfigurations(runtime,sources,editor).life.config.preservedUnknown.value,'life');
});
