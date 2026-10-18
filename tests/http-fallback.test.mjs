import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import {withHttpFallback} from '../browser/public/http-fallback.mjs';
const dir=mkdtempSync(join(tmpdir(),'musab-http-'));
const compile=s=>ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
try {
 writeFileSync(join(dir,'web.mjs'),compile(readFileSync('lib/web.ts','utf8')));
 writeFileSync(join(dir,'http.mjs'),compile(readFileSync('browser/http.ts','utf8').replace("'../lib/web'","'./web.mjs'")));
 const {relayHttp}=await import(pathToFileURL(join(dir,'http.mjs')));
 const request=(data={},extra={})=>new Request('https://browser.example/http',{method:'POST',headers:{origin:'https://browser.example','content-type':'application/json',cookie:'__Host-musab_browser=workspace-session',...extra},body:JSON.stringify({url:'https://www.google.com/search?q=test',method:'GET',headers:{Accept:'text/html',Cookie:'website=only',Host:'evil',Connection:'keep-alive','CF-Connecting-IP':'127.0.0.1'},...data})});
 let fetched=0,verified=0;
 const verify=async url=>{verified++;assert.equal(url.protocol,'https:')};
 const upstream=async (url,options)=>{
  fetched++;assert.equal(options.redirect,'manual');assert.equal(options.headers.get('Cookie'),'website=only');assert.ok(!options.headers.has('Host'));assert.ok(!options.headers.has('CF-Connecting-IP'));assert.ok(!options.headers.get('Cookie').includes('workspace-session'));
  const headers=new Headers({Location:'https://youtube.com/', 'Content-Type':'text/html'});headers.append('Set-Cookie','a=1; Path=/');headers.append('Set-Cookie','b=2; Path=/');
  return new Response('<h1>Website</h1>',{status:302,headers});
 };
 assert.equal((await relayHttp(request(),async()=>false,upstream,verify)).status,401);assert.equal(fetched,0);assert.equal(verified,0);
 assert.equal((await relayHttp(request({}, {origin:'https://evil.example'}),async()=>true,upstream,verify)).status,403);
 for(const url of ['http://www.google.com','https://127.0.0.1/','https://metadata.internal/','https://user:pass@example.com','https://example.com:8443/','https://browser.example/'])assert.equal((await relayHttp(request({url}),async()=>true,upstream,verify)).status,400,url);
 for(const method of ['CONNECT','TRACE','INVALID'])assert.equal((await relayHttp(request({method}),async()=>true,upstream,verify)).status,400);
 assert.equal((await relayHttp(request({headers:{a:'x'.repeat(70000)}}),async()=>true,upstream,verify)).status,400);
 assert.equal((await relayHttp(request(),async()=>true,upstream,async()=>{throw new Error('Private DNS')})).status,400);assert.equal(fetched,0);
 const response=await relayHttp(request(),async()=>true,upstream,verify);
 assert.equal(response.status,200);assert.equal(response.headers.get('Set-Cookie'),null);assert.equal(response.headers.get('Location'),null);assert.equal(response.headers.get('Cache-Control'),'no-store');
 const metadata=JSON.parse(Buffer.from(response.headers.get('X-Musab-Response'),'base64').toString());assert.equal(metadata.status,302);assert.equal(metadata.headers.location,'https://youtube.com/');assert.deepEqual(metadata.headers['set-cookie'],['a=1; Path=/','b=2; Path=/']);assert.equal(await response.text(),'<h1>Website</h1>');
 assert.equal((await relayHttp(request(),async()=>true,async()=>{throw new Error('Origin unreachable')},verify)).status,502);
 const head=await relayHttp(request({method:'HEAD'}),async()=>true,async()=>new Response(null,{status:204}),verify);assert.equal(head.body,null);
 // API/form bodies must be sent exactly once, including non-ASCII and binary data.
 for(const method of ['POST','PUT','PATCH','DELETE','OPTIONS']){
  const payload=Buffer.from('email=fixture%40example.com&value=☀');let writes=0;
  const written=await relayHttp(request({method,body:payload.toString('base64')}),async()=>true,async(url,options)=>{writes++;assert.equal(options.method,method);assert.deepEqual(Buffer.from(options.body),payload);assert.equal(options.redirect,'manual');return Response.json({ok:true})},verify);
  assert.equal(written.status,200);assert.equal(writes,1);
 }
 for(const body of ['not base64!','====','abcd===',Buffer.alloc(2097153).toString('base64')])assert.equal((await relayHttp(request({method:'POST',body}),async()=>true,upstream,verify)).status,400);
 assert.equal((await relayHttp(request({body:'eA=='}),async()=>true,upstream,verify)).status,400,'GET cannot carry a request body');
 let relayed=0,baseCalls=0;
 class Failed {async request(){baseCalls++;throw new Error('tls handshake eof')}}
 const payloads=[];
 const Transport=withHttpFallback(Failed,async(path,options)=>{relayed++;assert.equal(path,'/http');assert.equal(options.credentials,'same-origin');const input=JSON.parse(options.body);payloads.push(input);assert.equal(input.url,'https://youtube.com/');return new Response('Video website',{headers:{'X-Musab-Response':Buffer.from(JSON.stringify({status:206,statusText:'Partial Content',headers:{'content-type':'text/html','content-range':'bytes 0-12/13'}})).toString('base64')}})});
 const transport=new Transport();const result=await transport.request(new URL('https://youtube.com/'),'GET',null,{});assert.equal(result.status,206);assert.equal(await new Response(result.body).text(),'Video website');assert.equal(relayed,1);assert.equal(baseCalls,1);
 await transport.request(new URL('https://youtube.com/'),'POST','field=☀',{});assert.equal(relayed,2);assert.equal(Buffer.from(payloads.at(-1).body,'base64').toString(),'field=☀');assert.equal(baseCalls,1,'Writes never enter the failing Wisp client');
 await transport.request(new URL('https://youtube.com/'),'GET',null,{});assert.equal(baseCalls,1,'Subsequent reads use the same working HTTP path');
 const firstWrite=new Transport();await firstWrite.request(new URL('https://youtube.com/'),'POST',new Uint8Array([0,255,128]),{});assert.equal(baseCalls,1,'First writes go through HTTP before any Wisp attempt');assert.deepEqual([...Buffer.from(payloads.at(-1).body,'base64')],[0,255,128]);
 const streamed=new Transport();await streamed.request(new URL('https://youtube.com/'),'POST',new ReadableStream({start(c){c.enqueue(new Uint8Array([1,2]));c.enqueue(new Uint8Array([3]));c.close()}}),{});assert.deepEqual([...Buffer.from(payloads.at(-1).body,'base64')],[1,2,3]);
 const cancelled=new AbortController();cancelled.abort();const before=relayed;await assert.rejects(()=>transport.request(new URL('https://youtube.com/'),'GET',null,{},cancelled.signal));assert.equal(relayed,before);
 let failedWrites=0;const BothFail=withHttpFallback(Failed,async()=>{failedWrites++;return new Response('Sign in again',{status:401})});
 await assert.rejects(()=>new BothFail().request(new URL('https://youtube.com/'),'POST','form',{}),/Sign in again/);assert.equal(failedWrites,1,'Never replay a failed login');
 const Oversize=withHttpFallback(Failed,async()=>{throw new Error('Must not fetch')});await assert.rejects(()=>new Oversize().request(new URL('https://youtube.com/'),'POST',new Uint8Array(2097153),{}),/2 MB/);
 let metadataCalls=0;class LocalMetadata {async request(url){metadataCalls++;assert.equal(url.hostname,'publicsuffix.org');return {status:200}}}
 const Metadata=withHttpFallback(LocalMetadata,async()=>{throw new Error('Metadata must stay local')});const metadataTransport=new Metadata();metadataTransport.httpMode=true;await metadataTransport.request(new URL('https://publicsuffix.org/list/public_suffix_list.dat'),'GET',null,{});assert.equal(metadataCalls,1);
 console.log('HTTP fallback passed: authentication, origin/URL/DNS checks, bounded input, private-cookie isolation, manual redirects, cookie metadata, streaming, consistent HTTP routing, API bodies, cancellation, and no write replay.');
} finally {rmSync(dir,{recursive:true,force:true})}
