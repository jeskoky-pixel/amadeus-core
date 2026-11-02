import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {createCoreHandler} from '../src/core/http.js';

async function call({owner=true,headers={},body='{}',method='POST',url='/api/amadeus-core/import',failure}={}){
  let calls=0,status,payload;
  const req=Readable.from([Buffer.from(body)]);
  Object.assign(req,{method,url,headers:{host:'localhost:3198','content-type':'application/json','x-amadeus-core':'1',...headers}});
  const res={writeHead(code){status=code;},end(value){payload=JSON.parse(value);}};
  const ctx={connection:{admit:()=>({peer:{principal:{kind:owner?'owner':'agent'}}})}};
  const action=()=>{calls++;if(failure)throw Error(failure);return {ready:true};};
  await createCoreHandler(ctx,{importData:action,overview:action})(req,res);
  return {status,payload,calls};
}
test('untrusted caller, cross-origin and missing write marker never reach import',async()=>{
  for(const input of [{owner:false},{headers:{origin:'https://untrusted.invalid'}},{headers:{'sec-fetch-site':'cross-site'}},{headers:{'x-amadeus-core':undefined}}]){
    const result=await call(input);assert.equal(result.status,403);assert.equal(result.calls,0);
  }
});
test('owner write requires bounded JSON object',async()=>{
  for(const body of ['[]','null','invalid',JSON.stringify({text:'x'.repeat(130*1024)})]){
    const result=await call({body});assert.equal(result.status,400);assert.equal(result.calls,0);
  }
  assert.equal((await call()).calls,1);
});
test('revision conflict is actionable but private failure details are hidden',async()=>{
  assert.equal((await call({failure:'CORE_REVISION_CONFLICT'})).status,409);
  const result=await call({failure:'private database path or credential details'});
  assert.equal(result.payload.error,'CORE_OPERATION_FAILED');
});

test('MCP configuration, credentials and platform operations are all Owner-only',async()=>{
 for(const suffix of ['mcp/save','mcp/remove','mcp/connect','mcp/secret','platform/configure','platform/dry-run','activity']){
  for(const input of [{owner:false},{headers:{origin:'https://attacker.invalid'}},{headers:{'x-amadeus-core':undefined}}]){
   const result=await call({...input,url:'/api/amadeus-core/'+suffix});assert.equal(result.status,403);assert.equal(result.calls,0);
  }
 }
});
