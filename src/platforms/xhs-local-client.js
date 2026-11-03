// Core-owned HTTP boundary for a separately managed xpzouying service.
// No upstream source copied. Not registered as a live platform until acceptance.
const fail=code=>{throw Error('CORE_PLATFORM_'+code);};
const operations={browse:['GET','/feeds/list'],search:['POST','/feeds/search'],read:['POST','/feeds/detail'],comments:['POST','/feeds/detail'],like:['POST','/feeds/like'],comment:['POST','/feeds/comment'],reply:['POST','/feeds/comment/reply']};
export class XhsLocalClient {
 constructor({origin='http://127.0.0.1:18060',token,fetchImpl=fetch,timeoutMs=30000}={}){
  const u=new URL(origin);if(u.protocol!=='http:'||u.hostname!=='127.0.0.1'||u.username||u.password||u.pathname!=='/'||u.search||u.hash)fail('LOCAL_SERVICE_CONFIG');
  if(typeof token!=='function')fail('LOCAL_SERVICE_CONFIG');
  this.origin=u.origin;this.token=token;this.fetch=fetchImpl;this.timeoutMs=timeoutMs;
 }
 async request(method,path,body,signal){
  const token=await this.token();if(typeof token!=='string'||!token||token.length>4096||/[\r\n]/.test(token))fail('LOCAL_SERVICE_AUTH');
  let response;try{response=await this.fetch(this.origin+'/api/v1'+path,{method,redirect:'error',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(this.timeoutMs)]):AbortSignal.timeout(this.timeoutMs),headers:{authorization:'Bearer '+token,...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});}catch{fail('LOCAL_SERVICE_UNAVAILABLE');}
  if(response.status===401||response.status===403)fail('LOCAL_SERVICE_AUTH');
  if(!response.ok)fail('LOCAL_SERVICE_RESPONSE');
  const reader=response.body?.getReader();if(!reader)fail('LOCAL_SERVICE_RESPONSE');let size=0;const chunks=[];
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2*1024*1024){await reader.cancel();fail('RESPONSE_LIMIT');}chunks.push(value);}}finally{reader.releaseLock();}
  let result;try{result=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{fail('LOCAL_SERVICE_RESPONSE');}
  if(result?.success!==true||!result.data||typeof result.data!=='object')fail('LOCAL_SERVICE_RESPONSE');return result.data;
 }
 async beginLogin(signal){
  const data=await this.request('GET','/login/qrcode',null,signal);
  if(data.is_logged_in===true)return {alreadyLoggedIn:true};
  if(typeof data.img!=='string'||!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(data.img)||data.img.length>1500000)fail('INVALID_QR');
  // Upstream, not the UI, owns QR waiting and durable cookies.
  return {qrDataUrl:data.img,expiresInMs:240000,managedByService:true};
 }
 async account(signal){
  const data=await this.request('GET','/login/status',null,signal);if(data.is_logged_in!==true)return null;
  if(typeof data.user_id!=='string'||!data.user_id||data.user_id.length>256)fail('IDENTITY_UNVERIFIED');
  return {accountId:data.user_id,displayName:String(data.username??data.user_id).slice(0,200)};
 }
 async execute(operation,input,{accountId,assertAuthorized,signal}={}){
  const route=operations[operation];if(!route)fail('UNSUPPORTED');if(typeof assertAuthorized!=='function')fail('PERMISSION_REQUIRED');
  assertAuthorized();const identity=await this.account(signal);if(!identity||identity.accountId!==accountId)fail('IDENTITY_MISMATCH');
  let body;
  if(operation==='search'){if(typeof input?.query!=='string'||!input.query.trim()||input.query.length>200)fail('INPUT');body={keyword:input.query};}
  else if(operation!=='browse'){
   if(typeof input?.id!=='string'||!/^[a-f0-9]{24}$/.test(input.id)||typeof input.xsecToken!=='string'||!input.xsecToken||input.xsecToken.length>4096)fail('INPUT');
   body={feed_id:input.id,xsec_token:input.xsecToken};
   if(operation==='comments')body.load_all_comments=false;
   if(operation==='like'){if(input.liked!==true)fail('INPUT');body.unlike=false;}
   if(operation==='comment'||operation==='reply'){if(typeof input.text!=='string'||!input.text.trim()||input.text.length>500)fail('INPUT');body.content=input.text.trim();}
   if(operation==='reply'){if(typeof input.commentId!=='string'||!/^[a-f0-9]{24}$/.test(input.commentId))fail('INPUT');body.comment_id=input.commentId;}
  }
  assertAuthorized();const writing=['like','comment','reply'].includes(operation);
  let result;try{result=await this.request(route[0],route[1],body,signal);}catch(e){if(writing)fail('ACTION_UNKNOWN');throw e;}
  assertAuthorized();
  if(writing){if(result.success!==true||result.feed_id!==input.id||(operation==='reply'&&result.target_comment_id!==input.commentId))fail('ACTION_UNKNOWN');return {operation,contentId:input.id,providerAcknowledged:true};}
  return result;
 }
}
