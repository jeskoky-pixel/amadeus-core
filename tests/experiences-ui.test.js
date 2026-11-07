import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const panel=fs.readFileSync(new URL('../src/client/panel.js',import.meta.url),'utf8');
const start=panel.indexOf("else if(tab==='experiences')content=")+"else if(tab==='experiences')content=".length;
const expression=panel.slice(start,panel.indexOf('\n',start)).trim().replace(/;$/, '');
for(const experiences of [[],[{eventId:'synthetic-event',platform:'fixture',occurredAt:'2026-11-03',status:'read'}]])test(`Experience page renders ${experiences.length} records without spreading React elements`,()=>{
 const tree=vm.runInNewContext(expression,{status:{experiences},t:zh=>zh,h:(type,props,...children)=>({type,props,children})});
 assert.equal(tree.type,'div');const rendered=JSON.stringify(tree);assert.ok(rendered.includes(experiences.length?'synthetic-event':'暂无经历记录。'));
});
test('Core compiled State view identifies itself as an integrated module',()=>{const bundle=fs.readFileSync(new URL('../lib/client.js',import.meta.url),'utf8');assert.ok(bundle.includes('Amadeus Core 状态模块'));assert.ok(!bundle.includes('独立 DSH 插件'));});
