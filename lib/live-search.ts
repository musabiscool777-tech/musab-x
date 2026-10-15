// Load the original search page rather than a results API or reader.
export function liveSearchUrl(query:string,safe:string='strict'){
 const url=new URL('https://www.google.com/search');
 url.search=new URLSearchParams({q:query,safe:safe==='strict'?'active':'off'}).toString();
 return url.href;
}
