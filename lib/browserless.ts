import {validUrl} from './web';
const HOST='https://production-sfo.browserless.io';
export class LiveError extends Error {constructor(message:string,public status=502){super(message)}}
export type BrowserOptions={quality?:'fast'|'balanced'|'sharp';sessionMinutes?:number};
export async function createLiveBrowser(raw:string,token:string,options:BrowserOptions={}){
 const target=validUrl(raw).href;
 if(!token)throw new LiveError('Add BROWSERLESS_TOKEN as a Cloudflare Worker secret, then deploy.',503);
 const minutes=[2,15,30,60,120].includes(options.sessionMinutes||0)?options.sessionMinutes!:60,timeout=minutes*60000;
 const tuning=options.quality==='fast'?{quality:60,scale:1,compressed:false}:options.quality==='sharp'?{quality:92,scale:2,compressed:true}:{quality:85,scale:1,compressed:false};
 const endpoint=new URL('/chrome/bql',HOST);endpoint.searchParams.set('token',token);endpoint.searchParams.set('timeout',String(timeout));
 // JSON string quoting prevents the address from becoming executable GraphQL.
 const query=`mutation MusabLive { goto(url: ${JSON.stringify(target)}, waitUntil: commit) { status } liveURL(detached: true, interactable: true, resizable: true, showBrowserInterface: false, quality: ${tuning.quality}, type: jpeg, captureScale: ${tuning.scale}, compressed: ${tuning.compressed}, timeout: ${timeout}) { liveURL timeout } }`;
 let response:Response;
 try{response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query}),signal:AbortSignal.timeout(40000)})}catch{throw new LiveError('The browser service could not be reached. Try again.')}
 if(response.status===400){await response.body?.cancel();throw new LiveError('Browserless rejected the session settings. Your plan may not support this duration. Choose a shorter session in Settings, or check your Browserless plan.',400)}
 if(!response.ok){await response.body?.cancel();throw new LiveError(response.status===401||response.status===403?'Browserless rejected the token or this feature is unavailable on your plan. Check your Browserless dashboard.':response.status===429?'Browserless has reached its usage or concurrent-session limit. Wait for the current session to end.':'Browserless could not start a live browser. Check your plan and usage.',response.status===429?429:502)}
 let payload:any;try{payload=await response.json()}catch{throw new LiveError('Browserless returned an invalid response.')}
 if(payload.errors?.length)throw new LiveError('Browserless could not create an interactive LiveURL. Check that your plan supports LiveURL and BrowserQL.');
 const live=payload.data?.liveURL;let url:URL;
 try{url=new URL(live?.liveURL)}catch{throw new LiveError('Browserless did not return a live viewer.')}
 if(url.origin!==HOST||!/^\/(?:e\/[^/]+\/)?live\//.test(url.pathname)||url.searchParams.has('token')||url.href.includes(token))throw new LiveError('Browserless returned an unexpected viewer address.');
 return {liveURL:url.href,expiresAt:Date.now()+Math.min(timeout,Math.max(1000,Number(live.timeout)||timeout))};
}
