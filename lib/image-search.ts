import {cleanLink} from './search';
export function imageResults(payload:any){
 const pages=Array.isArray(payload?.query?.pages)?payload.query.pages:[];
 return pages.sort((a:any,b:any)=>(a.index||0)-(b.index||0)).flatMap((page:any)=>{
  const image=page.imageinfo?.[0],url=cleanLink(image?.url),thumbnail=cleanLink(image?.thumburl||image?.url),source=cleanLink(image?.descriptionurl);
  if(!url||!thumbnail||!String(image?.mime||'').startsWith('image/'))return [];
  return [{title:String(page.title||'Image').replace(/^File:/,'').slice(0,500),url,thumbnail,source,snippet:'Wikimedia Commons · Open source page for attribution and license details.',date:null}];
 }).slice(0,20);
}
export async function searchImages(q:string){
 const url=new URL('https://commons.wikimedia.org/w/api.php');
 url.search=new URLSearchParams({action:'query',generator:'search',gsrsearch:q,gsrnamespace:'6',gsrlimit:'20',prop:'imageinfo',iiprop:'url|mime',iiurlwidth:'600',format:'json',formatversion:'2'}).toString();
 const r=await fetch(url,{headers:{Accept:'application/json','User-Agent':'MusabX/1.0 (personal search workspace)'},signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw new Error('Image search is unavailable');const d:any=await r.json();if(d.error)throw new Error('Image search is unavailable');return imageResults(d);
}
