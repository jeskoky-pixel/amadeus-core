import {createHash} from 'node:crypto';
import {createPlatformTransport} from './transport.js';
import {socialInput} from './social-journal.js';
const API='https://api.bilibili.com',PASSPORT='https://passport.bilibili.com';
const fail=c=>{throw Error('CORE_PLATFORM_'+c);};
const text=(s,n=4000)=>typeof s==='string'?s.slice(0,n):'';
const bvid=id=>{if(typeof id!=='string'||!/^BV[0-9A-Za-z]{10}$/.test(id))fail('INPUT');return id;};
function unwrap(r){if(r?.code!==0)fail(r?.code===-101?'LOGIN_REQUIRED':[-352,-412,-509].includes(r?.code)?'RATE_LIMITED':r?.code===-403?'PERMISSION_REQUIRED':'INVALID_RESPONSE');if(!r.data||typeof r.data!=='object')fail('INVALID_RESPONSE');return r.data;}
function video(v){return {id:bvid(v.bvid),type:'video',title:text(v.title,500),author:{id:String(v.owner?.mid??v.mid??''),name:text(v.owner?.name??v.author,200)},sourceUrl:`https://www.bilibili.com/video/${v.bvid}`,description:text(v.desc??v.description),durationSeconds:Number.isFinite(v.duration)?v.duration:null,observed:['metadata'],visionAnalysis:'not-performed'};}
export function makeBilibiliAdapter({transport=createPlatformTransport({allowedOrigins:[API,PASSPORT]}),apiOrigin=API,passportOrigin=PASSPORT,now=()=>Date.now(),vault=null}={}) {
  const observed=new Map(),searchStates=new Map();let epoch=0;
  const mixinTable=[46,47,18,2,53,8,23,32,15,50,10,31,58,3,45,35,27,43,5,49,33,9,42,19,29,28,14,39,12,38,41,13,37,48,7,16,24,55,40,61,26,17,0,1,60,51,30,4,22,25,54,21,56,59,6,63,57,62,11,36,20,34,44,52];
  async function search(input,credentials,actor,opt){
    const page=input.page??1;if(!Number.isSafeInteger(page)||page<1||page>100)fail('INPUT');
    const key=scope(credentials,actor);let state=searchStates.get(key);
    if(!state){if(searchStates.size>=100)searchStates.delete(searchStates.keys().next().value);state={until:0,key:null,at:0};searchStates.set(key,state);}
    if(now()<state.until)fail('RATE_LIMITED');
    const generation=epoch;state.until=now()+1500;
    const searchHeaders={...headers(credentials),'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',referer:'https://search.bilibili.com/'};
    try{
      if(!state.key||now()-state.at>=600000){
        const nav=await transport.request(apiOrigin+'/x/web-interface/nav',{...opt,headers:searchHeaders});
        if(![0,-101].includes(nav.code))unwrap(nav);
        const keys=['img_url','sub_url'].map(k=>{const value=nav.data?.wbi_img?.[k];if(typeof value!=='string')fail('INVALID_RESPONSE');const match=/\/([a-f0-9]{32})\.[a-z]+(?:\?.*)?$/i.exec(value);if(!match)fail('INVALID_RESPONSE');return match[1];});
        const raw=keys.join('');state.key=mixinTable.map(i=>raw[i]).join('').slice(0,32);state.at=now();
      }
      if(generation!==epoch)fail('REVOKED');opt.signal?.throwIfAborted();
      const params={search_type:'video',keyword:input.query,page,wts:Math.floor(now()/1000)};
      const query=Object.keys(params).sort().map(k=>encodeURIComponent(k)+'='+encodeURIComponent(String(params[k]).replace(/[!'()*]/g,''))).join('&');
      const signature=createHash('md5').update(query+state.key).digest('hex');
      const d=unwrap(await transport.request(apiOrigin+'/x/web-interface/wbi/search/type?'+query+'&w_rid='+signature,{...opt,headers:searchHeaders}));
      if(generation!==epoch)fail('REVOKED');
      if(d.v_voucher)fail('RATE_LIMITED');
      const rows=d.result??d.results;if(!Array.isArray(rows))fail('INVALID_RESPONSE');
      return {operation:'search',page,items:remember(rows.filter(v=>typeof v.bvid==='string'&&/^BV[0-9A-Za-z]{10}$/.test(v.bvid)).slice(0,10).map(v=>video({...v,title:typeof v.title==='string'?v.title.replace(/<[^>]*>/g,''):v.title})),credentials,actor)};
    }catch(error){if(/RATE_LIMITED/.test(error.message))state.until=now()+300000;throw error;}
  }
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
  return Object.freeze({id:'bilibili',contractVersion:2,mode:'real',version:'0.3.1',name:'Bilibili',category:'video',
    description:'Bilibili web adapter; not an Open Platform OAuth SDK',authMethods:['web-qr'],
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
    async logout(){epoch++;observed.clear();searchStates.clear();vault?.clear();},
    async clearSession(){epoch++;observed.clear();searchStates.clear();vault?.clear();},
    async dispose(){epoch++;observed.clear();searchStates.clear();},
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
        return search(input,credentials,actor,opt);
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
