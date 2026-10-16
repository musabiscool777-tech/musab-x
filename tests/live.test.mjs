import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const dir=mkdtempSync(join(tmpdir(),'musab-live-')),originalFetch=globalThis.fetch;
const compile=s=>ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const require=createRequire(import.meta.resolve('wrangler/package.json'));
const {Miniflare}=await import(pathToFileURL(require.resolve('miniflare')));
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("ok")}}',d1Databases:['DB']});
try{
 writeFileSync(join(dir,'web.mjs'),compile(readFileSync('lib/web.ts','utf8')));
 writeFileSync(join(dir,'browserless.mjs'),compile(readFileSync('lib/browserless.ts','utf8').replace("'./web'","'./web.mjs'")));
 const {createLiveBrowser}=await import(pathToFileURL(join(dir,'browserless.mjs')));
 const token='fixture-secret-no-real-account';let calls=0;
 const viewer='https://production-sfo.browserless.io/live/index.html?i=fixture';
 globalThis.fetch=async(url,options)=>{calls++;assert.equal(new URL(url).searchParams.get('token'),token);const data=JSON.parse(options.body);assert.ok(data.query.includes('detached: true'));assert.ok(data.query.includes('interactable: true'));return Response.json({data:{liveURL:{liveURL:viewer,timeout:120000}}})};
 const session=await createLiveBrowser('https://www.google.com/search?q=a%22b',token);assert.equal(session.liveURL,viewer);assert.ok(!JSON.stringify(session).includes(token));
 let querySeen;globalThis.fetch=async(url,options)=>{querySeen=JSON.parse(options.body).query;assert.equal(new URL(url).searchParams.get('timeout'),'3600000');return Response.json({data:{liveURL:{liveURL:viewer,timeout:3600000}}})};
 const long=await createLiveBrowser('https://example.com/',token,{quality:'sharp',sessionMinutes:60});assert.ok(long.expiresAt>Date.now()+3590000);assert.ok(querySeen.includes('captureScale: 2'));assert.ok(querySeen.includes('quality: 92'));
 globalThis.fetch=async(url,options)=>{querySeen=JSON.parse(options.body).query;return Response.json({data:{liveURL:{liveURL:viewer,timeout:120000}}})};
 const capped=await createLiveBrowser('https://example.com/',token,{quality:'fast',sessionMinutes:60});assert.ok(capped.expiresAt<=Date.now()+120000);assert.ok(querySeen.includes('compressed: false'));assert.ok(querySeen.includes('quality: 60'));
 const defaultSession=await createLiveBrowser('https://example.com/',token);assert.ok(querySeen.includes('quality: 85'));assert.ok(querySeen.includes('compressed: false'));
 await assert.rejects(()=>createLiveBrowser('https://127.0.0.1/',token));
 await assert.rejects(()=>createLiveBrowser('https://example.com/',''),/BROWSERLESS_TOKEN/);
 for(const bad of ['https://evil.example/live/index.html?i=x','https://production-sfo.browserless.io/live/index.html?token='+token,'https://production-sfo.browserless.io.evil.example/live/index.html']){
  globalThis.fetch=async()=>Response.json({data:{liveURL:{liveURL:bad}}});await assert.rejects(()=>createLiveBrowser('https://example.com/',token));
 }
 globalThis.fetch=async()=>Response.json({errors:[{message:token}]});await assert.rejects(()=>createLiveBrowser('https://example.com/',token),e=>!e.message.includes(token));
 for(const status of [401,403,429,500]){globalThis.fetch=async()=>new Response(token,{status});await assert.rejects(()=>createLiveBrowser('https://example.com/',token),e=>!e.message.includes(token))}
 const database=await mf.getD1Database('DB');await database.exec(readFileSync('drizzle/0002_live_browser.sql','utf8').replaceAll('\n',' '));
 globalThis.liveTestEnv={BROWSERLESS_TOKEN:token};
 globalThis.liveTestCore={account:async r=>{if(!r.headers.get('x-test-login'))throw Error('unsigned');return{id:r.headers.get('x-test-login')}},body:async r=>r.json(),db:()=>database,json:(v,s=200)=>Response.json(v,{status:s}),checkWrite:r=>{if(r.headers.get('origin')!==new URL(r.url).origin||!r.headers.get('content-type')?.includes('application/json'))throw Error('origin')}};
 const source=readFileSync('app/api/live/route.ts','utf8').replace("import {env} from 'cloudflare:workers';",'const env=globalThis.liveTestEnv;').replace("import {account,body,checkWrite,db,json} from '../../../lib/core';",'const {account,body,checkWrite,db,json}=globalThis.liveTestCore;').replace("'../../../lib/browserless'","'./browserless.mjs'").replace("'../../../lib/web'","'./web.mjs'");
 writeFileSync(join(dir,'route.mjs'),compile(source));const {POST}=await import(pathToFileURL(join(dir,'route.mjs')));
 const request=(user='one',origin='https://musab.example',url='https://www.google.com/search?q=test')=>new Request('https://musab.example/api/live',{method:'POST',headers:{origin,'content-type':'application/json',...(user?{'x-test-login':user}:{})},body:JSON.stringify({url})});
 calls=0;globalThis.fetch=async()=>{calls++;return Response.json({data:{liveURL:{liveURL:viewer,timeout:120000}}})};
 assert.equal((await POST(request('one','https://evil.example'))).status,403);assert.equal((await POST(request(''))).status,401);assert.equal(calls,0);
 assert.equal((await POST(request('one',undefined,'https://127.0.0.1/'))).status,400);assert.equal(calls,0);
 globalThis.liveTestEnv.BROWSERLESS_TOKEN='';assert.equal((await POST(request())).status,503);globalThis.liveTestEnv.BROWSERLESS_TOKEN=token;
 const responses=await Promise.all(Array.from({length:9},()=>POST(request())));assert.equal(responses.filter(r=>r.status===200).length,6);assert.equal(responses.filter(r=>r.status===429).length,3);assert.equal(calls,6);
 assert.equal((await POST(request('two'))).status,200);
 await database.prepare('UPDATE live_browser_usage SET window_start=? WHERE account_id=?').bind(Date.now()-600001,'one').run();assert.equal((await POST(request())).status,200);
 console.log('Live browser tests passed: token containment, viewer allowlist, provider errors, authentication, origin checks, private addresses, atomic D1 limits, account isolation and quota reset.');
}finally{globalThis.fetch=originalFetch;delete globalThis.liveTestEnv;delete globalThis.liveTestCore;await mf.dispose();rmSync(dir,{recursive:true,force:true})}
