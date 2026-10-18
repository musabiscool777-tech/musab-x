// Keep form submissions on one connection: never retry a write after it fails.
const READS=new Set(['GET','HEAD']);
async function encodeBody(body) {
 if(body==null)return null;
 let bytes;
 if(typeof body==='string')bytes=new TextEncoder().encode(body);
 else if(body instanceof Blob)bytes=new Uint8Array(await body.arrayBuffer());
 else if(body instanceof ArrayBuffer)bytes=new Uint8Array(body);
 else if(ArrayBuffer.isView(body))bytes=new Uint8Array(body.buffer,body.byteOffset,body.byteLength);
 else if(body instanceof URLSearchParams)bytes=new TextEncoder().encode(body.toString());
 else if(body instanceof ReadableStream){
  const reader=body.getReader(),chunks=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;const chunk=typeof value==='string'?new TextEncoder().encode(value):new Uint8Array(value);size+=chunk.length;if(size>2097152){await reader.cancel();throw new Error('This upload exceeds the browser relay’s 2 MB limit.')}chunks.push(chunk)}}finally{reader.releaseLock()}
  bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
 }
 else throw new Error('This request body cannot be sent through the browser relay.');
 if(bytes.length>2097152)throw new Error('This upload exceeds the browser relay’s 2 MB limit.');
 const chunks=[];for(let offset=0;offset<bytes.length;offset+=32768)chunks.push(String.fromCharCode(...bytes.subarray(offset,offset+32768)));
 return btoa(chunks.join(''));
}
export function withHttpFallback(Base, fetcher = (...args) => fetch(...args)) {
 return class extends Base {
  httpMode=false;
  async httpRequest(url,method,body,headers,signal) {
   if(signal?.aborted)throw signal.reason||new DOMException('Aborted','AbortError');
   const encodedBody=await encodeBody(body);
   const response=await fetcher('/http',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:url.href,method,headers,body:encodedBody}),signal});
   if(!response.ok)throw new Error((await response.text()).slice(0,600)||'HTTP relay unavailable');
   const encoded=response.headers.get('X-Musab-Response');
   if(!encoded)throw new Error('Browser relay response is missing its headers');
   const metadata=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encoded),c=>c.charCodeAt(0))));
   if(!Number.isInteger(metadata.status)||metadata.status<200||metadata.status>599||!metadata.headers||typeof metadata.headers!=='object')throw new Error('Invalid browser relay response');
   this.httpMode=true;
   return {...metadata,body:method==='HEAD'||[204,205,304].includes(metadata.status)?null:response.body};
  }
  async request(url,method,body,headers,signal) {
   method=method.toUpperCase();
   // Domain metadata remains local even when other requests use HTTP mode.
   if(url.href==='https://publicsuffix.org/list/public_suffix_list.dat')return super.request(url,method,body,headers,signal);
   const https=url.protocol==='https:';
   // Select HTTP BEFORE sending a write. A failed write is never replayed.
   if(https&&(this.httpMode||!READS.has(method)))return this.httpRequest(url,method,body,headers,signal);
   try{return await super.request(url,method,body,headers,signal)}
   catch(original){
    if(!READS.has(method)||!https||signal?.aborted)throw original;
    try{return await this.httpRequest(url,method,body,headers,signal)}
    catch(fallback){if(signal?.aborted)throw signal.reason||fallback;throw new Error(String(original)+'\n'+String(fallback))}
   }
  }
 };
}
