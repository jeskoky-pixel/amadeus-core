import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {BrowserVault} from '../../src/platforms/browser-vault.js';
import test from 'node:test';import assert from 'node:assert/strict';import {chromium} from 'playwright-core';import {makeXhsBrowserAdapter} from '../../src/platforms/xhs-browser.js';
const id='a'.repeat(24),parent='b'.repeat(24),child='c'.repeat(24),actor='test-user';
// Real browser engine with all network intercepted. No request reaches XHS.
test('Edge fixture: signed self-response identity, real selectors, comments, exact reply and desired like state',async()=>{
 let browser,mode='success',submits=0,likes=0,blocked=0,allowLogin=true;
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'core-browser-resume-')),vault=new BrowserVault({root,workspaceId:()=> 'synthetic',codec:async b=>Buffer.from(b).map(x=>x^0xaa)});
 const launch=async()=>{browser=await chromium.launch({channel:process.env.CORE_BROWSER_CHANNEL??'msedge',headless:true});
 const newContext=browser.newContext.bind(browser);browser.newContext=async(options)=>{const context=await newContext(options);await context.route('**/*',async route=>{
 const url=new URL(route.request().url());
 if(url.origin==='https://edith.xiaohongshu.com'&&url.pathname==='/api/sns/web/v1/user/self')return route.fulfill({json:{success:true,data:(await route.request().allHeaders()).cookie?.includes('fixture=logged-in')?{user_id:actor,nickname:'Synthetic tester'}:{guest:true}},headers:{'access-control-allow-origin':'https://www.xiaohongshu.com','access-control-allow-credentials':'true'}});
 if(url.pathname==='/api/sns/web/v1/comment/post'){submits++;return route.fulfill({json:{success:true,code:0,data:{id:child}}});}
 if(url.pathname==='/api/sns/web/v1/note/like'){likes++;return route.fulfill({json:{success:true,code:0}});}
 if(url.origin!=='https://www.xiaohongshu.com'){blocked++;return route.abort();}
 if(url.pathname==='/fixture-event'){if(url.searchParams.get('type')==='submit')submits++;else likes++;return route.fulfill({body:'ok'});}
 if(url.pathname!=='/explore'&&url.pathname!==`/explore/${id}`){blocked++;return route.abort();}
 const html=`<!doctype html><html><body><div class="input-box"><div class="content-edit"><span>Comment</span><p class="content-input" contenteditable="true"></p></div></div><div class="bottom"><button class="submit">Send</button></div><div id="comment-${parent}"><div class="right"><div class="interactions"><button class="reply">Reply</button></div></div></div><div class="engage-bar"><button class="like-wrapper">Like</button></div><script>
 ${allowLogin?"document.cookie='fixture=logged-in; Domain=.xiaohongshu.com; Path=/; Secure';":''}
 fetch('https://edith.xiaohongshu.com/api/sns/web/v1/user/self',{credentials:'include'});
 let target=null;const entry={note:{noteId:'${id}',title:'Fixture',desc:'Synthetic text',interactInfo:{liked:false}},comments:{list:[{id:'${parent}',content:'parent',userInfo:{userId:'another'}},{id:'old',content:'hello',userInfo:{userId:'${actor}'}}]}};
 window.__INITIAL_STATE__={note:{noteDetailMap:{'${id}':entry}}};
 document.querySelector('.reply').onclick=()=>target='${parent}';
 document.querySelector('.submit').onclick=()=>{fetch('/api/sns/web/v1/comment/post',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({note_id:'${id}',content:document.querySelector('p').innerText,target_comment_id:target})});${mode==='success'?`entry.comments.list.unshift({id:'${child}',content:document.querySelector('p').innerText,userInfo:{userId:'${actor}'},targetCommentId:target});`:''}};
 document.querySelector('.like-wrapper').onclick=()=>{fetch('/api/sns/web/v1/note/like',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({note_id:'${id}'})});entry.note.interactInfo.liked=true;};
 </script></body></html>`;
 return route.fulfill({contentType:'text/html',body:html});});return context;};return browser;};
 const adapter=makeXhsBrowserAdapter({launch,vault});
 try{const pending=await adapter.beginLogin({acceptBrowser:true});const login=await adapter.pollLogin(pending.private);assert.equal(login.identity.accountId,actor);const opts={credentials:login.credentials,assertAuthorized:()=>{}};
 const read=await adapter.execute('comments',{id},opts);assert.equal(read.comments.length,2);
 const comment=await adapter.execute('comment',{id,text:'hello'},opts);assert.equal(comment.commentId,child);
 const reply=await adapter.execute('reply',{id,text:'reply',commentId:parent},opts);assert.equal(reply.status,'confirmed');
 const like=await adapter.execute('like',{id,liked:true},opts);assert.equal(like.changed,true);
 mode='stale';await assert.rejects(adapter.execute('comment',{id,text:'hello'},opts),/ACTION_UNKNOWN/);
 mode='success';allowLogin=false;await browser.close();const resumed=await adapter.execute('read',{id},opts);assert.equal(resumed.contentId,id);
 await adapter.dispose();const restarted=makeXhsBrowserAdapter({launch,vault});const restored=await restarted.restoreLogin({accountId:actor});assert.equal(restored.identity.accountId,actor);await restarted.logout();assert.equal(vault.has(),false);await restarted.dispose();
 assert.equal(submits,3);assert.equal(likes,1);assert.equal(blocked,0);
 }finally{await adapter.dispose();await browser?.close();fs.rmSync(root,{recursive:true,force:true});}
});
