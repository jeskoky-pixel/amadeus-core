import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import vm from 'node:vm';
import {CoreRuntime} from '../src/core/runtime.js';
import {createCoreHandler} from '../src/core/http.js';

const panel=fs.readFileSync(new URL('../src/client/panel.js',import.meta.url),'utf8');
const memoryGui=fs.readFileSync(new URL('../src/modules/memory/lib/client.js',import.meta.url),'utf8');
const guiFields=vm.runInNewContext(memoryGui.match(/const AM_CONFIG_FIELDS = (\[[\s\S]*?\]);/)[1]);
async function fixture(t){
 const root=fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(),'core-memory-form-')));
 const ctx={connection:{admit:req=>({peer:{principal:{kind:req.headers['x-test-owner']==='no'?'agent':'owner'}}})}};
 let runtime=new CoreRuntime(ctx,root);runtime.runningRevision=0;
 const server=http.createServer((req,res)=>createCoreHandler(ctx,runtime)(req,res));
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{await new Promise(r=>{server.close(r);server.closeAllConnections();});fs.rmSync(root,{recursive:true,force:true});});
 const request=async(route,body,headers={})=>{const response=await fetch(`http://127.0.0.1:${server.address().port}/api/amadeus-core`+route,{method:body?'POST':'GET',headers:{'content-type':'application/json','x-amadeus-core':'1',...headers},...(body?{body:JSON.stringify(body)}:{})});const result=await response.json();if(!result.ok)throw Error(result.error);return result.data;};
 // Execute the shipped Config Forms adapter used by memoryConfigForm(ctx).
 const createForms=()=>vm.runInNewContext(panel.slice(panel.indexOf('function forms()'),panel.indexOf('const tabs='))+';forms()',{api:request});
 return {root,request,createForms,get runtime(){return runtime;},restart(){runtime=new CoreRuntime(ctx,root);return runtime;}};
}
test('Memory GUI form adapter saves, reloads after restart and restores every GUI default',async t=>{
 const f=await fixture(t),service=f.createForms(),form=service.get('dsh-mneme');await form.refresh();
 let changed=0;service.subscribeChanges(()=>changed++);
 f.runtime.activeConfigs.memory={maxInjectedItems:5};
 const initial=form.getSnapshot();assert.equal(initial.writable,true);
 assert.equal(await form.mutate([{op:'set',path:['maxInjectedItems'],value:9},{op:'set',path:['language'],value:'en'}],initial.revision),true);
 assert.equal(changed,1);assert.equal(form.getSnapshot().pendingRestart,true);
 assert.equal(f.runtime.activeConfigs.memory.maxInjectedItems,5,'save does not interrupt a running module');
 assert.equal(fs.existsSync(path.join(f.root,'core.json')),true);
 f.restart();const restored=f.createForms().get('dsh-mneme');await restored.refresh();
 assert.equal(restored.getSnapshot().value.maxInjectedItems,9);assert.equal(restored.getSnapshot().value.language,'en');
 // Same complete unset operation list that restoreConfig() sends in Memory GUI.
 await restored.mutate(guiFields.map(field=>({op:'unset',path:[field.key]})),restored.getSnapshot().revision);
 f.restart();const defaults=f.createForms().get('dsh-mneme');await defaults.refresh();
 for(const field of guiFields)assert.equal(defaults.getSnapshot().value[field.key],field.default,field.key);
 for(const [key,value] of Object.entries({sceneIsolationEnabled:true,sceneStrictQQ:true,unifiedSessionAclEnabled:true,personaEnabled:false}))assert.equal(defaults.getSnapshot().value[key],value);
 assert.ok(fs.readdirSync(path.join(f.root,'backups')).length>=1);
});
test('Memory form rejects protected/unknown/nested fields and invalid types without persisting',async t=>{
 const f=await fixture(t);const before=JSON.stringify(f.runtime.store.state);
 for(const key of ['memoryDir','sceneIsolationEnabled','sceneStrictQQ','unifiedSessionAclEnabled','personaEnabled','__coreBridge','__proto__','unknown']){
  for(const op of ['set','unset'])await assert.rejects(f.request('/forms/memory',{revision:0,ops:[{op,path:[key],value:false}]}),/CORE_CONFIG_INVALID/);
 }
 for(const op of [null,{op:'set',path:['maxInjectedItems'],value:99},{op:'set',path:['maxInjectedItems'],value:'9'},{op:'set',path:['language'],value:'invalid'},{op:'set',path:['maxInjectedItems','nested'],value:2}])await assert.rejects(f.request('/forms/memory',{revision:0,ops:[op]}),/CORE_CONFIG_INVALID/);
 assert.equal(JSON.stringify(f.runtime.store.state),before);assert.equal(fs.existsSync(path.join(f.root,'core.json')),false);
 await assert.rejects(f.request('/forms/memory',{revision:0,ops:[]},{'x-test-owner':'no'}),/OWNER_REQUIRED/);
 await assert.rejects(f.request('/forms/memory',{revision:0,ops:[]},{'x-amadeus-core':''}),/MARKER_REQUIRED/);
});
test('Memory concurrent stale form edits conflict; imported extras survive; effective policy cannot drift',async t=>{
 const f=await fixture(t);f.runtime.store.state.modules.memory.config={futureImportedSetting:'preserve',sceneStrictQQ:false,personaEnabled:true};
 const a=f.createForms().get('dsh-mneme'),b=f.createForms().get('dsh-mneme');await Promise.all([a.refresh(),b.refresh()]);
 const revision=a.getSnapshot().revision;
 await a.mutate([{op:'set',path:['maxInjectedItems'],value:8}],revision);
 await assert.rejects(b.mutate([{op:'set',path:['maxInjectedItems'],value:10}],revision),/REVISION_CONFLICT/);
 assert.equal(b.getSnapshot().value.maxInjectedItems,8);assert.equal(f.runtime.store.state.modules.memory.config.futureImportedSetting,'preserve');
 assert.equal(b.getSnapshot().value.sceneStrictQQ,true);assert.equal(b.getSnapshot().value.personaEnabled,false);
});

test('Memory first asynchronous form snapshot hydrates saved values instead of reporting a false conflict',()=>{
 const helpers=memoryGui.slice(memoryGui.indexOf('function configValuesFromSnapshot('),memoryGui.indexOf('function memoryConfigForm('));
 const transition=vm.runInNewContext(helpers+';configFormTransition',{AM_CONFIG_FIELDS:guiFields});
 const previous=Object.fromEntries(guiFields.map(f=>[f.key,f.default]));
 const ready={status:'ready',revision:12,value:{...previous,maxInjectedItems:9}};
 const result=transition(previous,ready,{status:'loading'});
 assert.equal(result.values.maxInjectedItems,9);assert.equal(result.conflict,false);
 const conflict=transition({...previous,maxInjectedItems:7},ready,{status:'ready',revision:11,value:previous});
 assert.equal(conflict.conflict,true);assert.equal(conflict.values.maxInjectedItems,7);
});
