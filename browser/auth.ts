import {cookieValue,digest,randomToken} from '../lib/github-auth';
type Env={DB:D1Database,APP_ORIGIN:string};
const COOKIE='__Host-musab_browser';
export async function exchangeTicket(r:Request,env:Env){
 const origin=new URL(r.url).origin;
 if(r.method!=='POST'||r.headers.get('origin')!==origin||!r.headers.get('content-type')?.includes('application/json'))return new Response('Invalid request',{status:403});
 if(Number(r.headers.get('content-length')||0)>1024)return new Response('Invalid ticket',{status:400});
 let ticket;try{const raw=await r.text();if(raw.length>1024)throw 0;ticket=JSON.parse(raw).ticket}catch{return new Response('Invalid ticket',{status:400})}
 if(typeof ticket!=='string'||!/^[-\w]{43}$/.test(ticket))return new Response('Invalid ticket',{status:400});
 const now=Date.now();
 const row=await env.DB.prepare('DELETE FROM browser_tickets WHERE token_hash=? AND expires>? RETURNING account_id').bind(await digest(ticket),now).first<{account_id:string}>();
 if(!row)return new Response('Sign in again to reconnect the browser.',{status:401});
 const account=await env.DB.prepare('SELECT disabled FROM accounts WHERE id=?').bind(row.account_id).first<{disabled:number}>();
 if(!account||account.disabled)return new Response('Account unavailable',{status:403});
 const token=randomToken();
 await env.DB.prepare('DELETE FROM browser_sessions WHERE expires<=?').bind(now).run();
 await env.DB.prepare('INSERT INTO browser_sessions (token_hash,account_id,expires) VALUES (?,?,?)').bind(await digest(token),row.account_id,now+8*3600000).run();
 return Response.json({ok:true},{headers:{'Cache-Control':'no-store','Set-Cookie':`${COOKIE}=${token}; Path=/; Secure; HttpOnly; SameSite=None; Partitioned; Max-Age=28800`}});
}
export async function relayAccount(r:Request,env:Env){
 const token=cookieValue(r,COOKIE);if(!token||!/^[-\w]{43}$/.test(token))return null;
 return env.DB.prepare('SELECT a.id FROM browser_sessions s JOIN accounts a ON a.id=s.account_id WHERE s.token_hash=? AND s.expires>? AND a.disabled=0').bind(await digest(token),Date.now()).first<{id:string}>();
}
