import { cleanLink } from './search';

// Decode feed text only; rendering stays in React text nodes, never raw HTML.
export function feedText(raw: string) {
  return raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (match, entity: string) => {
    const named: Record<string, string> = {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"};
    if (entity[0] !== '#') return named[entity.toLowerCase()] || match;
    const point = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2),16) : Number(entity.slice(1));
    return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? String.fromCodePoint(point) : '';
  }).trim();
}
export function feedResults(xml: string) {
  if (xml.length > 1000000 || !/<rss\b/i.test(xml) || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('Invalid search feed');
  const seen = new Set<string>();
  const field = (item:string, tag:string) => feedText(item.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))?.[1] || '');
  return [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].flatMap((match) => {
    let link = field(match[1], 'link');
    // Bing News feeds sometimes wrap the destination in a query parameter.
    try { const u = new URL(link); if (/(^|\.)bing\.com$/.test(u.hostname) && u.searchParams.has('url')) link = u.searchParams.get('url')!; } catch { return []; }
    const url = cleanLink(link); if (!url || seen.has(url)) return [];
    seen.add(url);
    return [{title:field(match[1],'title').slice(0,500) || new URL(url).hostname,url,snippet:field(match[1],'description').slice(0,2000),thumbnail:null,date:null}];
  }).slice(0,10);
}
export async function searchFeed(q:string, type:string, safe:string, signal?:AbortSignal) {
  const searchQuery = type === 'videos' ? `${q} site:youtube.com/watch` : q;
  const url = new URL(type === 'news' ? 'https://www.bing.com/news/search' : 'https://www.bing.com/search');
  url.search = new URLSearchParams({q:searchQuery,format:'rss',adlt:safe === 'strict' ? 'strict' : 'moderate',setlang:'en-US',count:'10'}).toString();
  const response = await fetch(url,{headers:{Accept:'application/rss+xml, application/xml, text/xml'},signal:signal || AbortSignal.timeout(15000)});
  if (!response.ok) throw new Error('Search feed unavailable');
  const xml = await response.text();
  return feedResults(xml);
}
