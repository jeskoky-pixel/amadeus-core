import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
test('candidate automation cannot publish and historical workflow fixtures are not active workflows',()=>{
  const folder=path.join(root,'.github/workflows');
  for(const name of fs.readdirSync(folder)){
    const text=fs.readFileSync(path.join(folder,name),'utf8');
    assert.doesNotMatch(text,/npm publish|gh release|id-token:\s*write|contents:\s*write|packages:\s*write/);
    assert.match(text,/contents:\s*read/);
  }
  assert.equal(JSON.parse(fs.readFileSync(path.join(root,'package.json'))).private,true);
  assert.match(fs.readFileSync(path.join(root,'src/.npmignore'),'utf8'),/modules\/\*\/test\//);
});
