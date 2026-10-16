import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const dir=mkdtempSync(join(tmpdir(),'musab-email-')),originalFetch=globalThis.fetch;
const compile=s=>ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const require=createRequire(import.meta.resolve('wrangler/package.json'));
const {Miniflare}=await import(pathToFileURL(require.resolve('miniflare')));
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("ok")}}',d1Databases:['DB']});
try{
 writeFileSync(join(dir,'github-auth.mjs'),compile(readFileSync('lib/github-auth.ts','utf8')));
 writeFileSync(join(dir,'email-auth.mjs'),compile(readFileSync('lib/email-auth.ts','utf8').replace("'./github-auth'","'./github-auth.mjs'")));
 const {handleEmailAuth}=await import(pathToFileURL(join(dir,'email-auth.mjs')));
 const {digest,githubAccount}=await import(pathToFileURL(join(dir,'github-auth.mjs')));
 const DB=await mf.getD1Database('DB');for(const name of ['0000_pink_tomorrow_man.sql','0001_independent_auth.sql','0003_email_auth.sql'])await DB.exec(readFileSync('drizzle/'+name,'utf8').replaceAll('\n',' '));
 const env={DB,APP_ORIGIN:'https://musab.example',SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_ANON_KEY:'fixture-key'};
 let calls=0,verified=true;const profiles=new Map(),codes=new Set();
 const profile=email=>{if(!profiles.has(email))profiles.set(email,{id:crypto.randomUUID(),email,email_confirmed_at:'2026-01-01T00:00:00Z'});return profiles.get(email)};
 let current;
 globalThis.fetch=async(raw,opts)=>{
  calls++;const u=new URL(raw);assert.equal(u.origin,env.SUPABASE_URL);assert.equal(opts.headers.apikey,env.SUPABASE_ANON_KEY);const b=opts.body?JSON.parse(opts.body):{};
  if(u.pathname.endsWith('/otp')){codes.add(b.email);return Response.json({})}
  if(u.pathname.endsWith('/signup'))return Response.json({user:profile(b.email)});
  if(u.pathname.endsWith('/verify')){if(!codes.delete(b.email)||b.token!=='123456')return Response.json({error:'invalid fixture-code'},{status:400});current=profile(b.email);return Response.json({access_token:'private-provider-access-token',refresh_token:'private-refresh-token'})}
  if(u.pathname.endsWith('/token')){if(b.password!=='correct-fixture-password')return Response.json({error:'wrong password'},{status:400});current=profile(b.email);return Response.json({access_token:'private-provider-access-token'})}
  if(u.pathname.endsWith('/user')){assert.equal(opts.headers.Authorization,'Bearer private-provider-access-token');if(opts.method==='PUT'){assert.equal(b.password,'new-fixture-password');return Response.json(current)}return Response.json({...current,email_confirmed_at:verified?current.email_confirmed_at:null})}
  throw Error('Unexpected provider route');
 };
 const req=(b,headers={})=>new Request(env.APP_ORIGIN+'/auth/email',{method:'POST',headers:{origin:env.APP_ORIGIN,'content-type':'application/json','cf-connecting-ip':'198.51.100.1',...headers},body:JSON.stringify(b)});
 const run=b=>handleEmailAuth(req(b),env);
 const cookie=r=>r.headers.get('set-cookie').split(';')[0];
 const signin=async email=>{await run({action:'send-code',email});return run({action:'verify-code',email,code:'123456'})};
 assert.equal((await handleEmailAuth(new Request(env.APP_ORIGIN+'/auth/email'),env)).status,405);
 assert.equal((await handleEmailAuth(req({email:'a@example.com',action:'send-code'},{origin:'https://evil.example'}),env)).status,403);assert.equal(calls,0);
 assert.equal((await handleEmailAuth(req({email:'a@example.com',action:'send-code'}),{...env,SUPABASE_ANON_KEY:''})).status,503);
 assert.equal((await run({email:'invalid',action:'send-code'})).status,400);
 const signup=await run({email:'new@example.com',action:'signup',password:'correct-fixture-password'});assert.equal(signup.status,200);assert.equal(signup.headers.get('set-cookie'),null);assert.equal((await signup.json()).verifyType,'signup');
 await DB.prepare('INSERT INTO accounts (id,email,name,role,created,data) VALUES (?,?,?,?,?,?)').bind('github:1','owner@example.com','Owner','admin','today','{"notes":"keep me"}').run();
 const ownerToken='a'.repeat(43);await DB.prepare('INSERT INTO sessions (token_hash,account_id,expires) VALUES (?,?,?)').bind(await digest(ownerToken),'github:1',Date.now()+600000).run();
 const response=await signin('owner@example.com');assert.equal(response.status,200);const body=JSON.stringify(await response.json());assert.ok(!body.includes('provider-access-token'));assert.ok(!body.includes('refresh-token'));assert.match(response.headers.get('set-cookie'),/Secure; HttpOnly; SameSite=Lax/);
 const member=await githubAccount(new Request(env.APP_ORIGIN,{headers:{cookie:cookie(response)}}),env);assert.equal(member.role,'member');assert.notEqual(member.id,'github:1');
 assert.equal((await run({email:'owner@example.com',action:'verify-code',code:'123456'})).status,400);
 assert.equal((await run({email:'owner@example.com',action:'password',password:'wrong-fixture-password'})).status,400);
 const pass=await run({email:'owner@example.com',action:'password',password:'correct-fixture-password'});assert.equal(pass.status,200);assert.equal((await githubAccount(new Request(env.APP_ORIGIN,{headers:{cookie:cookie(pass)}}),env)).id,member.id);
 const ownerHeaders={cookie:'__Host-musab_session='+ownerToken};
 const collision=await handleEmailAuth(req({email:'owner@example.com',action:'password',password:'correct-fixture-password',link:true},ownerHeaders),env);assert.equal(collision.status,409);
 assert.equal((await run({email:'linked@example.com',action:'send-code',link:true})).status,401);
 await handleEmailAuth(req({email:'linked@example.com',action:'send-code',link:true},ownerHeaders),env);
 const linked=await handleEmailAuth(req({email:'linked@example.com',action:'verify-code',code:'123456',link:true},ownerHeaders),env);assert.equal(linked.status,200);
 const owner=await githubAccount(new Request(env.APP_ORIGIN,{headers:{cookie:cookie(linked)}}),env);assert.equal(owner.id,'github:1');assert.equal(owner.role,'admin');assert.equal(JSON.parse(owner.data).notes,'keep me');
 await assert.rejects(()=>githubAccount(new Request(env.APP_ORIGIN,{headers:ownerHeaders}),env));
 const ownerAgain=await signin('linked@example.com');assert.equal((await githubAccount(new Request(env.APP_ORIGIN,{headers:{cookie:cookie(ownerAgain)}}),env)).id,'github:1');
 await DB.prepare('UPDATE accounts SET disabled=1 WHERE id=?').bind(member.id).run();assert.equal((await run({email:'owner@example.com',action:'password',password:'correct-fixture-password'})).status,403);
 verified=false;const unverified=await run({email:'unverified@example.com',action:'password',password:'correct-fixture-password'});assert.equal(unverified.status,400);assert.equal(unverified.headers.get('set-cookie'),null);verified=true;
 await run({email:'reset@example.com',action:'send-code'});const reset=await run({email:'reset@example.com',action:'verify-code',code:'123456',newPassword:'new-fixture-password'});assert.equal(reset.status,200);
 await run({email:'linked@example.com',action:'send-code'});const resetOwner=await run({email:'linked@example.com',action:'verify-code',code:'123456',newPassword:'new-fixture-password'});assert.equal(resetOwner.status,200);await assert.rejects(()=>githubAccount(new Request(env.APP_ORIGIN,{headers:{cookie:cookie(ownerAgain)}}),env));assert.equal((await githubAccount(new Request(env.APP_ORIGIN,{headers:{cookie:cookie(resetOwner)}}),env)).id,'github:1');
 const responses=await Promise.all(Array.from({length:12},()=>run({email:'limited@example.com',action:'send-code'})));assert.equal(responses.filter(r=>r.status===429).length,2);
 console.log('Email auth tests passed: provider verification, signup confirmation, password/code sign-in, reset, CSRF, code replay, secure cookies, disabled users, atomic limits, explicit linking, owner isolation and preserved workspace data.');
}finally{globalThis.fetch=originalFetch;await mf.dispose();rmSync(dir,{recursive:true,force:true})}
