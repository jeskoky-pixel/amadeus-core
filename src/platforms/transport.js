// Network destinations are supplied by trusted built-in adapter code, never by
// model input or a platform response. No redirects and no credential logging.
export class PlatformError extends Error {
  constructor(code) { super(`CORE_PLATFORM_${code.toUpperCase()}`); this.code=code; }
}
export function createPlatformTransport({allowedOrigins,timeoutMs=10000,maxBytes=1048576,allowLoopbackForTests=false}={}) {
  const origins=new Set(allowedOrigins);
  function destination(value) {
    let u;try{u=new URL(value);}catch{throw new PlatformError('unsupported_destination');}
    const local=allowLoopbackForTests&&u.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(u.hostname);
    if(u.username||u.password||!origins.has(u.origin)||(u.protocol!=='https:'&&!local))throw new PlatformError('unsupported_destination');
    return u;
  }
  async function request(url,{method='GET',headers={},body,signal,includeCookies=false}={}) {
    const u=destination(url),timeout=AbortSignal.timeout(timeoutMs);
    const combined=signal?AbortSignal.any([signal,timeout]):timeout;
    try {
      const res=await fetch(u,{method,headers,body,signal:combined,redirect:'error'});
      if(!res.ok) {await res.body?.cancel();throw new PlatformError(({401:'login_required',403:'permission_required',412:'rate_limited',429:'rate_limited'})[res.status]??'network_error');}
      const reader=res.body?.getReader();let size=0,chunks=[];
      if(!reader)throw new PlatformError('invalid_response');
      try {while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes)throw new PlatformError('response_limit');chunks.push(value);}}
      finally{await reader.cancel().catch(()=>{});}
      let data;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new PlatformError('invalid_response');}
      if(!data||typeof data!=='object'||Array.isArray(data))throw new PlatformError('invalid_response');
      // Only authentication code uses this private return shape. Never forward it to UI.
      return includeCookies?{data,cookies:res.headers.getSetCookie()}:data;
    }catch(e){
      if(e instanceof PlatformError)throw e;
      throw new PlatformError(signal?.aborted?'cancelled':timeout.aborted?'timeout':'network_error');
    }
  }
  return Object.freeze({request});
}
