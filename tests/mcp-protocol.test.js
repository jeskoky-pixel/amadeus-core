import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import http from 'node:http';import {fileURLToPath} from 'node:url';
import {McpManager} from '../src/mcp/manager.js';import {respond} from './fixtures/mcp-server.mjs';
const pause=()=>new Promise(r=>setTimeout(r,120));
function fixture(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'core-mcp-'));const ws={id:'w',sessionIds:['allowed','denied']};const runtime={root,status:'ready',store:{state:{workspaceId:'w'}},ctx:{workspaceRegistry:{get:()=>ws,list:()=>[ws]},sessions:{get:id=>({id,header:{agentPreset:'standard',origin:'user',createdAt:10}})}}};const m=new McpManager(runtime);t.after(async()=>{await m.dispose();fs.rmSync(root,{recursive:true,force:true});});return {m,runtime};}
const config=(id)=>({id,name:id,transport:'stdio',command:process.execPath,args:[fileURLToPath(new URL('./fixtures/mcp-server.mjs',import.meta.url))],enabled:true,timeoutMs:2500,dailyBudget:20,sessionIds:['allowed'],sessionTypes:[],tools:Object.fromEntries(['echo','slow','fail'].map(n=>[n,{enabled:true,category:'read',allowSideEffects:false}]))});
const exec=(id='allowed')=>({agent:{session:{id}},signal:new AbortController().signal});
async function local(t,handler){const server=http.createServer(handler??(async(req,res)=>{if(req.method==='GET'){res.writeHead(405);return res.end();}if(req.method==='DELETE'){res.writeHead(200);return res.end();}let text='';for await(const chunk of req)text+=chunk;const reply=await respond(JSON.parse(text));if(!reply){res.writeHead(202);return res.end();}res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify(reply));}));await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>{server.close(r);server.closeAllConnections();}));return 'http://127.0.0.1:'+server.address().port+'/mcp';}
test('two stdio and one HTTP discover same tool names without collisions, enforce input and Session grants',async t=>{
 const {m}=fixture(t);const url=await local(t);for(const id of ['one','two','three']){const c=config(id);if(id==='three'){c.transport='streamable-http';c.url=url;delete c.command;delete c.args;}await m.save(c,m.store.state.revision);}
 assert.deepEqual(m.overview().servers.map(s=>s.status),['connected','connected','connected']);
 assert.equal(m.list('allowed').length,9);assert.equal(m.list('denied').length,0);
 for(const id of ['one','two','three']){const v=await m.call(id,'echo',{text:id},exec());assert.equal(v.result.content[0].text,id);assert.equal(v.untrusted,true);}
 await assert.rejects(m.call('one','echo',{text:2},exec()),/ARGUMENTS|RATE_LIMIT/);await pause();
 await assert.rejects(m.call('one','echo',{text:2},exec()),/ARGUMENTS/);
 await assert.rejects(m.call('one','echo',{text:'x'},exec('denied')),/DENIED/);
 const disabled={...config('one'),enabled:false};await m.save(disabled,m.store.state.revision);await assert.rejects(m.call('one','echo',{text:'x'},exec()),/DENIED/);
 await m.save(config('one'),m.store.state.revision);assert.equal(m.overview().servers.find(s=>s.id==='one').status,'connected');
 const bad={...config('one'),command:path.join(os.tmpdir(),'does-not-exist-amadeus.exe')};await m.save(bad,m.store.state.revision);assert.equal(m.overview().servers.find(s=>s.id==='one').status,'error');await pause();assert.equal((await m.call('two','echo',{text:'still working'},exec())).result.content[0].text,'still working');
 await m.remove('one',m.store.state.revision);assert.equal(m.overview().servers.length,2);
});
test('MCP restart restores configuration and quota, credentials redact, timeout does not retry',async t=>{
 // Keep the 200ms RPC deadline, but do not also require a cold Windows Node
 // process to start inside it. Real stdio loss/reconnect is covered below.
 const {m,runtime}=fixture(t),cfg={...config('one'),transport:'streamable-http',url:await local(t)};delete cfg.command;delete cfg.args;
 await m.save(cfg,0);const token='synthetic-"secret-token';m.store.secret(token);
 const v=await m.call('one','echo',{text:token},exec());assert.equal(v.result.content[0].text,'[redacted]');
 await pause();await m.save({...cfg,timeoutMs:200},m.store.state.revision);
 assert.equal(m.overview().servers[0].status,'connected');await assert.rejects(m.call('one','slow',{text:'late'},exec()),/TIMEOUT|CALL_FAILED/);
 assert.equal(m.overview().servers[0].used,2);assert.equal(m.events.length,2);
 await m.dispose();const restored=new McpManager(runtime);t.after(()=>restored.dispose());await restored.start();assert.equal(restored.overview().servers[0].used,2);assert.equal(restored.events.length,2);assert.equal(restored.overview().servers[0].status,'connected');
 assert.equal(JSON.stringify(restored.overview()).includes(token),false);
 const error=await restored.call('one','fail',{text:'x'},exec());assert.equal(error.result.isError,true);
});
test('remote redirects cannot forward authorization and server instructions never enter prompts',async t=>{
 const {m,runtime}=fixture(t);let leaked=0,prompts=0;runtime.ctx.systemPrompt={section:()=>{prompts++;}};
 const destination=await local(t,(req,res)=>{leaked++;res.end();});
 const source=await local(t,(_req,res)=>{res.writeHead(307,{location:destination});res.end();});
 const c=config('redirect');delete c.command;delete c.args;Object.assign(c,{transport:'streamable-http',url:source,credentialRef:m.store.secret('synthetic-http-secret')});await m.save(c,0);
 assert.equal(m.overview().servers[0].status,'error');assert.equal(leaked,0);assert.equal(prompts,0);
 await m.save(config('safe'),m.store.state.revision);assert.equal(prompts,0);assert.match(m.list('allowed')[0].description,/UNTRUSTED/);
});

