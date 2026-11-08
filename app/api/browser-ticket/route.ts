import {env} from 'cloudflare:workers';
import {account,checkWrite,db,json} from '../../../lib/core';
import {browserOrigin,issueBrowserTicket} from '../../../lib/browser-ticket';
export async function POST(r:Request){
 try{checkWrite(r)}catch{return json({error:'Invalid request origin or content type.'},403)}
 try{
  let accountId:string|null=null;
  try{accountId=(await account(r)).id}catch(error){
   if(!(error instanceof Error)||error.message!=='Sign in to continue'){
    if(error instanceof Error&&error.message==='This account is disabled')return json({error:error.message},403);
    throw error;
   }
  }
  if(accountId===null){
   const ip=r.headers.get('CF-Connecting-IP');
   if(!ip||!env.GUEST_TICKETS)throw new Error('Guest browsing requires a rate limiter.');
   if(!(await env.GUEST_TICKETS.limit({key:ip})).success)return json({error:'Too many guest browser connections. Wait a minute and reconnect.'},429);
  }
  return json({origin:browserOrigin(env),ticket:await issueBrowserTicket(db(),accountId)});
 }catch{return json({error:'The browser service is temporarily unavailable.'},503)}
}
