'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,RefreshCw,WifiOff} from 'lucide-react';
import {alternateSearchUrl} from '../lib/live-search';
export function BrowserView({url,reloadKey,command,onNavigate}:{url:string,reloadKey:number,command?:{type:'back'|'forward',key:number},onNavigate:(url:string,title?:string)=>void}){
 const iframe=useRef<HTMLIFrameElement>(null),target=useRef(url),lastUrl=useRef(''),originRef=useRef(''),ticketRef=useRef(''),connected=useRef(false),onNavigateRef=useRef(onNavigate);
 const [session,setSession]=useState<{origin:string;attempt:number}>(),[error,setError]=useState(''),[details,setDetails]=useState(''),[attempt,setAttempt]=useState(0),[loading,setLoading]=useState(true);
 target.current=url;onNavigateRef.current=onNavigate;
 useEffect(()=>{
  let cancelled=false;connected.current=false;setError('');setDetails('');setLoading(true);
  async function ticket(){const r=await fetch('/api/browser-ticket',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(15000)});const d=await r.json() as {origin:string,ticket:string,error?:string};if(!r.ok)throw new Error(d.error||'Browser connection unavailable');if(cancelled)return;originRef.current=d.origin;ticketRef.current=d.ticket;setSession({origin:d.origin,attempt});return d}
  function post(type:string,extra:Record<string,unknown>={}){iframe.current?.contentWindow?.postMessage({type,...extra},originRef.current)}
  const message=async(e:MessageEvent)=>{
   if(e.origin!==originRef.current||e.source!==iframe.current?.contentWindow)return;
   const d=e.data;if(!d||typeof d!=='object')return;
   if(d.type==='musab:ready'){post('musab:connect',{ticket:ticketRef.current,url:target.current});lastUrl.current=target.current}
   if(d.type==='musab:connected'){connected.current=true;if(lastUrl.current!==target.current){lastUrl.current=target.current;post('musab:navigate',{url:target.current})}}
   if(d.type==='musab:loading')setLoading(true);
   if(d.type==='musab:loaded'){setLoading(false);setError('')}
   if(d.type==='musab:error'){setDetails(typeof d.details==='string'?d.details.slice(0,8000):'');setError(typeof d.error==='string'?d.error.slice(0,400):'Browser connection failed');setLoading(false)}
   if(d.type==='musab:searchfallback'&&typeof d.url==='string'){try{const next=new URL(d.url);if(next.protocol==='https:'&&next.hostname==='duckduckgo.com'){lastUrl.current=next.href;setError('');setLoading(true);onNavigateRef.current(next.href,'DuckDuckGo')}}catch{}}
   if(d.type==='musab:url'&&typeof d.url==='string'&&d.url.length<=4000){try{const u=new URL(d.url);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)return;lastUrl.current=u.href;onNavigateRef.current(u.href,typeof d.title==='string'?d.title.slice(0,120):undefined)}catch{}}
   if(d.type==='musab:renew'){try{const t=await ticket();if(t)post('musab:refresh',{ticket:t.ticket})}catch{setError('Sign in again to reconnect the browser.')}}
  };
  window.addEventListener('message',message);void ticket().catch(e=>{if(!cancelled){setError(e.message);setLoading(false)}});
  return()=>{cancelled=true;window.removeEventListener('message',message)};
 },[attempt]);
 useEffect(()=>{if(!loading)return;const timer=setTimeout(()=>{setLoading(false);setError('This page is taking longer than expected. Reconnect to try again, or open the original website.')},35000);return()=>clearTimeout(timer)},[loading,attempt,url]);
 useEffect(()=>{if(!connected.current||url===lastUrl.current)return;lastUrl.current=url;setLoading(true);iframe.current?.contentWindow?.postMessage({type:'musab:navigate',url},originRef.current)},[url]);
 const previousReload=useRef(reloadKey);
 useEffect(()=>{if(previousReload.current===reloadKey)return;previousReload.current=reloadKey;if(!connected.current){setAttempt(x=>x+1);return}setLoading(true);iframe.current?.contentWindow?.postMessage({type:'musab:reload'},originRef.current)},[reloadKey]);
 useEffect(()=>{if(!command||!connected.current)return;iframe.current?.contentWindow?.postMessage({type:'musab:'+command.type},originRef.current)},[command]);
 const origin=session?.attempt===attempt?session.origin:'';
 const alternate=alternateSearchUrl(url);
 return <>{origin&&<iframe key={attempt} ref={iframe} title="Interactive website" src={origin+'/'} sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-modals allow-pointer-lock" allow="geolocation; camera; microphone; fullscreen; clipboard-read; clipboard-write; picture-in-picture" allowFullScreen referrerPolicy="no-referrer" className="originalWebsite"/>}{loading&&<div className="nativeLoading" role="status"><span className="loadingDot"/>Connecting to the web…</div>}{error&&<div className="liveStatus" role="alert"><span className="connectionIcon"><WifiOff size={26}/></span><span className="pill">LET’S TRY THAT AGAIN</span><h3>Connection interrupted</h3><p>{error}</p><div className="buttonRow"><button className="primaryButton" onClick={()=>setAttempt(x=>x+1)}><RefreshCw size={16}/>Reconnect</button>{alternate&&<button className="chip" onClick={()=>{setError('');onNavigate(alternate)}}>Try DuckDuckGo</button>}<a className="chip" href={url} target="_blank" rel="noopener noreferrer">Open original<ArrowUpRight size={15}/></a></div>{details&&<details style={{maxWidth:720,width:'100%',textAlign:'left',margin:'20px auto'}}><summary style={{cursor:'pointer'}}>Technical details</summary><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxHeight:220,overflow:'auto',fontSize:12,padding:12}}>{details}</pre><button className="chip" onClick={()=>void navigator.clipboard.writeText(details)}>Copy error</button></details>}<small>Your bookmarks and notes are saved separately from this connection.</small></div>}</>;
}

