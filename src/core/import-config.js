import path from 'node:path';
import fs from 'node:fs';
import {homedir} from 'node:os';
import { MODULES } from './store.js';
const ids={memory:'dsh-mneme',life:'amadeus-life',state:'amadeus-state',persona:'amadeus-persona'};

// Matches the retained released modules, rather than guessing from a folder name.
// Memory's default is home-based; the other three explicitly honor DSH_HOME.
export function legacyDataPath(name,cfg,{home=homedir(),dshHome=process.env.DSH_HOME||path.join(home,'.dsh')}={}){
  if(name==='memory'){
    const value=cfg.memoryDir??'~/.dsh/memory';
    if(typeof value!=='string'||!value)throw Error('CORE_IMPORT_CONFIG_INVALID');
    return value.startsWith('~')?path.join(home,value.slice(1)):value;
  }
  if(name==='persona')return cfg.dataDirectory??path.join(dshHome,'amadeus-persona');
  const value=cfg.databasePath;
  if(value===undefined||value==='')return path.join(dshHome,`amadeus-${name}`);
  if(typeof value!=='string')throw Error('CORE_IMPORT_CONFIG_INVALID');
  return path.dirname(value);
}

export function importConfigurations(runtime,sources,editor){
  if(!sources||typeof sources!=='object'||MODULES.some(n=>typeof sources[n]!=='string'))throw Error('CORE_IMPORT_SOURCES_REQUIRED');
  const current=runtime.store.snapshot(),generation=current.dataGeneration;
  const base=generation?path.join(runtime.root,'generations',generation,'live'):runtime.root;
  const canonical=p=>{const real=fs.realpathSync(p);return process.platform==='win32'?real.toLowerCase():real;};
  const same=(a,b)=>fs.existsSync(a)&&fs.existsSync(b)&&canonical(a)===canonical(b);
  // An internal generation copy retains its exact Core config. Arbitrary legacy
  // directories require matching disabled Host entries; never silently default.
  if(MODULES.every(n=>same(sources[n],path.join(base,n))))return structuredClone(current.modules);
  const entries=editor?.entries?.();
  if(!Array.isArray(entries))throw Error('CORE_IMPORT_CONFIG_UNAVAILABLE');
  const modules=structuredClone(current.modules);
  for(const n of MODULES){
    const matches=entries.filter(e=>e.options?.id===ids[n]||[
      `@fg-lab/amadeus-${n}`,`@amadeus/${n}`].includes(e.options?.name));
    if(matches.length!==1||matches[0].options.disabled!==true)throw Error('CORE_IMPORT_CONFIG_UNAVAILABLE');
    const cfg=matches[0].options.config??{};
    if(!cfg||typeof cfg!=='object'||Array.isArray(cfg))throw Error('CORE_IMPORT_CONFIG_INVALID');
    const sourcePath=legacyDataPath(n,cfg);
    if(typeof sourcePath!=='string'||!path.isAbsolute(sourcePath)||!same(sourcePath,sources[n]))throw Error('CORE_IMPORT_CONFIG_SOURCE_MISMATCH');
    // Keep unknown fields in the backup/config. Runtime owns only path/policy
    // overrides; it must not discard a future module's config during import.
    modules[n].config=structuredClone(cfg);
  }
  return modules;
}
