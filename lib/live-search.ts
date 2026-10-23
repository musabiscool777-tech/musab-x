// Load the original search page rather than a results API or reader.
export function liveSearchUrl(query:string,safe:string='strict',engine:string='google'){
 if(engine==='duckduckgo'){
  const url=new URL('https://duckduckgo.com/');
  url.search=new URLSearchParams({q:query,kp:safe==='strict'?'1':'-1'}).toString();
  return url.href;
 }
 const url=new URL('https://www.google.com/search');
 url.search=new URLSearchParams({q:query,safe:safe==='strict'?'active':'off'}).toString();
 return url.href;
}
export function alternateSearchUrl(raw:string){
 try{const url=new URL(raw);if(url.protocol==='https:'&&/(^|\.)google\.com$/.test(url.hostname)&&url.searchParams.has('q'))return liveSearchUrl(url.searchParams.get('q')||'',url.searchParams.get('safe')==='off'?'moderate':'strict','duckduckgo')}catch{}
 return '';
}
