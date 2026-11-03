import {createPlatformTransport} from './transport.js';
const API='https://api.bilibili.com',PASSPORT='https://passport.bilibili.com';
const fail=c=>{throw Error('CORE_PLATFORM_'+c);};
const text=(s,n=4000)=>typeof s==='string'?s.slice(0,n):'';
const bvid=id=>{if(typeof id!=='string'||!/^BV[0-9A-Za-z]{10}$/.test(id))fail('INPUT');return id;};
function unwrap(r){if(r?.code!==0)fail(r?.code===-101?'LOGIN_REQUIRED':[-352,-412,-509].includes(r?.code)?'RATE_LIMITED':r?.code===-403?'PERMISSION_REQUIRED':'INVALID_RESPONSE');if(!r.data||typeof r.data!=='object')fail('INVALID_RESPONSE');return r.data;}
function video(v){return {id:bvid(v.bvid),type:'video',title:text(v.title,500),author:{id:String(v.owner?.mid??v.mid??''),name:text(v.owner?.name??v.author,200)},sourceUrl:`https://www.bilibili.com/video/${v.bvid}`,description:text(v.desc??v.description),durationSeconds:Number.isFinite(v.duration)?v.duration:null,observed:['metadata'],visionAnalysis:'not-performed'};}
export function makeBilibiliAdapter({transport=createPlatformTransport({allowedOrigins:[API,PASSPORT]}),apiOrigin=API,passportOrigin=PASSPORT,now=()=>Date.now()}={}) {
  const headers=credentials=>credentials?.cookie?{cookie:credentials.cookie}:{};
  const get=async(path,credentials,options={})=>unwrap(await transport.request(apiOrigin+path,{...options,headers:headers(credentials)}));
  async function identity(credentials,options){const d=await get('/x/web-interface/nav',credentials,options);if(d.isLogin!==true||!Number.isSafeInteger(d.mid))fail('LOGIN_REQUIRED');return {identity:{accountId:String(d.mid),displayName:text(d.uname,200)}};}
  return Object.freeze({id:'bilibili',contractVersion:2,mode:'real',version:'0.2.0',name:'Bilibili',category:'video',
    description:'Bilibili web read adapter; not an Open Platform OAuth SDK',authMethods:['web-qr'],
    capabilities:['browse','search','read','comments','related'],requiresAccount:false,
    async beginLogin(input={},options={}) {
      if(input.method!=='web-qr'||input.acceptWebAdapter!==true)fail('PERMISSION_REQUIRED');
      const d=unwrap(await transport.request(passportOrigin+'/x/passport-login/web/qrcode/generate',options));
      let u;try{u=new URL(d.url);}catch{fail('INVALID_RESPONSE');}
      const trustedQr=(u.origin===PASSPORT&&u.pathname==='/h5-app/passport/login/scan')||
        (u.origin==='https://account.bilibili.com'&&u.pathname==='/h5/account-h5/auth/scan-web');
      if(!trustedQr||u.username||u.password||typeof d.qrcode_key!=='string'||!d.qrcode_key||d.qrcode_key.length>256)fail('INVALID_RESPONSE');
      return {private:{key:d.qrcode_key},public:{verificationUrl:u.href,expiresAt:now()+180000,intervalMs:3000}};
    },
    async pollLogin(p,options={}) {
      const response=await transport.request(passportOrigin+'/x/passport-login/web/qrcode/poll?qrcode_key='+encodeURIComponent(p.key),{...options,includeCookies:true});
      const d=unwrap(response.data);
      if([86101,86090].includes(d.code))return {pending:true,scanned:d.code===86090};
      if(d.code===86038)fail('CREDENTIALS_EXPIRED');if(d.code!==0)fail('LOGIN_REQUIRED');
      const cookies=[];for(const c of response.cookies??[]){const pair=c.split(';')[0];if(/^(SESSDATA|bili_jct|DedeUserID|DedeUserID__ckMd5)=/.test(pair)&&!/[\r\n]/.test(pair))cookies.push(pair);}
      if(!cookies.some(c=>c.startsWith('SESSDATA=')))fail('INVALID_RESPONSE');
      const credentials={cookie:cookies.join('; ')},verified=await identity(credentials,options);
      return {...verified,credentials,expiresAt:now()+7200000,scopes:['web-session']};
    },
    validateAccount:identity,
    // Local disconnect is supported. Remote web-session revocation is not claimed.
    async execute(operation,input={}, {signal,credentials}={}) {
      if(!input||typeof input!=='object')fail('INPUT');
      const opt={signal};
      if(operation==='read')return {operation,item:video(await get('/x/web-interface/view?bvid='+bvid(input.id),credentials,opt))};
      if(operation==='browse'){const d=await get('/x/web-interface/popular?ps=10&pn=1',credentials,opt);if(!Array.isArray(d.list))fail('INVALID_RESPONSE');return {operation,feed:'public-popular-not-personalized',items:d.list.slice(0,10).map(video)};}
      if(operation==='related'){const d=await get('/x/web-interface/archive/related?bvid='+bvid(input.id),credentials,opt);if(!Array.isArray(d))fail('INVALID_RESPONSE');return {operation,items:d.slice(0,10).map(video)};}
      if(operation==='search'){
        if(typeof input.query!=='string'||!input.query.trim()||input.query.length>512)fail('INPUT');
        const d=await get('/x/web-interface/search/type?search_type=video&keyword='+encodeURIComponent(input.query),credentials,opt);
        if(!Array.isArray(d.result))fail('INVALID_RESPONSE');return {operation,items:d.result.slice(0,10).map(video)};
      }
      if(operation==='comments'){
        const v=await get('/x/web-interface/view?bvid='+bvid(input.id),credentials,opt);
        if(!Number.isSafeInteger(v.aid))fail('INVALID_RESPONSE');
        const d=await get('/x/v2/reply/main?type=1&mode=3&ps=10&oid='+v.aid,credentials,opt);
        if(d.replies!==null&&!Array.isArray(d.replies))fail('INVALID_RESPONSE');
        return {operation,contentId:input.id,sourceUrl:`https://www.bilibili.com/video/${input.id}`,comments:(d.replies??[]).slice(0,10).map(c=>({id:String(c.rpid_str??c.rpid),author:{id:String(c.mid),name:text(c.member?.uname,200)},text:text(c.content?.message,2000)})),observed:['comments-text']};
      }
      fail('UNSUPPORTED');
    }
  });
}
