import {digest,randomToken} from './github-auth';
export function browserOrigin(env:{APP_ORIGIN?:string,BROWSER_ORIGIN?:string}){
 const app=new URL(env.APP_ORIGIN||'');
 const origin=env.BROWSER_ORIGIN|| (app.hostname.endsWith('.workers.dev')?app.origin.replace('://musab-x.','://musab-x-browser.'):'');
 const u=new URL(origin);if(u.protocol!=='https:'||u.origin!==origin||u.origin===app.origin)throw new Error('A separate HTTPS browser origin is required.');return origin;
}
export async function issueBrowserTicket(DB:D1Database,accountId:string){
 const token=randomToken(),now=Date.now();
 await DB.prepare('DELETE FROM browser_tickets WHERE expires<=?').bind(now).run();
 await DB.prepare('INSERT INTO browser_tickets (token_hash,account_id,expires) VALUES (?,?,?)').bind(await digest(token),accountId,now+60000).run();
 return token;
}
