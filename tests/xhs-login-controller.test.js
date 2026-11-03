import test from 'node:test';import assert from 'node:assert/strict';import {XhsLoginController} from '../src/platforms/xhs-login-controller.js';
function fixture(){let now=1000,valid=false,identity={accountId:'actor'},qrCalls=0;const c=new XhsLoginController({workspaceId:'w',now:()=>now,client:{beginLogin:async()=>{qrCalls++;return {qrDataUrl:'data:image/png;base64,YQ==',expiresInMs:240000};},account:async()=>identity},storage:{inspect:async()=>({valid,accountId:'actor'}),bind:async()=>{}}});return {c,setValid:v=>valid=v,setIdentity:v=>identity=v,tick:()=>now+=16000,get qrCalls(){return qrCalls;}};}
test('QR generated once; persisted identity is not reported as read-ready',async()=>{const f=fixture();await f.c.begin();await f.c.begin();assert.equal(f.qrCalls,1);await f.c.check();assert.equal(f.c.state,'waiting_scan');f.setValid(true);f.tick();await f.c.check();assert.equal(f.c.state,'identity_verified');assert.throws(()=>f.c.recordRead({accountId:'other',workspaceId:'w',contentId:'note',sourceUrl:'https://www.xiaohongshu.com/explore/note'}));f.c.recordRead({accountId:'actor',workspaceId:'w',contentId:'note',sourceUrl:'https://www.xiaohongshu.com/explore/note'});assert.equal(f.c.state,'ready_for_read');});
test('restore requires matching saved account and a fresh read; mismatch never binds',async()=>{const f=fixture();f.setValid(true);f.setIdentity({accountId:'other'});await f.c.check({restore:true});assert.equal(f.c.state,'identity_mismatch');f.setIdentity({accountId:'actor'});f.tick();await f.c.check({restore:true});assert.equal(f.c.state,'identity_verified');f.c.recordRead({accountId:'actor',workspaceId:'w',contentId:'note',sourceUrl:'https://www.xiaohongshu.com/explore/note'});assert.equal(f.c.state,'restored');});

test('concurrent login starts issue one QR; cancelling a late result cannot restore it',async()=>{
 let resolveQr,calls=0;
 const gate=new Promise(resolve=>resolveQr=resolve);
 const c=new XhsLoginController({workspaceId:'w',client:{beginLogin:async()=>{calls++;return gate;}},storage:{}});
 const a=c.begin(),b=c.begin();
 assert.equal(a,b);assert.equal(calls,1);
 c.cancel();resolveQr({qrDataUrl:'data:image/png;base64,YQ=='});
 await a;assert.equal(c.status().pending,null);assert.equal(c.state,'service_ready');
});

test('temporary service failure preserves prior identity and does not revoke persisted credentials',async()=>{
 const f=fixture();f.setValid(true);await f.c.check();
 f.c.client.account=async()=>{throw Error('CORE_PLATFORM_LOCAL_SERVICE_UNAVAILABLE');};
 f.tick();await f.c.check();assert.equal(f.c.state,'service_unavailable');assert.equal(f.c.status().accountId,'actor');
});
