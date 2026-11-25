import {networkAccess} from '../lib/network-access';
import {connect} from 'cloudflare:sockets';
import {exchangeTicket,relaySession} from './auth';
import {acceptWisp,resolvePublic} from './wisp';
import {relayHttp} from './http';
type Env={DB:D1Database,APP_ORIGIN:string,ASSETS:Fetcher,GUEST_RELAY:RateLimit};
export default {async fetch(r:Request,env:Env){
 const blocked=await networkAccess(r);if(blocked)return blocked;
 const u=new URL(r.url);
 const relayLimit=async(accountId:string|null)=>{
  const ip=r.headers.get('CF-Connecting-IP');
  const key=accountId?'account:'+accountId:ip;
  return !!key&&!!env.GUEST_RELAY&&(await env.GUEST_RELAY.limit({key})).success;
 };
 const limited=()=>new Response('Browsing limit reached. Wait a minute and try again.',{status:429,headers:{'Cache-Control':'no-store'}});
 if(u.pathname==='/http')return relayHttp(r,async request=>{
  const session=await relaySession(request,env);
  if(!session)return false;
  return await relayLimit(session.account_id)||limited();
 });
 if(u.pathname==='/session')return exchangeTicket(r,env);
 if(u.pathname==='/wisp/'){
  if(r.headers.get('Upgrade')?.toLowerCase()!=='websocket')return new Response('WebSocket required',{status:426});
  if(r.headers.get('origin')!==u.origin)return new Response('Invalid browser request',{status:403});
  const session=await relaySession(r,env);
  if(!session)return new Response('Browser session unavailable. Reconnect to try again.',{status:401});
  if(!await relayLimit(session.account_id))return limited();
  const resolve=async(host:string)=>{
   if(!await relayLimit(session.account_id))throw new Error('Browsing limit reached.');
   return resolvePublic(host);
  };
  const pair=new WebSocketPair();acceptWisp(pair[1],address=>connect(address,{secureTransport:'off',allowHalfOpen:false}),resolve);
  return new Response(null,{status:101,webSocket:pair[0]});
 }
 if(u.pathname==='/config.js')return new Response('window.MUSAB_APP_ORIGIN='+JSON.stringify(env.APP_ORIGIN)+';',{headers:{'Content-Type':'application/javascript','Cache-Control':'no-store'}});
 const response=await env.ASSETS.fetch(r),headers=new Headers(response.headers);
 headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','no-referrer');
 headers.set('Content-Security-Policy',`frame-ancestors ${env.APP_ORIGIN} ${u.origin}`);
 if(u.pathname==='/sw.js'){headers.set('Service-Worker-Allowed','/');headers.set('Cache-Control','no-cache')}
 return new Response(response.body,{status:response.status,headers});
}};
