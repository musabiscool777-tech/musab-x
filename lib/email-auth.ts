import {cookieValue,digest,githubAccount,randomToken,type AuthEnv} from './github-auth';
export type EmailAuthEnv=AuthEnv & {SUPABASE_URL?:string;SUPABASE_ANON_KEY?:string};
class EmailError extends Error{constructor(message:string,public status=400){super(message)}}
const genericCode='If this address can receive account emails, a code is on its way. Check your inbox and spam folder.';
function json(value:unknown,status=200){return Response.json(value,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}})}
export function emailConfigured(env:EmailAuthEnv){return !!env.SUPABASE_URL&&!!env.SUPABASE_ANON_KEY}
function configuration(env:EmailAuthEnv){
 if(!emailConfigured(env))throw new EmailError('Email sign-in is not configured yet. The owner must connect the email authentication service.',503);
 const url=new URL(env.SUPABASE_URL!);if(url.protocol!=='https:'||url.pathname!=='/'||url.search||url.hash||url.username||url.password||!/^[-a-z0-9]+\.supabase\.co$/.test(url.hostname))throw new EmailError('Email authentication configuration is invalid.',503);
 return url.origin+'/auth/v1';
}
async function provider(env:EmailAuthEnv,path:string,body?:unknown,accessToken?:string,method='POST'){
 let response:Response;
 try{response=await fetch(configuration(env)+path,{method,headers:{apikey:env.SUPABASE_ANON_KEY!,'Content-Type':'application/json',...(accessToken?{Authorization:'Bearer '+accessToken}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)})}catch(error){if(error instanceof EmailError)throw error;throw new EmailError('The email sign-in service is unavailable. Try again shortly.',503)}
 let data:any;try{data=await response.json()}catch{throw new EmailError('The email sign-in service returned an invalid response.',502)}
 if(!response.ok)throw new EmailError(response.status===429?'Too many attempts. Wait a few minutes and try again.':'Sign-in could not be completed. Check your details, verify your email, or request a new code.',response.status===429?429:400);
 return data;
}
async function limit(env:EmailAuthEnv,bucket:string,max:number){
 const now=Date.now(),cutoff=now-600000;
 const result=await env.DB!.prepare('INSERT INTO email_auth_limits (bucket,window_start,attempts) VALUES (?,?,1) ON CONFLICT(bucket) DO UPDATE SET attempts=CASE WHEN window_start<=? THEN 1 ELSE attempts+1 END,window_start=CASE WHEN window_start<=? THEN ? ELSE window_start END WHERE window_start<=? OR attempts<?').bind(await digest(bucket),now,cutoff,cutoff,now,cutoff,max).run();
 if(!result.meta.changes)throw new EmailError('Too many attempts. Wait ten minutes and try again.',429);
}
function password(value:unknown){if(typeof value!=='string'||value.length<12||value.length>128)throw new EmailError('Use a password between 12 and 128 characters.');return value}
export async function handleEmailAuth(request:Request,env:EmailAuthEnv):Promise<Response|null>{
 const url=new URL(request.url);if(url.pathname!=='/auth/email')return null;
 if(request.method!=='POST')return json({error:'Use a POST request.'},405);
 if(!env.APP_ORIGIN||url.origin!==env.APP_ORIGIN||request.headers.get('origin')!==env.APP_ORIGIN||!request.headers.get('content-type')?.includes('application/json'))return json({error:'Invalid sign-in origin.'},403);
 try{
  configuration(env);if(!env.DB)throw new EmailError('Account storage is unavailable.',503);
  const raw=await request.text();if(raw.length>4096)throw new EmailError('Sign-in request is too large.');
  let b:any;try{b=JSON.parse(raw)}catch{throw new EmailError('Invalid sign-in request.')}
  const email=typeof b.email==='string'?b.email.trim().toLowerCase():'';
  if(email.length>254||!/^\S+@[^@\s]+\.[^@\s]+$/.test(email))throw new EmailError('Enter a valid email address.');
  const actions=['password','signup','send-code','verify-code'];if(!actions.includes(b.action))throw new EmailError('Choose a sign-in method.');
  await limit(env,'ip:'+(request.headers.get('cf-connecting-ip')||'unknown'),30);
  await limit(env,'email:'+email,10);
  // Linking requires the existing account session before any provider operation.
  const linking=b.link===true;
  const existing=linking?await githubAccount(request,env).catch(()=>{throw new EmailError('Sign in to your existing account before linking an email.',401)}):null;
  if(b.action==='send-code'){
   // Provider handles expiry, one-use verification, and email delivery. No code is returned to the client.
   await provider(env,'/otp',{email,create_user:true});return json({message:genericCode});
  }
  if(b.action==='signup'){
   const result=await provider(env,'/signup',{email,password:password(b.password)});
   if(result.access_token)throw new EmailError('Email confirmation must be enabled in the authentication service before signup can be used.',503);
   return json({message:genericCode,verifyType:'signup'});
  }
  const grant=b.action==='password'?await provider(env,'/token?grant_type=password',{email,password:password(b.password)}):await provider(env,'/verify',{email,token:typeof b.code==='string'&&/^\d{6,8}$/.test(b.code)?b.code:(()=>{throw new EmailError('Enter the code from your email.')})(),type:b.verifyType==='signup'?'signup':'email'});
  if(typeof grant.access_token!=='string')throw new EmailError('Sign-in could not be verified. Request a new code.');
  // Verify the token with the issuing service; never trust user fields supplied by the client.
  const user=await provider(env,'/user',undefined,grant.access_token,'GET');
  if(!user.email_confirmed_at||typeof user.id!=='string'||!/^[\da-f-]{36}$/i.test(user.id)||String(user.email).toLowerCase()!==email)throw new EmailError('Verify your email before signing in.');
  const identity='supabase:'+user.id;
  let mapped=await env.DB.prepare('SELECT account_id FROM email_identities WHERE provider_id=?').bind(identity).first<{account_id:string}>();
  if(linking&&mapped&&mapped.account_id!==existing!.id)throw new EmailError('That email belongs to another workspace. Sign in to that workspace separately.',409);
  const accountId=mapped?.account_id||(linking?existing!.id:identity);
  if(!mapped){
   if(!linking)await env.DB.prepare('INSERT OR IGNORE INTO accounts (id,email,name,role,created) VALUES (?,?,?,?,?)').bind(accountId,email,email.split('@')[0].slice(0,60),'member',new Date().toISOString()).run();
   await env.DB.prepare('INSERT OR IGNORE INTO email_identities (provider_id,account_id) VALUES (?,?)').bind(identity,accountId).run();
   mapped=await env.DB.prepare('SELECT account_id FROM email_identities WHERE provider_id=?').bind(identity).first<{account_id:string}>();
   if(mapped?.account_id!==accountId)throw new EmailError('The email is linked to a different workspace.',409);
  }
  const local=await env.DB.prepare('SELECT disabled FROM accounts WHERE id=?').bind(accountId).first<{disabled:number}>();if(!local||local.disabled)throw new EmailError('This account is disabled.',403);
  if(b.newPassword!==undefined){if(b.action!=='verify-code')throw new EmailError('Verify an email code before setting a password.');await provider(env,'/user',{password:password(b.newPassword)},grant.access_token,'PUT')}
  const token=randomToken(),duration=30*24*60*60,old=cookieValue(request,'__Host-musab_session');
  const queries=[env.DB.prepare('DELETE FROM sessions WHERE expires<?').bind(Date.now()),env.DB.prepare('INSERT INTO sessions (token_hash,account_id,expires) VALUES (?,?,?)').bind(await digest(token),accountId,Date.now()+duration*1000)];
  if(b.newPassword!==undefined)queries.unshift(env.DB.prepare('DELETE FROM sessions WHERE account_id=?').bind(accountId));
  if(old)queries.push(env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await digest(old)));
  await env.DB.batch(queries);
  const response=json({ok:true,linked:linking});response.headers.append('Set-Cookie',`__Host-musab_session=${token}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${duration}`);return response;
 }catch(error){return json({error:error instanceof EmailError?error.message:'Email sign-in could not be completed. Check the authentication setup and database migration.'},error instanceof EmailError?error.status:503)}
}
