'use client';
import {useEffect,useRef,useState} from 'react';
export function BrowserView({url,reloadKey,command,onNavigate}:{url:string,reloadKey:number,command?:{type:'back'|'forward',key:number},onNavigate:(url:string,title?:string)=>void}){
 const iframe=useRef<HTMLIFrameElement>(null),target=useRef(url),lastUrl=useRef(''),originRef=useRef(''),ticketRef=useRef(''),connected=useRef(false),onNavigateRef=useRef(onNavigate);
 const [origin,setOrigin]=useState(''),[error,setError]=useState(''),[attempt,setAttempt]=useState(0),[loading,setLoading]=useState(true);
 target.current=url;onNavigateRef.current=onNavigate;
 useEffect(()=>{
  let cancelled=false;connected.current=false;setError('');setLoading(true);
  async function ticket(){const r=await fetch('/api/browser-ticket',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});const d=await r.json() as {origin:string,ticket:string,error?:string};if(!r.ok)throw new Error(d.error||'Browser connection unavailable');if(cancelled)return;originRef.current=d.origin;ticketRef.current=d.ticket;setOrigin(d.origin);return d}
  function post(type:string,extra:Record<string,unknown>={}){iframe.current?.contentWindow?.postMessage({type,...extra},originRef.current)}
  const message=async(e:MessageEvent)=>{
   if(e.origin!==originRef.current||e.source!==iframe.current?.contentWindow)return;
   const d=e.data;if(!d||typeof d!=='object')return;
   if(d.type==='musab:ready'){post('musab:connect',{ticket:ticketRef.current,url:target.current});lastUrl.current=target.current}
   if(d.type==='musab:connected')connected.current=true;
   if(d.type==='musab:loading')setLoading(true);
   if(d.type==='musab:loaded'){setLoading(false);setError('')}
   if(d.type==='musab:error'){setError(typeof d.error==='string'?d.error.slice(0,400):'Browser connection failed');setLoading(false)}
   if(d.type==='musab:url'&&typeof d.url==='string'&&d.url.length<=4000){try{const u=new URL(d.url);if(!['https:','http:'].includes(u.protocol))return;lastUrl.current=u.href;onNavigateRef.current(u.href,typeof d.title==='string'?d.title.slice(0,120):undefined)}catch{}}
   if(d.type==='musab:renew'){try{const t=await ticket();if(t)post('musab:refresh',{ticket:t.ticket})}catch{setError('Sign in again to reconnect the browser.')}}
  };
  window.addEventListener('message',message);void ticket().catch(e=>{if(!cancelled){setError(e.message);setLoading(false)}});
  return()=>{cancelled=true;window.removeEventListener('message',message)};
 },[attempt]);
 useEffect(()=>{if(!connected.current||url===lastUrl.current)return;lastUrl.current=url;setLoading(true);iframe.current?.contentWindow?.postMessage({type:'musab:navigate',url},originRef.current)},[url]);
 const previousReload=useRef(reloadKey);
 useEffect(()=>{if(previousReload.current===reloadKey)return;previousReload.current=reloadKey;if(!connected.current){setAttempt(x=>x+1);return}setLoading(true);iframe.current?.contentWindow?.postMessage({type:'musab:reload'},originRef.current)},[reloadKey]);
 useEffect(()=>{if(!command||!connected.current)return;iframe.current?.contentWindow?.postMessage({type:'musab:'+command.type},originRef.current)},[command]);
 return <>{origin&&<iframe key={attempt} ref={iframe} title="Interactive website" src={origin+'/'} sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-modals allow-pointer-lock" allow="fullscreen; clipboard-write; picture-in-picture" allowFullScreen referrerPolicy="no-referrer" className="originalWebsite"/>}{loading&&<div className="nativeLoading" role="status">Loading website…</div>}{error&&<div className="liveStatus" role="alert"><h3>Browser connection unavailable</h3><p>{error}</p><button className="primaryButton" onClick={()=>setAttempt(x=>x+1)}>Reconnect</button></div>}</>;
}
