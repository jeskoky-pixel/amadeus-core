import {createPlatformTransport} from './transport.js';
import {socialInput} from './social-journal.js';
const API='https://api.bilibili.com',PASSPORT='https://passport.bilibili.com';
const fail=c=>{throw Error('CORE_PLATFORM_'+c);};
const text=(s,n=4000)=>typeof s==='string'?s.slice(0,n):'';
const bvid=id=>{if(typeof id!=='string'||!/^BV[0-9A-Za-z]{10}$/.test(id))fail('INPUT');return id;};
function unwrap(r){if(r?.code!==0)fail(r?.code===-101?'LOGIN_REQUIRED':[-352,-412,-509].includes(r?.code)?'RATE_LIMITED':r?.code===-403?'PERMISSION_REQUIRED':'INVALID_RESPONSE');if(!r.data||typeof r.data!=='object')fail('INVALID_RESPONSE');return r.data;}
function video(v){return {id:bvid(v.bvid),type:'video',title:text(v.title,500),author:{id:String(v.owner?.mid??v.mid??''),name:text(v.owner?.name??v.author,200)},sourceUrl:`https://www.bilibili.com/video/${v.bvid}`,description:text(v.desc??v.description),durationSeconds:Number.isFinite(v.duration)?v.duration:null,observed:['metadata'],visionAnalysis:'not-performed'};}
export function makeBilibiliAdapter({transport=createPlatformTransport({allowedOrigins:[API,PASSPORT]}),apiOrigin=API,passportOrigin=PASSPORT,now=()=>Date.now(),vault=null}={}) {
  const observed=new Map();let epoch=0;
  const scope=(credentials,identity)=>JSON.stringify([identity?.workspaceId,identity?.sessionId,credentials?.accountId]);
  function seen(credentials,identity){const key=scope(credentials,identity);if(!observed.has(key)){if(observed.size>=100)observed.delete(observed.keys().next().value);observed.set(key,new Map());}return observed.get(key);}
  function remember(items,credentials,identity){const map=seen(credentials,identity);for(const item of items){if(map.size>=200)map.delete(map.keys().next().value);const old=map.get(item.id);map.set(item.id,{at:now(),comments:old?.comments??new Map()});}return items;}
  const headers=credentials=>credentials?.cookie?{cookie:credentials.cookie}:{};
  const get=async(path,credentials,options={})=>unwrap(await transport.request(apiOrigin+path,{...options,headers:headers(credentials)}));
  async function identity(credentials,options){const d=await get('/x/web-interface/nav',credentials,options);if(d.isLogin!==true||!Number.isSafeInteger(d.mid))fail('LOGIN_REQUIRED');return {identity:{accountId:String(d.mid),displayName:text(d.uname,200)}};}
  function preflight(operation,input,{credentials,identity:actor,assertAuthorized}={}){
    const action=socialInput(operation,input,'bilibili-video');
    if(typeof assertAuthorized!=='function'||!actor?.workspaceId||!actor?.sessionId)fail('PERMISSION_REQUIRED');assertAuthorized();
    if(!credentials?.accountId||typeof credentials.cookie!=='string')fail('LOGIN_REQUIRED');
    const prior=seen(credentials,actor).get(action.id);if(!prior||now()-prior.at>3600000)fail('TARGET_NOT_OBSERVED');
    const csrf=credentials.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('bili_jct='))?.slice(9);if(!csrf||!/^\w{1,128}$/.test(csrf))fail('INVALID_CREDENTIALS');
    if(operation==='reply'){const parent=prior.comments.get(action.commentId);if(!parent||now()-parent.at>3600000)fail('TARGET_NOT_OBSERVED');}
    return {action,csrf,prior};
  }
  return Object.freeze({id:'bilibili',contractVersion:2,mode:'real',version:'0.3.0',name:'Bilibili',category:'video',
    description:'Bilibili web read adapter; not an Open Platform OAuth SDK',authMethods:['web-qr'],
    capabilities:['browse','search','read','comments','related','like','comment','reply'],requiresAccount:false,
    socialWrites:true,socialTargetKind:'bilibili-video',storage:vault?'windows-dpapi':'session-only',
    preflightAction:preflight,
    async beginLogin(input={},options={}) {
      if(input.method!=='web-qr'||input.acceptWebAdapter!==true)fail('PERMISSION_REQUIRED');
      const vaultFile=vault?.file();
      const d=unwrap(await transport.request(passportOrigin+'/x/passport-login/web/qrcode/generate',options));
      let u;try{u=new URL(d.url);}catch{fail('INVALID_RESPONSE');}
      const trustedQr=(u.origin===PASSPORT&&u.pathname==='/h5-app/passport/login/scan')||
        (u.origin==='https://account.bilibili.com'&&u.pathname==='/h5/account-h5/auth/scan-web');
      if(!trustedQr||u.username||u.password||typeof d.qrcode_key!=='string'||!d.qrcode_key||d.qrcode_key.length>256)fail('INVALID_RESPONSE');
      if(vaultFile!==vault?.file())fail('REVOKED');
      return {private:{key:d.qrcode_key,...(vaultFile?{vaultFile}:{})},public:{verificationUrl:u.href,expiresAt:now()+180000,intervalMs:3000}};
    },
    async pollLogin(p,options={}) {
      const generation=epoch;
      if(p.vaultFile!==vault?.file())fail('REVOKED');
      const response=await transport.request(passportOrigin+'/x/passport-login/web/qrcode/poll?qrcode_key='+encodeURIComponent(p.key),{...options,includeCookies:true});
      const d=unwrap(response.data);
      if([86101,86090].includes(d.code))return {pending:true,scanned:d.code===86090};
      if(d.code===86038)fail('CREDENTIALS_EXPIRED');if(d.code!==0)fail('LOGIN_REQUIRED');
      const cookies=[];for(const c of response.cookies??[]){const pair=c.split(';')[0];if(/^(SESSDATA|bili_jct|DedeUserID|DedeUserID__ckMd5|buvid3|buvid4)=/.test(pair)&&!/[\r\n]/.test(pair))cookies.push(pair);}
      if(!cookies.some(c=>c.startsWith('SESSDATA=')))fail('INVALID_RESPONSE');
      const credentials={cookie:cookies.join('; ')},verified=await identity(credentials,options);
      credentials.accountId=verified.identity.accountId;
      // Normal official visitor-cookie issuance; never fabricate identifiers or retry risk challenges.
      if(!cookies.some(c=>c.startsWith('buvid3='))){try{const visitor=await get('/x/frontend/finger/spi',credentials,options);for(const [field,name] of [['b_3','buvid3'],['b_4','buvid4']])if(typeof visitor[field]==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(visitor[field]))cookies.push(name+'='+visitor[field]);credentials.cookie=cookies.join('; ');}catch{/* Read login remains valid; writes may be rejected by the platform. */}}
      if(generation!==epoch||p.vaultFile!==vault?.file())fail('REVOKED');
      if(vault)await vault.save({accountId:verified.identity.accountId,credentials});
      if(generation!==epoch)fail('REVOKED');
      return {...verified,credentials,expiresAt:now()+7200000,scopes:['web-session']};
    },
    validateAccount:identity,
    async restoreLogin({accountId}){const generation=epoch,vaultFile=vault?.file();if(!vault)fail('LOGIN_REQUIRED');const saved=await vault.read();if(saved?.accountId!==accountId||typeof saved?.credentials?.cookie!=='string')fail('LOGIN_REQUIRED');const verified=await identity(saved.credentials,{});if(generation!==epoch||vaultFile!==vault?.file())fail('REVOKED');if(verified.identity.accountId!==accountId)fail('IDENTITY_MISMATCH');return {...verified,credentials:saved.credentials,expiresAt:now()+7200000,scopes:['web-session']};},
    async logout(){epoch++;observed.clear();vault?.clear();},
    async clearSession(){epoch++;observed.clear();vault?.clear();},
    async dispose(){epoch++;observed.clear();},
    // Local disconnect is supported. Remote web-session revocation is not claimed.
    async execute(operation,input={}, {signal,credentials,identity:actor,assertAuthorized}={}) {
      if(!input||typeof input!=='object')fail('INPUT');
      const opt={signal};
      if(['like','comment','reply'].includes(operation)){
        const {action,csrf,prior}=preflight(operation,input,{credentials,identity:actor,assertAuthorized});
        const body=new URLSearchParams({csrf});let endpoint;
        if(operation==='like'){endpoint='/x/web-interface/archive/like';body.set('bvid',action.id);body.set('like','1');}
        else{const detail=await get('/x/web-interface/view?bvid='+action.id,credentials,opt);if(!Number.isSafeInteger(detail.aid)||detail.aid<=0||detail.bvid!==action.id)fail('INVALID_RESPONSE');endpoint='/x/v2/reply/add';body.set('oid',String(detail.aid));body.set('type','1');body.set('plat','1');body.set('message',action.text);
          if(operation==='reply'){const parent=prior.comments.get(action.commentId);if(!parent||now()-parent.at>3600000)fail('TARGET_NOT_OBSERVED');body.set('root',parent.root);body.set('parent',action.commentId);}}
        assertAuthorized();signal?.throwIfAborted();
        const response=await transport.request(apiOrigin+endpoint,{method:'POST',headers:{...headers(credentials),'content-type':'application/x-www-form-urlencoded',referer:'https://www.bilibili.com/video/'+action.id},body:body.toString(),signal});
        assertAuthorized();if(response?.code!==0)fail([12015,-352,-412,-509].includes(response?.code)?'RATE_LIMITED':'ACTION_REJECTED');
        const rpid=response.data?.rpid_str??response.data?.reply?.rpid_str??(Number.isSafeInteger(response.data?.rpid)?String(response.data.rpid):null);
        if(operation!=='like'&&(typeof rpid!=='string'||!(/^[1-9][0-9]{0,19}$/).test(rpid)))fail('ACTION_UNKNOWN');
        return {status:'confirmed',operation,contentId:action.id,...(rpid?{commentId:rpid}:{}),confirmation:'upstream-acknowledged',liveAcceptance:'pending'};
      }
      if(operation==='read'){const item=video(await get('/x/web-interface/view?bvid='+bvid(input.id),credentials,opt));remember([item],credentials,actor);return {operation,item};}
      if(operation==='browse'){const d=await get('/x/web-interface/popular?ps=10&pn=1',credentials,opt);if(!Array.isArray(d.list))fail('INVALID_RESPONSE');return {operation,feed:'public-popular-not-personalized',items:remember(d.list.slice(0,10).map(video),credentials,actor)};}
      if(operation==='related'){const d=await get('/x/web-interface/archive/related?bvid='+bvid(input.id),credentials,opt);if(!Array.isArray(d))fail('INVALID_RESPONSE');return {operation,items:remember(d.slice(0,10).map(video),credentials,actor)};}
      if(operation==='search'){
        if(typeof input.query!=='string'||!input.query.trim()||input.query.length>512)fail('INPUT');
        const d=await get('/x/web-interface/search/type?search_type=video&keyword='+encodeURIComponent(input.query),credentials,opt);
        if(!Array.isArray(d.result))fail('INVALID_RESPONSE');return {operation,items:remember(d.result.slice(0,10).map(video),credentials,actor)};
      }
      if(operation==='comments'){
        const v=await get('/x/web-interface/view?bvid='+bvid(input.id),credentials,opt);
        if(!Number.isSafeInteger(v.aid))fail('INVALID_RESPONSE');
        const d=await get('/x/v2/reply/main?type=1&mode=3&ps=10&oid='+v.aid,credentials,opt);
        if(d.replies!==null&&!Array.isArray(d.replies))fail('INVALID_RESPONSE');
        remember([video(v)],credentials,actor);const prior=seen(credentials,actor).get(input.id);
        const comments=[];for(const c of (d.replies??[]).slice(0,10)){const root=String(c.rpid_str??(Number.isSafeInteger(c.rpid)?c.rpid:''));for(const row of [c,...(c.replies??[]).slice(0,10)]){const id=String(row.rpid_str??(Number.isSafeInteger(row.rpid)?row.rpid:''));if(!/^[1-9][0-9]{0,19}$/.test(id)||!/^[1-9][0-9]{0,19}$/.test(root))continue;prior.comments.set(id,{root,at:now()});comments.push({id,rootId:root,author:{id:String(row.mid??''),name:text(row.member?.uname,200)},text:text(row.content?.message,2000)});}}
        while(prior.comments.size>200)prior.comments.delete(prior.comments.keys().next().value);
        return {operation,contentId:input.id,sourceUrl:`https://www.bilibili.com/video/${input.id}`,comments:comments.slice(0,30),observed:['comments-text']};
      }
      fail('UNSUPPORTED');
    }
  });
}
