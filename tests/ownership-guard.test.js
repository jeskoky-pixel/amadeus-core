import test from 'node:test';
import assert from 'node:assert/strict';
import { installLegacyGuard } from '../src/core/ownership.js';

test('legacy activation is rejected before loader continuation, unrelated and disabled entries remain usable',()=>{
  let hook,active=true,ran=0;
  const remove=()=>{};
  assert.equal(installLegacyGuard({on:(name,fn,options)=>{
    assert.equal(name,'loader/patch-context');assert.equal(options.global,true);assert.equal(options.prepend,true);hook=fn;return remove;
  }},()=>active),remove);
  const next=()=>++ran;
  for(const name of ['memory','life','state','persona'])
    assert.throws(()=>hook({options:{name:`@fg-lab/amadeus-${name}`}},next),/CORE_STANDALONE_CONFLICT/);
  assert.equal(ran,0);
  hook({options:{id:'amadeus-core',name:'@fg-lab/amadeus-core'}},next);
  hook({options:{id:'amadeus-qq',name:'@fg-lab/amadeus-qq'}},next);
  hook({disabled:true,options:{id:'dsh-mneme'}},next);
  active=false;hook({options:{id:'dsh-mneme'}},next);
  assert.equal(ran,4);
});
