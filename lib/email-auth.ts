import {cookieValue,digest,githubAccount,randomToken,type AuthEnv} from './github-auth';
export type EmailAuthEnv=AuthEnv & {SUPABASE_URL?:string;SUPABASE_ANON_KEY?:string};
class EmailError extends Error{constructor(message:string,public status=400,public code='email_signin_failed'){super(message)}}
const genericCode='If this address can receive account emails, a code is on its way. Check your inbox and spam folder.';
function json(value:unknown,status=200){return Response.json(value,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}})}
export function emailConfigured(env:EmailAuthEnv){return !!env.SUPABASE_URL?.trim()&&!!env.SUPABASE_ANON_KEY?.trim()}
function configuration(env:EmailAuthEnv){
 if(!emailConfigured(env))throw new EmailError('Email sign-in is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to the musab-x Worker.',503,'email_not_configured');
 let url:URL;try{url=new URL(env.SUPABASE_URL!.trim())}catch{throw new EmailError('SUPABASE_URL is invalid. Copy the HTTPS project URL from Supabase, not its dashboard link.',503,'invalid_project_url')}
 if(url.protocol!=='https:'||url.pathname!=='/'||url.search||url.hash||url.username||url.password||!/^[-a-z0-9]+\.supabase\.co$/.test(url.hostname))throw new EmailError('SUPABASE_URL is invalid. Copy the HTTPS project URL from Supabase, not its dashboard link.',503,'invalid_project_url');
 const key=env.SUPABASE_ANON_KEY!.trim();
 if(!/^[\x21-\x7e]+$/.test(key))throw new EmailError('SUPABASE_ANON_KEY contains spaces or invalid characters. Copy only the Supabase publishable/anon key.',503,'invalid_api_key_format');
 if(key.startsWith('sb_secret_'))throw new EmailError('Use the Supabase publishable/anon key, not a secret admin key.',503,'wrong_api_key_type');
 return {base:url.origin+'/auth/v1',key};
}
function connectionError(error:unknown){
 const e=error as {name?:string,message?:string,cause?:{message?:string}};
 if(e?.name==='TimeoutError'||e?.name==='AbortError')return new EmailError('The Supabase connection timed out. Check that the project is running, then retry.',503,'supabase_timeout');
 // Never return raw exception text: it can contain headers, tokens or URLs.
 const detail=String(e?.message||'')+' '+String(e?.cause?.message||'');
 if(/dns|resolve|name.*not.*found|ENOTFOUND/i.test(detail))return new EmailError('The Supabase project address could not be resolved. Recopy SUPABASE_URL from the project Home page.',503,'supabase_dns_failed');
 return new EmailError('Musab X could not connect to Supabase. Check the project URL and project status.',503,'supabase_connection_failed');
}
async function provider(env:EmailAuthEnv,path:string,body?:unknown,accessToken?:string,method='POST'){
 const {base,key}=configuration(env);let response:Response;
 try{response=await fetch(base+path,{method,redirect:'error',headers:{apikey:key,'Content-Type':'application/json',...(accessToken?{Authorization:'Bearer '+accessToken}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)})}catch(error){throw connectionError(error)}
 let data:any;try{data=await response.json()}catch{throw new EmailError('Supabase returned an invalid response. Check its project status.',502,'supabase_invalid_response')}
 if(!response.ok){
  if(response.status===429)throw new EmailError('Too many attempts. Wait a few minutes and try again.',429,'email_rate_limited');
  if((path==='/settings'&&[401,403].includes(response.status))||/invalid api key|no api key/i.test(String(data?.message||'')))throw new EmailError('Supabase rejected the API key. Recopy the publishable/anon key from the same project as SUPABASE_URL.',503,'supabase_key_rejected');
  if(data?.code==='email_address_not_authorized')throw new EmailError('Supabase is still using its restricted test email sender. Enable and save your custom SMTP settings.',503,'smtp_not_configured');
  if(data?.code==='email_provider_disabled')throw new EmailError('Enable Email under Supabase Authentication → Sign In / Providers.',503,'email_provider_disabled');
  if(response.status>=500){
   const mail=['/otp','/signup'].includes(path)&&/email|smtp|mail/i.test(String(data?.msg||data?.message||''));
   throw new EmailError(mail?'Supabase could not send the email. Check its Auth logs and the Brevo SMTP login, SMTP key, and verified sender.':'Supabase authentication returned a server error. Check the project Auth logs.',502,mail?'smtp_send_failed':'supabase_server_error');
  }
  throw new EmailError('Sign-in could not be completed. Check your details, verify your email, or request a new code.');
 }
 return data;
}
export async function checkEmailConnection(env:EmailAuthEnv){
 let project:string|undefined;
 try{
  const {base}=configuration(env);project=new URL(base).origin;
  // Read-only public provider settings. This never sends an email or signs in.
  const settings=await provider(env,'/settings',undefined,undefined,'GET');
  if(settings?.external?.email===false)throw new EmailError('Enable Email under Supabase Authentication → Sign In / Providers.',503,'email_provider_disabled');
  if(settings?.mailer_autoconfirm===true||settings?.autoconfirm===true)throw new EmailError('Enable Confirm email in Supabase before creating Musab X accounts.',503,'email_confirmation_disabled');
  return {ok:true,code:'connected',message:'Supabase connection and API key work. This check does not test SMTP delivery.',project};
 }catch(error){const e=error instanceof EmailError?error:connectionError(error);return {ok:false,code:e.code,message:e.message,...(project?{project}:{})}}
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
 }catch(error){return json({...(error instanceof EmailError?{code:error.code}:{}),error:error instanceof EmailError?error.message:'Email sign-in could not be completed. Check the authentication setup and database migration.'},error instanceof EmailError?error.status:503)}
}
