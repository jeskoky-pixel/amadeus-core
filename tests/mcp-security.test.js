import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {McpManager} from '../src/mcp/manager.js';import {validateServer} from '../src/mcp/store.js';
function setup(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'core-mcp-acl-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const ws={id:'w',sessionIds:['ordinary','group','private','unknown']};const runtime={root,status:'ready',store:{state:{workspaceId:'w'}},ctx:{workspaceRegistry:{get:()=>ws,list:()=>[ws]},sessions:{get:id=>({id,header:{origin:'user',agentPreset:'standard',createdAt:10}})}}};const m=new McpManager(runtime);return {m,runtime,ws};}
const cfg={id:'test',name:'test',enabled:true,transport:'stdio',command:process.execPath,args:[],timeoutMs:2000,dailyBudget:20,sessionIds:[],sessionTypes:['ordinary'],tools:{echo:{enabled:true,category:'read',allowSideEffects:false}}};
test('trusted QQ group and Owner private do not inherit ordinary MCP permission, stale provenance denies',t=>{
 const {m,runtime,ws}=setup(t);runtime.ctx.qq={sessionProvenanceVersion:1,classifySession:id=>({kind:id==='ordinary'?'ordinary':id==='unknown'?'unknown':'qq'}),resolveTrustedSessionScene:id=>({platform:'qq',kind:id==='group'?'group':'private',verified:true,admin:id==='private'})};
 m.allowed(cfg,'echo','ordinary');for(const id of ['group','private','unknown'])assert.throws(()=>m.allowed(cfg,'echo',id),/DENIED|IDENTITY/);
 m.allowed({...cfg,sessionTypes:['qq-group']},'echo','group');assert.throws(()=>m.allowed({...cfg,sessionTypes:['qq-group']},'echo','private'),/DENIED/);
 delete runtime.ctx.qq;m.allowed(cfg,'echo','ordinary');assert.throws(()=>m.allowed(cfg,'echo','group'),/IDENTITY/);
 ws.sessionIds=[];assert.throws(()=>m.allowed(cfg,'echo','ordinary'),/SESSION_DENIED/);
});
test('custom unverified Session and subagent are excluded, explicit side-effect approval is separate',t=>{
 const {m,runtime}=setup(t);runtime.ctx.sessions.get=id=>({id,header:{origin:'subagent',agentPreset:'standard'}});assert.throws(()=>m.allowed(cfg,'echo','ordinary'),/SESSION_DENIED/);
 runtime.ctx.sessions.get=id=>({id,header:{origin:'user',agentPreset:'renamed-qq'}});assert.throws(()=>m.allowed(cfg,'echo','ordinary'),/IDENTITY/);
 runtime.ctx.sessions.get=id=>({id,header:{origin:'user',agentPreset:'standard'}});
 const write={...cfg,tools:{echo:{enabled:true,category:'write',allowSideEffects:false}}};assert.throws(()=>m.allowed(write,'echo','ordinary'),/DENIED/);
 write.tools.echo.allowSideEffects=true;m.allowed(write,'echo','ordinary');
});
test('config rejects shell invocation, URL credentials and undeclared raw secret fields',()=>{
 assert.throws(()=>validateServer({...cfg,command:process.platform==='win32'?'C:/Windows/System32/cmd.exe':'/bin/sh'}),/SHELL_DENIED/);
 assert.throws(()=>validateServer({...cfg,transport:'streamable-http',url:'https://u:p@example.test/mcp'}),/URL/);
 assert.throws(()=>validateServer({...cfg,token:'not-allowed'}),/UNKNOWN_FIELD/);
});

test('QQ type grants are bulk grants, exact Session grants remain isolated and revocable',t=>{
 const {m,runtime,ws}=setup(t);ws.sessionIds=['group-a','group-b','owner-private','nonowner-private','ordinary'];
 runtime.ctx.qq={sessionProvenanceVersion:1,classifySession:id=>({kind:id==='ordinary'?'ordinary':'qq'}),resolveTrustedSessionScene:id=>({platform:'qq',kind:id.startsWith('group')?'group':'private',verified:true,admin:id==='owner-private'})};
 const closed={...cfg,sessionTypes:[],sessionIds:[]};
 for(const id of ws.sessionIds)assert.throws(()=>m.allowed(closed,'echo',id),/DENIED/);
 const exact={...closed,sessionIds:['group-a']};m.allowed(exact,'echo','group-a');assert.throws(()=>m.allowed(exact,'echo','group-b'),/DENIED/);
 exact.sessionIds=[];assert.throws(()=>m.allowed(exact,'echo','group-a'),/DENIED/);
 const groups={...closed,sessionTypes:['qq-group']};for(const id of ['group-a','group-b'])m.allowed(groups,'echo',id);
 const privates={...closed,sessionTypes:['qq-private']};for(const id of ['owner-private','nonowner-private'])m.allowed(privates,'echo',id);
 assert.throws(()=>m.allowed(privates,'echo','group-a'),/DENIED/);
 assert.throws(()=>m.allowed(groups,'echo','owner-private'),/DENIED/);
 ws.sessionIds.push('group-future');m.allowed(groups,'echo','group-future');
 assert.throws(()=>m.allowed(groups,'echo','outside-workspace'),/SESSION_DENIED/);
 runtime.ctx.qq.resolveTrustedSessionScene=()=>({platform:'qq',kind:'group',verified:false});assert.throws(()=>m.allowed(groups,'echo','group-a'),/IDENTITY/);
});
