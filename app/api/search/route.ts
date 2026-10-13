import {env} from 'cloudflare:workers';
import {json} from '../../../lib/core';
import {searchResults,type SearchType} from '../../../lib/search';
import {searchFeed} from '../../../lib/search-feed';
const cache=new Map<string,{expires:number,value:unknown}>();
function remember(key:string,value:unknown){cache.set(key,{expires:Date.now()+300000,value});if(cache.size>60)cache.delete(cache.keys().next().value!);return json(value)}
export async function GET(r:Request){
 const params=new URL(r.url).searchParams,q=(params.get('q')||'').trim().slice(0,250);
 if(!q)return json({error:'Enter a search'},400);
 const requested:SearchType=['images','news','videos'].includes(params.get('type')||'')?params.get('type') as SearchType:'web';
 const safe=params.get('safe')==='moderate'?'moderate':'strict';
 const rawStart=Number(params.get('start')||0),start=Number.isFinite(rawStart)?Math.min(90,Math.max(0,Math.floor(rawStart/10)*10)):0;
 const key=JSON.stringify([q,requested,safe,start]),cached=cache.get(key);if(cached&&cached.expires>Date.now())return json(cached.value);
 if(env.SERPAPI_KEY){
  try{
   const url=new URL('https://serpapi.com/search.json');url.search=new URLSearchParams({engine:'google',api_key:env.SERPAPI_KEY,q,hl:'en',gl:'us',...(safe==='strict'?{safe:'active'}:{}),start:String(start),...(requested==='web'?{}:{tbm:({images:'isch',news:'nws',videos:'vid'} as const)[requested]})}).toString();
   const response=await fetch(url,{signal:AbortSignal.timeout(10000),headers:{Accept:'application/json'}});
   if(response.ok){const data:any=await response.json();if(!data.error)return remember(key,{query:q,provider:'Google',type:requested,start,...searchResults(data,requested),direct:'https://www.google.com/search?q='+encodeURIComponent(q),hasNext:!!data.serpapi_pagination?.next&&start<90,availableTypes:['web','images','news','videos'],notice:null})}
  }catch{ /* Continue with the public feed when Google is unavailable. */ }
 }
 const type=requested==='images'?'web':requested;
 const direct='https://www.bing.com/'+(type==='news'?'news/':'')+'search?'+new URLSearchParams({q,adlt:safe}).toString();
 try{
  const results=await searchFeed(q,type,safe);
  return remember(key,{query:q,provider:'Bing',type,start:0,results,related:[],answer:null,direct,hasNext:false,availableTypes:['web','news','videos'],notice:requested==='images'?'Image search needs the Google connection. Showing web results.':type==='videos'?'Video links from Bing. Select a video to play it here when embedding is allowed.':null});
 }catch{return json({error:'Search is temporarily unavailable. Try again in a moment.',direct},503)}
}
