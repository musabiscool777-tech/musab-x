import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import {EventEmitter} from 'node:events';
import {deployIndependent} from '../scripts/deploy-independent.mjs';
const compile=s=>ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const dir=mkdtempSync(join(tmpdir(),'musab-browser-'));
const require=createRequire(import.meta.resolve('wrangler/package.json'));
const {Miniflare}=await import(pathToFileURL(require.resolve('miniflare')));
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("ok")}}',d1Databases:['DB']});
try{
 for(const [name,file] of [['github-auth','lib/github-auth.ts'],['web','lib/web.ts'],['ticket','lib/browser-ticket.ts'],['auth','browser/auth.ts'],['wisp','browser/wisp.ts']])writeFileSync(join(dir,name+'.mjs'),compile(readFileSync(file,'utf8').replace(/'\.\.?\/lib\/github-auth'|'\.\/github-auth'/g,"'./github-auth.mjs'").replace("'../lib/web'","'./web.mjs'")));
 const {browserOrigin,issueBrowserTicket}=await import(pathToFileURL(join(dir,'ticket.mjs')));
 const {exchangeTicket,relayAccount}=await import(pathToFileURL(join(dir,'auth.mjs')));
 const {resolvePublic,serveWisp,packet}=await import(pathToFileURL(join(dir,'wisp.mjs')));
 const calls=[];
 const spawnCommand=(executable,args,options)=>{const child=new EventEmitter();child.stdin=new EventEmitter();child.stdin.end=value=>{child.input=value};calls.push({args,options,child});queueMicrotask(()=>child.emit('close',0));return child};
 assert.equal(await deployIndependent({MUSAB_GITHUB_CLIENT_SECRET:'fixture-secret',WRANGLER_CI_OVERRIDE_NAME:'musab-x',WRANGLER_CI_MATCH_TAG:'primary-tag'},spawnCommand),0);
 assert.equal(calls.length,3);assert.ok(calls[0].args.includes('wrangler.browser.json'));assert.equal(calls[0].options.env.WRANGLER_CI_OVERRIDE_NAME,undefined);assert.equal(calls[0].options.env.WRANGLER_CI_MATCH_TAG,undefined);assert.equal(calls[1].options.env.WRANGLER_CI_OVERRIDE_NAME,'musab-x');assert.ok(calls.every(c=>!c.options.env.MUSAB_GITHUB_CLIENT_SECRET));assert.equal(JSON.parse(calls[2].child.input).GITHUB_CLIENT_SECRET,'fixture-secret');
 const DB=await mf.getD1Database('DB');for(const name of ['0000_pink_tomorrow_man.sql','0004_browser_relay.sql'])await DB.exec(readFileSync('drizzle/'+name,'utf8').replaceAll('\n',' '));
 await DB.prepare('INSERT INTO accounts (id,email,name,role,created) VALUES (?,?,?,?,?)').bind('member','member@example.com','Member','member','today').run();
 const env={DB,APP_ORIGIN:'https://musab.example'},origin='https://browser.example';
 assert.equal(browserOrigin({APP_ORIGIN:'https://musab-x.user.workers.dev'}),'https://musab-x-browser.user.workers.dev');
 assert.throws(()=>browserOrigin({APP_ORIGIN:origin,BROWSER_ORIGIN:origin}),/separate/);
 const ticket=await issueBrowserTicket(DB,'member');assert.match(ticket,/^[\w-]{43}$/);
 const request=(token=ticket,headers={})=>new Request(origin+'/session',{method:'POST',headers:{origin,'content-type':'application/json',...headers},body:JSON.stringify({ticket:token})});
 assert.equal((await exchangeTicket(request(ticket,{origin:env.APP_ORIGIN}),env)).status,403);
 const [a,b]=await Promise.all([exchangeTicket(request(),env),exchangeTicket(request(),env)]);assert.deepEqual([a.status,b.status].sort(),[200,401]);
 const response=a.status===200?a:b,cookie=response.headers.get('set-cookie');assert.match(cookie,/Secure; HttpOnly; SameSite=None; Partitioned/);assert.ok(!cookie.includes(ticket));
 const authenticated=()=>new Request(origin+'/wisp/',{headers:{cookie:cookie.split(';')[0]}});
 assert.equal((await relayAccount(authenticated(),env)).id,'member');
 assert.equal(await relayAccount(new Request(origin+'/wisp/',{headers:{cookie:'__Host-musab_session='+ticket}}),env),null);
 await DB.prepare('UPDATE accounts SET disabled=1 WHERE id=?').bind('member').run();assert.equal(await relayAccount(authenticated(),env),null);
 const blocked=await issueBrowserTicket(DB,'member');assert.equal((await exchangeTicket(request(blocked),env)).status,403);
 const expired=await issueBrowserTicket(DB,'member');await DB.prepare('UPDATE browser_tickets SET expires=0').run();assert.equal((await exchangeTicket(request(expired),env)).status,401);
 for(const host of ['localhost','metadata.internal','127.0.0.1','169.254.169.254','[::1]','evil\u0000.com','10.0.0.1'])await assert.rejects(()=>resolvePublic(host,()=>{throw new Error('Must not resolve')}));
 const dns=answers=>async()=>Response.json({Answer:answers.map(data=>({type:1,data}))});
 assert.equal(await resolvePublic('www.google.com',dns(['142.250.1.1'])),'142.250.1.1');
 await assert.rejects(()=>resolvePublic('evil.example',dns(['8.8.8.8','10.0.0.1'])));
 await assert.rejects(()=>resolvePublic('empty.example',dns([])));
 class FakeWS extends EventTarget{sent=[];closed=false;send(data){this.sent.push(new Uint8Array(data))}close(){this.closed=true}message(data){this.dispatchEvent(new MessageEvent('message',{data:data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)}))}}
 const ws=new FakeWS(),writes=[],sockets=[];let release;const opened=new Promise(resolve=>release=resolve);
 const service=serveWisp(ws,({hostname,port})=>{assert.equal(hostname,'8.8.8.8');assert.equal(port,443);const socket={opened,closed:Promise.resolve(),readable:new ReadableStream({start(c){socketController=c}}),writable:new WritableStream({write(data){writes.push([...data])}}),async close(){this.didClose=true}};sockets.push(socket);return socket},async()=> '8.8.8.8');
 let socketController; // ReadableStream start runs only after a CONNECT message below.
 assert.equal(ws.sent[0][0],3);assert.equal(new DataView(ws.sent[0].buffer).getUint32(5,true),32);
 function connectPacket(id,port=443){const host=new TextEncoder().encode('example.com'),p=new Uint8Array(3+host.length);p[0]=1;new DataView(p.buffer).setUint16(1,port,true);p.set(host,3);return packet(1,id,p)}
 ws.message(connectPacket(1));ws.message(packet(2,1,new Uint8Array([1,2])));ws.message(packet(2,1,new Uint8Array([3,4])));
 await new Promise(resolve=>setTimeout(resolve,0));assert.equal(writes.length,0);release();await new Promise(resolve=>setTimeout(resolve,0));assert.deepEqual(writes,[[1,2],[3,4]]);
 socketController.enqueue(new Uint8Array([7,8]));await new Promise(resolve=>setTimeout(resolve,0));assert.ok(ws.sent.some(p=>p[0]===2&&p[5]===7&&p[6]===8));
 for(let i=0;i<16;i++)ws.message(packet(2,1,new Uint8Array([i])));await new Promise(resolve=>setTimeout(resolve,0));assert.ok(ws.sent.some(p=>p[0]===3&&new DataView(p.buffer).getUint32(1,true)===1));
 ws.message(connectPacket(9,25));assert.equal(ws.sent.at(-1)[5],0x48);
 ws.message(packet(4,1,new Uint8Array([2])));assert.equal(sockets[0].didClose,true);
 ws.message(new Uint8Array([1]));assert.equal(ws.closed,true);service.shutdown();
 // Search results and their destination can overlap many live resource streams.
 const busy=new FakeWS();let connected=0,closed=0;
 const multiplexed=serveWisp(busy,()=>{connected++;return {opened:Promise.resolve(),closed:Promise.resolve(),readable:new ReadableStream(),writable:new WritableStream(),async close(){closed++}}},async()=> '8.8.8.8');
 for(let id=1;id<=32;id++)busy.message(connectPacket(id));
 await new Promise(resolve=>setTimeout(resolve,0));assert.equal(connected,32,'Live streams are not capped at six');
 assert.ok(!busy.sent.some(p=>p[0]===4),'Concurrent page resources remain open');
 busy.message(connectPacket(33));assert.equal(busy.sent.at(-1)[5],0x49,'The client resource bound still applies');
 busy.message(packet(4,1));busy.message(connectPacket(34));await new Promise(resolve=>setTimeout(resolve,0));assert.equal(connected,33,'Closing a stream frees capacity');
 multiplexed.shutdown();assert.equal(closed,33);
 // Exercise real workerd binary-frame delivery at the production compatibility date.
 // A Node/FakeWS-only test misses the runtime's default Blob representation.
 const runtimeSource=compile(readFileSync('lib/web.ts','utf8'))+'\n'+compile(readFileSync('browser/wisp.ts','utf8').replace("import {publicAddress} from '../lib/web';",''))+`
 export default {fetch(){
  const pair=new WebSocketPair();const initialType=pair[1].binaryType;let output;
  acceptWisp(pair[1],()=>({opened:Promise.resolve(),closed:Promise.resolve(),readable:new ReadableStream({start(c){output=c}}),writable:new WritableStream({write(bytes){output.enqueue(bytes)}}),async close(){try{output.close()}catch{}}}),async()=> '8.8.8.8');
  return new Response(null,{status:101,webSocket:pair[0],headers:{'X-Initial-Binary-Type':initialType}});
 }};`;
 const runtime=new Miniflare({modules:true,script:runtimeSource,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat']});
 try{
  const upgraded=await runtime.dispatchFetch('https://browser.example/wisp/',{headers:{Upgrade:'websocket'}});assert.equal(upgraded.status,101);assert.equal(upgraded.headers.get('X-Initial-Binary-Type'),'blob');
  const client=upgraded.webSocket;client.binaryType='arraybuffer';client.accept();
  const echoed=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Runtime binary relay timed out')),5000);client.addEventListener('message',e=>{const data=new Uint8Array(e.data);if(data[0]===2){clearTimeout(timer);resolve(data)}});client.addEventListener('close',()=>{clearTimeout(timer);reject(new Error('Runtime rejected a binary frame'))})});
  client.send(connectPacket(1));client.send(packet(2,1,new Uint8Array([0x16,0x03,0x01,0x00,0x05])));
  assert.deepEqual([...await echoed],[2,1,0,0,0,0x16,0x03,0x01,0x00,0x05]);client.close();
 }finally{await runtime.dispose()}
 // The isolated browser must never use the workspace origin for rewritten pages.
 const component=readFileSync('components/browser-view.tsx','utf8');assert.ok(component.includes("e.source!==iframe.current?.contentWindow"));assert.ok(component.includes("e.origin!==originRef.current"));assert.ok(!readFileSync('app/page.tsx','utf8').includes("api('/api/live'"));
 console.log('Passed one-use browser tickets, disabled/expired account rejection, isolated cookies, public-DNS pinning, Wisp handshake/FIFO/data/flow-control/close, and invalid packet checks.');
}finally{await mf.dispose();rmSync(dir,{recursive:true,force:true})}
