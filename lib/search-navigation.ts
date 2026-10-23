import {liveSearchUrl} from './live-search';
export type SearchEntry={id:string;title:string;url:string;date?:string};
export type SearchSuggestion={id:string;title:string;value:string;kind:'tab'|'bookmark'|'history';tabId?:string};
export function normalizeNavigation(raw:string,safe='strict',engine='google'){
 const value=raw.trim();if(!value)return '';
 if(value.length>4000)throw new Error('Keep searches and website addresses under 4,000 characters.');
 function bounded(destination:string){if(destination.length>4000)throw new Error('This address or search is too long. Try a shorter phrase.');return destination}
 const shortcut=value.match(/^!(g|d|ddg)\s+([\s\S]+)$/i);
 if(shortcut)return bounded(liveSearchUrl(shortcut[2].trim(),safe,shortcut[1].toLowerCase()==='g'?'google':'duckduckgo'));
 if(/^(?:javascript|data|file|ftp|mailto|vbscript):/i.test(value))throw new Error('Use a public HTTPS website address or enter a search.');
 if(/^https?:\/\//i.test(value)){const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password)throw new Error('Use a public HTTPS address without a username or password.');return bounded(url.href)}
 if(/^(?:[\p{L}\p{N}_-]+\.)+[\p{L}\p{N}_-]+(?::\d{1,5})?(?:[/?#]\S*)?$/u.test(value))return bounded(new URL('https://'+value).href);
 bounded(liveSearchUrl(value,safe,engine));
 return value;
}
export function searchSuggestions(query:string,tabs:{id:string;title:string;input:string;kind:string}[],bookmarks:SearchEntry[],history:SearchEntry[]):SearchSuggestion[]{
 const words=query.trim().toLowerCase().split(/\s+/).filter(Boolean),seen=new Set<string>();
 const sources:SearchSuggestion[]=[
  ...tabs.filter(t=>t.kind!=='home'&&t.input).map(t=>({id:'tab:'+t.id,title:t.title,value:t.input,kind:'tab' as const,tabId:t.id})),
  ...bookmarks.map(t=>({id:'bookmark:'+t.id,title:t.title,value:t.url,kind:'bookmark' as const})),
  ...history.map(t=>({id:'history:'+t.id,title:t.title,value:t.url,kind:'history' as const}))
 ];
 return sources.filter(item=>{
  const text=(item.title+' '+item.value).toLowerCase();let key=item.value.trim();
  try{key=new URL(key).href}catch{key=key.toLowerCase()}
  if(!words.every(word=>text.includes(word))||seen.has(key))return false;
  seen.add(key);return true;
 }).sort((a,b)=>{
  const rank=(item:SearchSuggestion)=>{const title=item.title.toLowerCase(),q=query.trim().toLowerCase();return q&&title===q?0:q&&title.startsWith(q)?1:2};
  return rank(a)-rank(b);
 }).slice(0,6);
}
export function rememberVisit(history:SearchEntry[],visit:SearchEntry):SearchEntry[]{
 if(history[0]?.url===visit.url&&history[0].title===visit.title)return history;
 const existing=history.find(entry=>entry.url===visit.url);
 return [{...visit,id:existing?.id||visit.id},...history.filter(entry=>entry.url!==visit.url)].slice(0,200);
}
