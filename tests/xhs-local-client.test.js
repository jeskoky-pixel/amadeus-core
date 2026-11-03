import test from 'node:test';import assert from 'node:assert/strict';import {XhsLocalClient} from '../src/platforms/xhs-local-client.js';
const ok=data=>new Response(JSON.stringify({success:true,data}),{status:200});
test('local service restricts origin and redirects; login QR and identity come from service',async()=>{
 for(const origin of ['https://example.com','http://localhost:18060','http://127.0.0.1/path','http://user@127.0.0.1'])assert.throws(()=>new XhsLocalClient({origin,token:()=> 'fixture'}));
 const calls=[];const c=new XhsLocalClient({token:()=> 'fixture',fetchImpl:async(url,opt)=>{calls.push([url,opt]);return url.endsWith('/qrcode')?ok({img:'data:image/png;base64,YQ==',is_logged_in:false}):ok({is_logged_in:true,user_id:'actor',username:'Synthetic'});}});
 assert.equal((await c.beginLogin()).managedByService,true);assert.equal((await c.account()).accountId,'actor');assert.ok(calls.every(x=>x[1].redirect==='error'));assert.equal(calls[0][1].headers.authorization,'Bearer fixture');
});
test('true login flag without identity cannot authorize actions',async()=>{const c=new XhsLocalClient({token:()=> 'fixture',fetchImpl:async()=>ok({is_logged_in:true})});await assert.rejects(c.account(),/IDENTITY_UNVERIFIED/);});
test('write uses exact target, authorization and never retries uncertain responses',async()=>{
 let writes=0,checks=0;const id='a'.repeat(24),c=new XhsLocalClient({token:()=> 'fixture',fetchImpl:async(url,opt)=>{if(url.endsWith('/login/status'))return ok({is_logged_in:true,user_id:'actor'});writes++;assert.equal(JSON.parse(opt.body).feed_id,id);throw Error('lost response');}});
 await assert.rejects(c.execute('like',{id,xsecToken:'synthetic',liked:true},{accountId:'actor',assertAuthorized:()=>checks++}),/ACTION_UNKNOWN/);assert.equal(writes,1);assert.equal(checks,2);
 await assert.rejects(c.execute('like',{id,xsecToken:'synthetic',liked:true},{accountId:'other',assertAuthorized:()=>{}}),/IDENTITY_MISMATCH/);assert.equal(writes,1);
});
test('QR external URLs and oversized response are refused',async()=>{const c=new XhsLocalClient({token:()=> 'fixture',fetchImpl:async()=>ok({img:'https://example.com/qr'})});await assert.rejects(c.beginLogin(),/INVALID_QR/);const large=new XhsLocalClient({token:()=> 'fixture',fetchImpl:async()=>new Response('x'.repeat(2100000))});await assert.rejects(large.account(),/RESPONSE_LIMIT/);});
