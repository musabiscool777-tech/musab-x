export type AuthEnv = {
  DB?: D1Database;
  APP_ORIGIN?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  OWNER_GITHUB_ID?: string;
};
const sessionCookie='__Host-musab_session';
const stateCookie='__Host-musab_oauth';
const duration=30*24*60*60;
export function randomToken(){return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
export async function digest(value:string){const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
export function cookieValue(request:Request,name:string){const values=(request.headers.get('cookie')||'').split(';').map(v=>v.trim()).filter(v=>v.startsWith(name+'='));return values.length===1?values[0].slice(name.length+1):null}
function cookie(name:string,value:string,seconds:number){return `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${seconds}`}
function db(env:AuthEnv){if(!env.DB)throw new Error('Account storage is unavailable');return env.DB}
function origin(env:AuthEnv){if(!env.APP_ORIGIN)throw new Error('Set APP_ORIGIN before enabling sign-in');const u=new URL(env.APP_ORIGIN);if(u.protocol!=='https:'||u.origin!==env.APP_ORIGIN)throw new Error('APP_ORIGIN must be an HTTPS origin without a trailing slash');return u.origin}
function redirect(to:string,cookies:string[]=[]){const headers=new Headers({Location:to,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});cookies.forEach(c=>headers.append('Set-Cookie',c));return new Response(null,{status:303,headers})}
export async function githubAccount(request:Request,env:AuthEnv){
 const token=cookieValue(request,sessionCookie);if(!token||!/^[\w-]{43}$/.test(token))throw new Error('Sign in to continue');
 const a=await db(env).prepare('SELECT a.* FROM sessions s JOIN accounts a ON a.id=s.account_id WHERE s.token_hash=? AND s.expires>?').bind(await digest(token),Date.now()).first<any>();
 if(!a)throw new Error('Sign in to continue');if(a.disabled)throw new Error('This account is disabled');return a;
}
export async function handleGithubAuth(request:Request,env:AuthEnv):Promise<Response|null>{
 const url=new URL(request.url);if(!['/auth/signin','/auth/callback','/auth/signout'].includes(url.pathname))return null;
 try{
  const base=origin(env);if(url.origin!==base)return new Response('Invalid sign-in origin',{status:400});
  if(url.pathname==='/auth/signout'){
   if(request.method!=='POST'||request.headers.get('origin')!==base)return new Response('Sign-out requires a same-origin POST',{status:403});
   const token=cookieValue(request,sessionCookie);if(token)await db(env).prepare('DELETE FROM sessions WHERE token_hash=?').bind(await digest(token)).run();
   return redirect(base+'/',[cookie(sessionCookie,'',0),cookie(stateCookie,'',0)]);
  }
  if(request.method!=='GET')return new Response('Method not allowed',{status:405});
  if(!env.GITHUB_CLIENT_ID||!env.GITHUB_CLIENT_SECRET)return new Response('GitHub sign-in is not configured yet. The owner must complete the hosting setup.',{status:503});
  const callback=base+'/auth/callback';
  if(url.pathname==='/auth/signin'){
   const state=randomToken(),verifier=randomToken();
   await db(env).prepare('DELETE FROM oauth_attempts WHERE expires<?').bind(Date.now()).run();
   await db(env).prepare('INSERT INTO oauth_attempts (state_hash,verifier,expires) VALUES (?,?,?)').bind(await digest(state),verifier,Date.now()+600000).run();
   const target=new URL('https://github.com/login/oauth/authorize');target.search=new URLSearchParams({client_id:env.GITHUB_CLIENT_ID,redirect_uri:callback,scope:'user:email',state,code_challenge:await digest(verifier),code_challenge_method:'S256'}).toString();
   return redirect(target.href,[cookie(stateCookie,state,600)]);
  }
  const state=url.searchParams.get('state'),stored=cookieValue(request,stateCookie),code=url.searchParams.get('code');
  if(!state||!stored||state!==stored||!/^[\w-]{43}$/.test(state)||!code||code.length>200)return new Response('Sign-in expired or was cancelled. Return to Musab X and try again.',{status:400});
  // Consume the attempt atomically: a callback cannot create a second session.
  const attempt=await db(env).prepare('DELETE FROM oauth_attempts WHERE state_hash=? AND expires>? RETURNING verifier').bind(await digest(state),Date.now()).first<{verifier:string}>();
  if(!attempt)return new Response('Sign-in expired. Please try again.',{status:400});
  const response=await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({client_id:env.GITHUB_CLIENT_ID,client_secret:env.GITHUB_CLIENT_SECRET,code,redirect_uri:callback,code_verifier:attempt.verifier}),signal:AbortSignal.timeout(15000)});
  const grant:any=await response.json();if(!response.ok||typeof grant.access_token!=='string')throw new Error('GitHub could not complete sign-in');
  const headers={Accept:'application/vnd.github+json',Authorization:'Bearer '+grant.access_token,'User-Agent':'Musab-X','X-GitHub-Api-Version':'2022-11-28'};
  const [profileResponse,emailResponse]=await Promise.all([fetch('https://api.github.com/user',{headers,signal:AbortSignal.timeout(15000)}),fetch('https://api.github.com/user/emails',{headers,signal:AbortSignal.timeout(15000)})]);
  if(!profileResponse.ok||!emailResponse.ok)throw new Error('GitHub identity could not be verified');
  const profile:any=await profileResponse.json(),emails:any=await emailResponse.json();
  const email=Array.isArray(emails)?(emails.find((e:any)=>e.primary&&e.verified)||emails.find((e:any)=>e.verified))?.email:null;
  if(!Number.isSafeInteger(profile.id)||!email||typeof email!=='string')throw new Error('Add a verified email to your GitHub account before signing in');
  const id='github:'+profile.id,name=String(profile.name||profile.login||'Member').slice(0,60),role=String(profile.id)===env.OWNER_GITHUB_ID?'admin':'member';
  await db(env).prepare('INSERT OR IGNORE INTO accounts (id,email,name,role,created) VALUES (?,?,?,?,?)').bind(id,email,name,role,new Date().toISOString()).run();
  // Email changes never change ownership; administrator identity uses the GitHub ID.
  await db(env).prepare('UPDATE accounts SET email=? WHERE id=?').bind(email,id).run();
  const account=await db(env).prepare('SELECT disabled FROM accounts WHERE id=?').bind(id).first<{disabled:number}>();if(account?.disabled)throw new Error('This account is disabled');
  const token=randomToken();await db(env).prepare('DELETE FROM sessions WHERE expires<?').bind(Date.now()).run();
  await db(env).prepare('INSERT INTO sessions (token_hash,account_id,expires) VALUES (?,?,?)').bind(await digest(token),id,Date.now()+duration*1000).run();
  // Provider tokens are used only for verification and are never stored or sent to the browser.
  return redirect(base+'/',[cookie(sessionCookie,token,duration),cookie(stateCookie,'',0)]);
 }catch(error){return new Response((error as Error).message==='This account is disabled'?'This account is disabled':'Sign-in could not be completed. Check the hosting configuration and try again.',{status:503,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}})}
}
