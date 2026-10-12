import { validUrl } from './web';
export type SearchType='web'|'images'|'news'|'videos';
export function cleanLink(value:unknown){try{return typeof value==='string'?validUrl(value).href:null}catch{return null}}
export function searchResults(payload:any,type:SearchType){
 const rows=type==='images'?payload.images_results:type==='news'?payload.news_results:type==='videos'?payload.video_results:payload.organic_results;
 const results=(Array.isArray(rows)?rows:[]).flatMap((row:any)=>{const url=cleanLink(row.link||row.original||row.source);if(!url)return [];return [{title:String(row.title||row.source||new URL(url).hostname).slice(0,500),url,snippet:String(row.snippet||row.description||'').slice(0,2000),thumbnail:cleanLink(row.thumbnail),date:typeof row.date==='string'?row.date.slice(0,100):null}]}).slice(0,30);
 const related=(Array.isArray(payload.related_searches)?payload.related_searches:[]).filter((r:any)=>typeof r.query==='string').map((r:any)=>r.query.slice(0,250)).slice(0,10);
 const box=payload.answer_box||payload.knowledge_graph;const answer=box?{title:String(box.title||'Quick answer').slice(0,500),text:String(box.answer||box.snippet||box.description||'').slice(0,3000),url:cleanLink(box.link||box.website)}:null;
 return {results,related,answer:answer?.text?answer:null};
}
