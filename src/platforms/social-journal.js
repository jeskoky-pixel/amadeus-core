import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {atomicJson} from '../core/store.js';
const fail=code=>{throw Error('CORE_PLATFORM_'+code);};
export function socialPolicy(value={}) {
 const {noteIds=[],sessionIds=[],dailyLimit=5,cooldownMs=60000}=value;
 if(!Array.isArray(noteIds)||noteIds.length>100||noteIds.some(x=>typeof x!=='string'||!/^[a-f0-9]{24}$/.test(x))||!Array.isArray(sessionIds)||sessionIds.length>100||sessionIds.some(x=>typeof x!=='string'||!x||x.length>256)||!Number.isSafeInteger(dailyLimit)||dailyLimit<1||dailyLimit>100||!Number.isSafeInteger(cooldownMs)||cooldownMs<1000||cooldownMs>3600000)fail('SOCIAL_CONFIG');
 return {noteIds:[...new Set(noteIds)],sessionIds:[...new Set(sessionIds)],dailyLimit,cooldownMs};
}
export function socialInput(operation,input,targetKind='xhs-note') {
 const target=targetKind==='bilibili-video'?/^BV[0-9A-Za-z]{10}$/:targetKind==='xhs-note'?/^[a-f0-9]{24}$/:targetKind==='opaque-content'?/^[A-Za-z0-9._:-]{1,128}$/:null;
 const comment=targetKind==='bilibili-video'?/^[1-9][0-9]{0,19}$/:targetKind==='opaque-content'?/^[A-Za-z0-9._:-]{1,128}$/:/^[a-f0-9]{24}$/;
 if(!target||!['like','comment','reply'].includes(operation)||!input||typeof input.id!=='string'||!target.test(input.id))fail('SOCIAL_INPUT');
 if(operation==='like'&&input.liked!==true)fail('SOCIAL_INPUT');
 if(operation!=='like'&&(typeof input.text!=='string'||!input.text.trim()||input.text.length>500))fail('SOCIAL_INPUT');
 if(operation==='reply'&&(typeof input.commentId!=='string'||!comment.test(input.commentId)))fail('SOCIAL_INPUT');
 return {id:input.id,...(operation==='like'?{liked:true}:{text:input.text.trim()}),...(operation==='reply'?{commentId:input.commentId}:{})};
}
// An optional trusted adapter validator supports future target formats without
// allowing model-supplied validators, endpoints or secret-bearing action fields.
export function normalizeSocialAction(adapter,operation,input){
 if(typeof adapter.normalizeSocialInput==='function')return socialInput(operation,adapter.normalizeSocialInput(operation,structuredClone(input)),'opaque-content');
 return socialInput(operation,input,adapter.socialTargetKind);
}
// A crash after durable reservation is uncertain, never a reason to replay.
// Hashes avoid storing private comment bodies or URL security tokens.
export class SocialJournal {
 constructor(file,now=()=>Date.now()) {
  this.file=file;this.now=now;
  this.state=file&&fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{schema:1,entries:[]};
  if(this.state.schema!==1||!Array.isArray(this.state.entries)||this.state.entries.some(e=>!e||typeof e.key!=='string'||!['pending','confirmed','unknown'].includes(e.status)||!Number.isFinite(e.at)))fail('JOURNAL_SCHEMA');
 }
 reserve(platform,account,operation,input,identity,policy) {
  if(!this.file)fail('JOURNAL_REQUIRED');
  if(!policy.sessionIds.includes(identity.sessionId))fail('TARGET_DENIED');
  const key=createHash('sha256').update(JSON.stringify([platform,account,operation,input])).digest('hex');
  if(this.state.entries.some(e=>e.key===key))fail('ACTION_ALREADY_RECORDED');
  if(this.state.entries.length>=10000)fail('JOURNAL_CAPACITY');
  const at=this.now(),entries=this.state.entries.filter(e=>e.platform===platform&&e.account===account&&e.operation===operation);
  const last=entries.at(-1);
  if(last&&at-last.at<policy.cooldownMs)fail('COOLDOWN');
  const day=Math.max(Math.floor(at/86400000),...entries.map(e=>Math.floor(e.at/86400000)));
  if(entries.filter(e=>Math.floor(e.at/86400000)===day).length>=policy.dailyLimit)fail('SOCIAL_BUDGET');
  const row={key,platform,account,operation,noteId:input.id,sessionId:identity.sessionId,workspaceId:identity.workspaceId,at,status:'pending'};
  const next={schema:1,entries:[...this.state.entries,row]};atomicJson(this.file,next);this.state=next;return key;
 }
 finish(key,status) {const next=structuredClone(this.state);const row=next.entries.find(e=>e.key===key);if(!row)fail('JOURNAL_MISSING');row.status=status;atomicJson(this.file,next);this.state=next;}
 list(platform){return this.state.entries.filter(e=>e.platform===platform).slice(-100).reverse().map(e=>({...e,status:e.status==='pending'?'unknown':e.status}));}
}
