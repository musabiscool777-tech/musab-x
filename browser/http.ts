import {validUrl,verify} from '../lib/web';

// Read-only escape hatch when a destination rejects the Wisp/TLS connection.
// Website headers travel as metadata; they never become workspace cookies.
export async function relayHttp(r:Request,authorize:(r:Request)=>Promise<boolean>,fetcher:typeof fetch=fetch,verifyTarget=verify){
 const outer=new URL(r.url),failure=(message:string,status:number)=>new Response(message,{status,headers:{'Cache-Control':'no-store','Content-Type':'text/plain'}});
 if(r.method!=='POST'||r.headers.get('origin')!==outer.origin||!r.headers.get('content-type')?.includes('application/json'))return failure('Invalid browser request',403);
 if(!await authorize(r))return failure('Sign in again to reconnect the browser.',401);
 let input:any;
 try{
  const reader=r.body?.getReader();if(!reader)throw new Error();let size=0,text='';const decoder=new TextDecoder();
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>65536){await reader.cancel();throw new Error()}text+=decoder.decode(value,{stream:true})}}finally{reader.releaseLock()}
  input=JSON.parse(text+decoder.decode());
 }catch{return failure('Invalid browser request',400)}
 let url:URL,headers:Headers;
 try{
  if(typeof input.url!=='string'||input.url.length>8192||!['GET','HEAD'].includes(input.method)||!input.headers||typeof input.headers!=='object'||Array.isArray(input.headers))throw new Error();
  url=validUrl(input.url);
  // Prevent recursion through the browser origin.
  if(url.origin===outer.origin)throw new Error();
  headers=new Headers();
  for(const [key,value] of Object.entries(input.headers)){
   if(/^(host|connection|content-length|transfer-encoding|upgrade|keep-alive|te|trailer|accept-encoding)$/i.test(key)||/^(proxy-|cf-|x-forwarded-|x-musab-)/i.test(key))continue;
   if(typeof value==='string')headers.set(key,value);else if(Array.isArray(value)&&value.every(v=>typeof v==='string'))for(const item of value)headers.append(key,item);else throw new Error();
  }
  headers.set('Accept-Encoding','identity');
  await verifyTarget(url);
 }catch{return failure('Only public HTTPS websites are available through the fallback.',400)}
 try{
  const timeout=new AbortController(),timer=setTimeout(()=>timeout.abort(new Error('Website connection timed out')),20000);
  let upstream:Response;
  try{upstream=await fetcher(url,{method:input.method,headers,redirect:'manual',signal:AbortSignal.any([r.signal,timeout.signal])})}finally{clearTimeout(timer)}
  const websiteHeaders:Record<string,string|string[]>={};
  for(const [key,value] of upstream.headers){if(!/^(set-cookie|content-encoding|content-length|transfer-encoding)$/i.test(key))websiteHeaders[key]=value}
  const cookies=upstream.headers.getSetCookie();if(cookies.length)websiteHeaders['set-cookie']=cookies;
  const metadata=JSON.stringify({status:upstream.status,statusText:upstream.statusText,headers:websiteHeaders});
  if(new TextEncoder().encode(metadata).length>48000){await upstream.body?.cancel();return failure('Website returned too many headers',502)}
  const envelope=new Headers({'Content-Type':'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Musab-Response':btoa(Array.from(new TextEncoder().encode(metadata),b=>String.fromCharCode(b)).join(''))});
  // Preserve compression on the HTTP envelope; browser fetch decodes its stream.
  const encoding=upstream.headers.get('content-encoding');if(encoding)envelope.set('Content-Encoding',encoding);
  return new Response(input.method==='HEAD'?null:upstream.body,{headers:envelope});
 }catch(error){return failure('HTTP fallback failed: '+(error instanceof Error?error.message:'Website unavailable'),502)}
}
