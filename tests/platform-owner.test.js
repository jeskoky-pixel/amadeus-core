import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {CoreRuntime} from '../src/core/runtime.js';
import {AccountManager} from '../src/platforms/accounts.js';
import {createCoreHandler} from '../src/core/http.js';

test('Owner HTTP login lifecycle is marked, secret-free, cancellable and revision guarded',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'core-platform-owner-'));const ctx={connection:{admit:req=>({peer:{principal:{kind:req.headers['x-test-owner']==='no'?'agent':'owner'}}})}};
 const r=new CoreRuntime(ctx,root);r.status='ready';r.store.update(0,s=>{s.workspaceId='synthetic-w';});
 r.accounts=new AccountManager({file:path.join(root,'accounts-test.json'),workspaceId:()=>r.store.state.workspaceId});
 r.accounts.register({id:'bilibili',beginLogin:async()=>({private:{secret:'synthetic-private-code'},public:{verificationUrl:'https://passport.bilibili.com/h5-app/passport/login/scan?test=1',expiresAt:Date.now()+60000}}),pollLogin:async()=>({identity:{accountId:'synthetic-id',displayName:'fixture'},credentials:{cookie:'synthetic-private-cookie'},expiresAt:Date.now()+60000,scopes:[]})});r.platforms.accounts=r.accounts;
 const server=http.createServer(createCoreHandler(ctx,r));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>{server.closeAllConnections();server.close();fs.rmSync(root,{recursive:true,force:true});});
 const call=async(body,headers={})=>{const res=await fetch(`http://127.0.0.1:${server.address().port}/api/amadeus-core/platform/account`,{method:'POST',headers:{'content-type':'application/json','x-amadeus-core':'1',...headers},body:JSON.stringify(body)});return {status:res.status,...await res.json()};};
 assert.equal((await call({id:'bilibili',action:'begin',revision:1},{'x-test-owner':'no'})).status,403);
 assert.equal((await call({id:'bilibili',action:'begin',revision:1},{'x-amadeus-core':''})).status,403);
 const begin=await call({id:'bilibili',action:'begin',revision:1});assert.equal(begin.ok,true);assert.ok(begin.data.pending.qrDataUrl.startsWith('data:image/png;'));
 assert.ok(!JSON.stringify(begin).includes('synthetic-private'));
 assert.equal((await call({id:'bilibili',action:'poll',loginId:'wrong'})).ok,false);
 const done=await call({id:'bilibili',action:'poll',loginId:begin.data.pending.loginId});assert.equal(done.data.accounts[0].status,'authenticated');assert.ok(!JSON.stringify(done).includes('synthetic-private'));
 assert.equal((await call({id:'bilibili',action:'logout',revision:1})).status,409);
 const logout=await call({id:'bilibili',action:'logout',revision:r.store.state.revision});assert.equal(logout.ok,true);assert.equal(r.accounts.context('bilibili'),null);
 assert.equal(r.platforms.list().find(p=>p.id==='bilibili').enabled,false);assert.deepEqual(r.store.state.platforms.bilibili.permissions,[]);
 assert.ok(!fs.readFileSync(path.join(root,'accounts-test.json'),'utf8').includes('synthetic-private'));
});

test('Alpha 0.1 schema/config survives restart without granting real platforms',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'core-alpha-upgrade-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const legacy={schema:1,revision:7,workspaceId:'w',activitySessionId:'existing-s',modules:Object.fromEntries(['memory','life','state','persona'].map(n=>[n,{enabled:false,config:{preserved:'fixture'}}])),platforms:{'simulation-bilibili':{enabled:true,permissions:['read'],maxRequests:33}},futureField:'keep'};
 fs.writeFileSync(path.join(root,'core.json'),JSON.stringify(legacy));const r=new CoreRuntime({},root);r.configureExplorationPlatforms();assert.deepEqual(r.store.state,legacy);
 for(const p of r.platforms.list().filter(p=>!p.simulated)){assert.equal(p.enabled,false);assert.deepEqual(p.permissions,[]);assert.equal(p.autonomous,false);}
 await r.savePlatform({revision:7,id:'bilibili',config:{enabled:false,permissions:[],maxRequests:21,autonomous:false,minIntervalMs:5000}});
 const next=new CoreRuntime({},root);next.configureExplorationPlatforms();assert.equal(next.store.state.activitySessionId,'existing-s');assert.equal(next.store.state.futureField,'keep');assert.equal(next.store.state.modules.memory.config.preserved,'fixture');assert.deepEqual(next.store.state.platforms['simulation-bilibili'],legacy.platforms['simulation-bilibili']);assert.equal(next.platforms.list().find(p=>p.id==='bilibili').minIntervalMs,5000);assert.ok(fs.existsSync(path.join(root,'backups/core-r7.json')));
});
