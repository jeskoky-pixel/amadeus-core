// Retain original versioned module manuals for documentation regressions.
// These are historical references, excluded from the install package.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),sourceRoot=process.argv[2];
if(!sourceRoot)throw Error('Pass the directory containing the four original Git checkouts');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/architecture/SOURCE_MANIFEST.json')));
let added=0;
for(const item of manifest){
  const cwd=path.join(sourceRoot,'amadeus-'+item.module);
  const git=(args)=>{const r=spawnSync('git',args,{cwd,maxBuffer:16*1024*1024});if(r.status!==0)throw Error(r.stderr.toString());return r.stdout;};
  const files=git(['ls-tree','-r','--name-only',item.tree]).toString().trim().split('\n')
    .filter(p=>/\.md$/i.test(p)||['package-lock.json','runtime-manifest.json','icon.svg'].includes(p))
    .filter(p=>!p.startsWith('.github/')&&!p.startsWith('node_modules/'));
  for(const file of files){
    const target=path.join(root,'src/modules',item.module,file);
    if(fs.existsSync(target))continue;
    const bytes=git(['show',`${item.tree}:${file}`]);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
    item.files.push({path:file,sha256:createHash('sha256').update(bytes).digest('hex'),referenceOnly:true});added++;
  }
}
fs.writeFileSync(path.join(root,'docs/architecture/SOURCE_MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({added}));
