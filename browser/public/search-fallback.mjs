// Recognize Google's network-block page, rather than ordinary search results
// that happen to discuss it. Keep the original query and Safe Search level.
export function blockedGoogleSearch(rawUrl,text){
 try{
  let source=new URL(rawUrl);
  if(!/(^|\.)google\.com$/i.test(source.hostname)||!['http:','https:'].includes(source.protocol))return null;
  const leading=String(text).trim().toLowerCase().slice(0,700),message='our systems have detected unusual traffic';
  if(!leading.startsWith(message)&&!(leading.startsWith('about this page')&&leading.includes(message)))return null;
  if(source.pathname.startsWith('/sorry')){
   const next=source.searchParams.get('continue');if(!next)return null;source=new URL(next);
   if(!/(^|\.)google\.com$/i.test(source.hostname))return null;
  }
  if(source.pathname!=='/search')return null;
  const query=source.searchParams.get('q');if(!query)return null;
  const destination=new URL('https://duckduckgo.com/');destination.search=new URLSearchParams({q:query,kp:source.searchParams.get('safe')==='off'?'-1':'1'}).toString();return destination.href;
 }catch{return null}
}
