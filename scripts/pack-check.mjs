import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'),pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json')));
const npmCli=process.env.npm_execpath;
if(!npmCli)throw Error('Run through npm run pack:check');
const result=spawnSync(process.execPath,[npmCli,'pack','--ignore-scripts','--dry-run','--json'],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});
if(result.status!==0)throw Error(result.stderr);
const parsed=JSON.parse(result.stdout),pack=Array.isArray(parsed)?parsed[0]:parsed[pkg.name],files=new Set(pack.files.map(f=>f.path));
assert.equal(pkg.name,'@fg-lab/amadeus-core');assert.equal(pkg.private,true);
assert.equal(pkg.version,'0.1.0-alpha.1');
for(const file of ['src/index.js','lib/client.js','cordis.patch.yml','LICENSE','NOTICE.md',
 ...['memory','life','state','persona'].flatMap(n=>[`src/modules/${n}/src/index.js`,`src/modules/${n}/LICENSE`])])assert(files.has(file),`Missing ${file}`);
for(const file of files){
 assert(!/(?:^|\/)(?:node_modules|\.git|\.dsh|test|tests|dist|backups)(?:\/|$)/.test(file),`Unexpected directory: ${file}`);
 assert(!/\.(?:db|sqlite|log|tgz|jsonl|zstd)$|(?:credentials|\.env|\.private\.)/i.test(file),`Potential user data: ${file}`);
 if(file.endsWith('cordis.patch.yml'))assert.equal(file,'cordis.patch.yml','Nested Bundle patch must not ship');
}
const patches=fs.readFileSync(path.join(root,'cordis.patch.yml'),'utf8').match(/id:/g)??[];
assert.equal(patches.length,1);
const loader=fs.readFileSync(path.join(root,'lib/client.js'),'utf8');
assert(loader.startsWith("window.__ModuleLoader__.load({id:'@fg-lab/amadeus-core'"));
console.log(JSON.stringify({name:pkg.name,version:pkg.version,files:files.size,unpackedSize:pack.unpackedSize,status:'pass'}));
