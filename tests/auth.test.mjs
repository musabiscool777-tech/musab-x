import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const dir=mkdtempSync(join(tmpdir(),'musab-auth-')),originalFetch=globalThis.fetch;
try{
 writeFileSync(join(dir,'auth.mjs'),ts.transpileModule(readFileSync('lib/github-auth.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText);
 const {handleGithubAuth,githubAccount,digest,randomToken,cookieValue}=await import(pathToFileURL(join(dir,'auth.mjs')));
 const accounts=new Map(),sessions=new Map(),attempts=new Map();
 const DB={prepare(sql){return{bind(...args){return{
  async run(){
   if(sql.startsWith('INSERT INTO oauth_attempts'))attempts.set(args[0],{verifier:args[1],expires:args[2]});
   if(sql.startsWith('INSERT OR IGNORE INTO accounts')&&!accounts.has(args[0]))accounts.set(args[0],{id:args[0],email:args[1],name:args[2],role:args[3],disabled:0,data:'{}',version:0});
   if(sql.startsWith('INSERT INTO sessions'))sessions.set(args[0],{account_id:args[1],expires:args[2]});
   if(sql.startsWith('DELETE FROM sessions WHERE token_hash'))sessions.delete(args[0]);
   return{meta:{changes:1}};
  },
  async first(){
   if(sql.startsWith('DELETE FROM oauth_attempts WHERE state_hash')){const row=attempts.get(args[0]);attempts.delete(args[0]);return row&&row.expires>args[1]?row:null}
   if(sql.startsWith('SELECT disabled'))return accounts.get(args[0]);
   if(sql.startsWith('SELECT a.*')){const row=sessions.get(args[0]);return row&&row.expires>args[1]?accounts.get(row.account_id):null}
   throw new Error('Unexpected query: '+sql);
  }
 }}}}};
 const env={DB,APP_ORIGIN:'https://musab.example',GITHUB_CLIENT_ID:'test-id',GITHUB_CLIENT_SECRET:'test-secret',OWNER_GITHUB_ID:'123'};
 const req=(path,options={})=>new Request(env.APP_ORIGIN+path,options);
 assert.match(randomToken(),/^[\w-]{43}$/);assert.equal((await digest('hello')).length,43);
 assert.equal(cookieValue(req('/',{headers:{cookie:'x=1; x=2'}}),'x'),null);
 await assert.rejects(()=>githubAccount(req('/',{headers:{'oai-authenticated-user-id':'forged','oai-authenticated-user-email':'owner@example.com'}}),env),/Sign in/);
 assert.equal((await handleGithubAuth(req('/auth/signout'),env)).status,403);
 assert.equal((await handleGithubAuth(req('/auth/signout',{method:'POST',headers:{origin:'https://attacker.example'}}),env)).status,403);
 assert.equal((await handleGithubAuth(req('/auth/signin'),{...env,GITHUB_CLIENT_SECRET:undefined})).status,503);
 assert.equal((await handleGithubAuth(req('/auth/callback?state=invalid&code=fake'),env)).status,400);
 let calls=0,identity=123,verified=true;
 globalThis.fetch=async(url,options)=>{
  calls++;
  if(String(url).endsWith('access_token')){const body=JSON.parse(options.body);assert.ok(body.code_verifier);assert.equal(body.client_secret,'test-secret');return Response.json({access_token:'provider-token'})}
  if(String(url).endsWith('/emails'))return Response.json([{email:'owner@example.com',primary:true,verified}]);
  return Response.json({id:identity,login:'member',name:'Member'});
 };
 async function signIn(){
  const start=await handleGithubAuth(req('/auth/signin'),env),target=new URL(start.headers.get('location'));
  assert.equal(target.origin,'https://github.com');assert.equal(target.searchParams.get('scope'),'user:email');assert.equal(target.searchParams.get('code_challenge_method'),'S256');
  assert.ok(start.headers.get('set-cookie').includes('HttpOnly'));assert.ok(start.headers.get('set-cookie').includes('Secure'));
  const state=target.searchParams.get('state'),callback=req('/auth/callback?'+new URLSearchParams({state,code:'temporary-code'}),{headers:{cookie:'__Host-musab_oauth='+state}});
  return{callback,response:await handleGithubAuth(callback,env)};
 }
 const first=await signIn();assert.equal(first.response.status,303);
 const cookie=first.response.headers.getSetCookie().find(c=>c.startsWith('__Host-musab_session='));
 assert.ok(cookie);assert.ok(!cookie.includes('provider-token'));assert.equal(accounts.get('github:123').role,'admin');
 const sessionRequest=req('/',{headers:{cookie:cookie.split(';')[0]}});
 assert.equal((await githubAccount(sessionRequest,env)).id,'github:123');
 const prior=calls;assert.equal((await handleGithubAuth(first.callback,env)).status,400);assert.equal(calls,prior);
 accounts.get('github:123').disabled=1;await assert.rejects(()=>githubAccount(sessionRequest,env),/disabled/);accounts.get('github:123').disabled=0;
 identity=456;const member=await signIn();assert.equal(member.response.status,303);assert.equal(accounts.get('github:456').role,'member');
 verified=false;identity=789;assert.equal((await signIn()).response.status,503);assert.ok(!accounts.has('github:789'));
 const signout=await handleGithubAuth(req('/auth/signout',{method:'POST',headers:{origin:env.APP_ORIGIN,cookie:cookie.split(';')[0]}}),env);assert.equal(signout.status,303);
 await assert.rejects(()=>githubAccount(sessionRequest,env),/Sign in/);
 const token=randomToken();sessions.set(await digest(token),{account_id:'github:123',expires:Date.now()-1});
 await assert.rejects(()=>githubAccount(req('/',{headers:{cookie:'__Host-musab_session='+token}}),env),/Sign in/);
 console.log('Passed OAuth state/PKCE, verified identity, owner isolation, secure cookies, header spoof rejection, one-use callback, disabled/expired sessions, and logout checks.');
}finally{globalThis.fetch=originalFetch;rmSync(dir,{recursive:true,force:true})}
