import {env} from 'cloudflare:workers';
import {json} from '../../../lib/core';
import {searchResults,type SearchType} from '../../../lib/search';
const cache=new Map<string,{expires:number,value:unknown}>();
export async function GET(r:Request){
 const params=new URL(r.url).searchParams,q=(params.get('q')||'').trim().slice(0,250);
 if(!q)return json({error:'Enter a search'},400);
 const type:SearchType=['images','news','videos'].includes(params.get('type')||'')?params.get('type') as SearchType:'web';
 const safe=params.get('safe')==='moderate'?'moderate':'strict';
 const rawStart=Number(params.get('start')||0),start=Number.isFinite(rawStart)?Math.min(90,Math.max(0,Math.floor(rawStart/10)*10)):0;
 const direct='https://www.google.com/search?'+new URLSearchParams({q,safe:safe==='strict'?'active':'moderate',...(type==='web'?{}:{tbm:({images:'isch',news:'nws',videos:'vid'} as const)[type]}),...(start?{start:String(start)}:{})}).toString();
 if(!env.SERPAPI_KEY)return json({error:'Google results are not connected yet. The site owner needs to connect a search service before results can appear here.',code:'SEARCH_NOT_CONFIGURED',provider:'Google',direct},503);
 const key=JSON.stringify([q,type,safe,start]),cached=cache.get(key);if(cached&&cached.expires>Date.now())return json(cached.value);
 try{
  const url=new URL('https://serpapi.com/search.json');url.search=new URLSearchParams({engine:'google',api_key:env.SERPAPI_KEY,q,hl:'en',gl:'us',...(safe==='strict'?{safe:'active'}:{}),start:String(start),...(type==='web'?{}:{tbm:({images:'isch',news:'nws',videos:'vid'} as const)[type]})}).toString();
  const response=await fetch(url,{signal:AbortSignal.timeout(25000),headers:{Accept:'application/json'}});
  if(!response.ok){console.error('Search provider response',response.status);return json({error:response.status===401?'The search service credential needs attention.':response.status===429?'The search service limit was reached. Please try again later.':'Google results are temporarily unavailable.',direct},503)}
  const data:any=await response.json();if(data.error)return json({error:'The search service could not return results. The owner can check its account status.',direct},503);
  const value={query:q,provider:'Google',type,start,...searchResults(data,type),direct,hasNext:!!data.serpapi_pagination?.next&&start<90,notice:null};
  cache.set(key,{expires:Date.now()+300000,value});if(cache.size>60)cache.delete(cache.keys().next().value!);return json(value);
 }catch{return json({error:'The search service timed out or could not be reached. Please try again.',direct},503)}
}