test('revocation during a real protocol wait rejects late output without retry',async t=>{
 const {m}=fixture(t);await m.save(config('waiter'),0);
 const pending=m.call('waiter','slow',{text:'must not deliver'},exec());
 const checked=assert.rejects(pending,/CANCELLED|CALL_FAILED|REVOKED/);
 await new Promise(r=>setTimeout(r,30));await m.save({...config('waiter'),enabled:false},m.store.state.revision);await checked;
 assert.equal(m.store.state.usage.waiter,1);assert.equal(m.events.at(-1).outcome,'failed');assert.equal(m.list('allowed').length,0);
});

test('hosted-style Bearer reference is used on local HTTP and never returned in tool data',async t=>{
 const {m}=fixture(t),token='synthetic-hosted-token';let authenticated=0;
 const url=await local(t,async(req,res)=>{if(req.method==='GET'){res.writeHead(405);return res.end();}if(req.headers.authorization!=='Bearer '+token){res.writeHead(401);return res.end();}authenticated++;let text='';for await(const c of req)text+=c;const reply=await respond(JSON.parse(text));if(!reply){res.writeHead(202);return res.end();}res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify(reply));});
 const c=config('authenticated');delete c.command;delete c.args;Object.assign(c,{transport:'streamable-http',url,credentialRef:m.store.secret(token)});await m.save(c,0);assert.equal(m.overview().servers[0].status,'connected');const result=await m.call(c.id,'echo',{text:token},exec());assert.equal(result.result.content[0].text,'[redacted]');assert.ok(authenticated>=3);assert.equal(JSON.stringify(m.overview()).includes(token),false);
});

test('actual stdio process loss isolates its namespace and permits explicit reconnect',async t=>{
 const {m}=fixture(t);await m.save(config('lost'),0);await m.save(config('healthy'),m.store.state.revision);
 const pid=m.connections.get('lost').transport.pid;assert.ok(Number.isInteger(pid));process.kill(pid);
 for(let i=0;i<50&&m.overview().servers.find(s=>s.id==='lost').status==='connected';i++)await new Promise(r=>setTimeout(r,20));
 assert.equal(m.overview().servers.find(s=>s.id==='lost').status,'disconnected');
 assert.equal(m.list('allowed').filter(s=>s.serverId==='lost').length,0);
 assert.equal((await m.call('healthy','echo',{text:'survived'},exec())).result.content[0].text,'survived');
 await assert.rejects(m.call('lost','echo',{text:'no replay'},exec()),/DISCONNECTED/);
 await m.connect('lost');assert.equal((await m.call('lost','echo',{text:'reconnected'},exec())).result.content[0].text,'reconnected');
});
