import {feedText} from './search-feed';
export function archiveVideos(payload:any){
 const docs=Array.isArray(payload?.response?.docs)?payload.response.docs:[];
 return docs.flatMap((row:any)=>{
  if(typeof row.identifier!=='string'||!/^[-a-zA-Z0-9_.]{1,200}$/.test(row.identifier))return [];
  const id=encodeURIComponent(row.identifier);
  return [{title:String(row.title||row.identifier).slice(0,500),url:'https://archive.org/details/'+id,thumbnail:'https://archive.org/services/img/'+id,snippet:feedText(String(Array.isArray(row.description)?row.description[0]:row.description||'')).slice(0,1200),date:null}];
 }).slice(0,12);
}
export async function searchArchiveVideos(q:string){
 const url=new URL('https://archive.org/advancedsearch.php');
 url.search=new URLSearchParams({q:JSON.stringify(q)+' AND mediatype:movies AND NOT access-restricted-item:true','fl[]':'identifier,title,description',rows:'12',page:'1',output:'json'}).toString();
 const r=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error('Video search unavailable');
 const data:any=await r.json();if(data.error)throw new Error('Video search unavailable');return archiveVideos(data);
}
