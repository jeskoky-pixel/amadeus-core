import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { snapshotModules } from './migration.js';
import { legacyConflicts } from './ownership.js';
import { assertIdle, host } from './host.js';
import { importConfigurations } from './import-config.js';
import { atomicJson } from './store.js';

function leaseStopped(file){
  if(!fs.existsSync(file))return false;
  const db=new DatabaseSync(path.toNamespacedPath(file),{readOnly:true});
  try{
    if(!db.prepare("SELECT 1 FROM sqlite_master WHERE name='runtime_leases' AND type='table'").get())return true;
    for(const row of db.prepare('SELECT pid FROM runtime_leases').all()){
      if(!Number.isSafeInteger(row.pid)||row.pid<=0)return false;
      try{process.kill(row.pid,0);return false;}catch(e){if(e.code!=='ESRCH')return false;}
    }
    return true;
  }finally{db.close();}
}
function checkBindings(root,workspaceId){
  const memory=JSON.parse(fs.readFileSync(path.join(root,'memory','workspace-binding.json'),'utf8'));
  const persona=JSON.parse(fs.readFileSync(path.join(root,'persona','persona.json'),'utf8'));
  if(memory.workspaceId!==workspaceId||persona.workspaceId!==workspaceId)throw Error('CORE_IMPORT_WORKSPACE_MISMATCH');
  for(const name of ['life','state']){
    const db=new DatabaseSync(path.toNamespacedPath(path.join(root,name,`${name}.sqlite`)),{readOnly:true});
    try{
      const bound=name==='life'?db.prepare('SELECT workspace_id FROM life_workspace WHERE singleton=1').get()?.workspace_id:
        db.prepare("SELECT value FROM meta WHERE key='workspace.binding.id'").get()?.value;
      if(bound!==workspaceId)throw Error('CORE_IMPORT_WORKSPACE_MISMATCH');
    }finally{db.close();}
  }
}

// Import creates a separate immutable snapshot and a distinct live generation.
// Switching the pointer is one atomic CoreStore write; the previous generation
// remains untouched for rollback. No source is renamed or removed.
export async function importData(runtime,input){
  if(input.offlineConfirmed!==true)throw Error('CORE_IMPORT_STOP_CONFIRMATION_REQUIRED');
  if(input.revision!==runtime.store.state.revision)throw Error('CORE_REVISION_CONFLICT');
  if(!runtime.store.state.workspaceId)throw Error('CORE_WORKSPACE_MISSING');
  if(runtime.activity.busy||['Exploring','Deliberating','Paused'].includes(runtime.activity.saved.phase))throw Error('CORE_ACTIVITY_BUSY');
  assertIdle(runtime.ctx,runtime.store.state.workspaceId);
  const sources=input.sources;
  const importedModules=importConfigurations(runtime,sources,host(runtime.ctx,'configEditor'));
  const stopped=()=>legacyConflicts(host(runtime.ctx,'configEditor')).length===0&&
    leaseStopped(path.join(sources.life,'life.sqlite'))&&leaseStopped(path.join(sources.state,'state.sqlite'));
  const old=runtime.store.snapshot();await runtime.stopModules();
  try{
    const id=randomUUID(),generation=path.join(runtime.root,'generations',id);
    fs.mkdirSync(generation,{recursive:true});
    const backup=path.join(generation,'backup'),live=path.join(generation,'live');
    await snapshotModules({sources,targetRoot:backup,assertStopped:stopped});
    checkBindings(backup,old.workspaceId);
    await snapshotModules({sources:Object.fromEntries(['memory','life','state','persona'].map(n=>[n,path.join(backup,n)])),targetRoot:live,assertStopped:stopped});
    atomicJson(path.join(generation,'configuration.json'),{schema:1,previous:old.modules,imported:importedModules});
    runtime.store.update(old.revision,s=>{s.previousDataGeneration=s.dataGeneration??null;s.previousModules=old.modules;s.modules=importedModules;s.dataGeneration=id;});
    await runtime.mount();
    return {status:'imported',generation:id,previousGeneration:old.dataGeneration??null,sourceUnchanged:true};
  }catch(error){
    // A failed mount never leaves the new pointer selected. Its files remain
    // available for diagnosis; no recovery code deletes user data.
    await runtime.stopModules();
    if(runtime.store.state.dataGeneration!==old.dataGeneration)runtime.store.update(runtime.store.state.revision,s=>{
      if(old.dataGeneration)s.dataGeneration=old.dataGeneration;else delete s.dataGeneration;
      s.previousDataGeneration=old.previousDataGeneration??null;
      s.modules=old.modules;
      if(old.previousModules)s.previousModules=old.previousModules;else delete s.previousModules;
    });
    try{await runtime.mount();}catch{runtime.status='blocked';runtime.problem='CORE_IMPORT_RECOVERY_REQUIRED';}
    throw error;
  }
}

export async function rollbackData(runtime,input){
  const old=runtime.store.snapshot();
  if(input.revision!==old.revision)throw Error('CORE_REVISION_CONFLICT');
  if(!Object.hasOwn(old,'previousDataGeneration'))throw Error('CORE_NO_PREVIOUS_GENERATION');
  if(runtime.activity.busy||['Exploring','Deliberating','Paused'].includes(runtime.activity.saved.phase))throw Error('CORE_ACTIVITY_BUSY');
  assertIdle(runtime.ctx,old.workspaceId);await runtime.stopModules();
  runtime.store.update(old.revision,s=>{s.dataGeneration=old.previousDataGeneration;s.previousDataGeneration=old.dataGeneration??null;s.modules=old.previousModules??old.modules;s.previousModules=old.modules;});
  try{await runtime.mount();return {status:'restored',generation:runtime.store.state.dataGeneration??'original'};}
  catch(error){
    await runtime.stopModules();runtime.store.update(runtime.store.state.revision,s=>{s.dataGeneration=old.dataGeneration;s.previousDataGeneration=old.previousDataGeneration;s.modules=old.modules;if(old.previousModules)s.previousModules=old.previousModules;else delete s.previousModules;});
    try{await runtime.mount();}catch{runtime.status='blocked';runtime.problem='CORE_IMPORT_RECOVERY_REQUIRED';}
    throw error;
  }
}
