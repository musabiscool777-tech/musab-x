import {connect} from 'cloudflare:sockets';
import {exchangeTicket,relayAccount} from './auth';
import {serveWisp} from './wisp';
type Env={DB:D1Database,APP_ORIGIN:string,ASSETS:Fetcher};
export default {async fetch(r:Request,env:Env){
 const u=new URL(r.url);
 if(u.pathname==='/session')return exchangeTicket(r,env);
 if(u.pathname==='/wisp/'){
  if(r.headers.get('Upgrade')?.toLowerCase()!=='websocket')return new Response('WebSocket required',{status:426});
  if(r.headers.get('origin')!==u.origin||!await relayAccount(r,env))return new Response('Sign in to Musab X to connect',{status:401});
  const pair=new WebSocketPair();pair[1].accept();serveWisp(pair[1],address=>connect(address,{secureTransport:'off',allowHalfOpen:false}));
  return new Response(null,{status:101,webSocket:pair[0]});
 }
 if(u.pathname==='/config.js')return new Response('window.MUSAB_APP_ORIGIN='+JSON.stringify(env.APP_ORIGIN)+';',{headers:{'Content-Type':'application/javascript','Cache-Control':'no-store'}});
 const response=await env.ASSETS.fetch(r),headers=new Headers(response.headers);
 headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','no-referrer');
 headers.set('Content-Security-Policy',`frame-ancestors ${env.APP_ORIGIN} ${u.origin}`);
 if(u.pathname==='/sw.js'){headers.set('Service-Worker-Allowed','/');headers.set('Cache-Control','no-cache')}
 return new Response(response.body,{status:response.status,headers});
}};
