import {json} from '../../../lib/core';
import {fetchPage} from '../../../lib/web';
import {mediaUrl,videoEmbed} from '../../../lib/media';
export async function GET(r:Request){
 try{
  const raw=new URL(r.url).searchParams.get('url');if(!raw)return json({error:'A URL is required'},400);
  const page=await fetchPage(raw);
  if(page.mediaType)return json({title:decodeURIComponent(new URL(page.url).pathname.split('/').pop()||'Media'),url:page.url,blocks:[{type:page.mediaType==='image'?'img':'video',url:page.url,text:''}]});
  let title='',current:any=null,video:any=null;const blocks:any[]=[],seen=new Set<string>();
  const add=(type:string,url:string|null,text='')=>{if(!url||blocks.length>=500||seen.has(type+url))return;seen.add(type+url);blocks.push({type,url,text})};
  const H=(globalThis as any).HTMLRewriter;
  const stream=new H()
   .on('script,style,noscript,svg,nav,footer,form',{element(e:any){e.remove()}})
   .on('title',{text(t:any){title+=t.text}})
   .on('img',{element(e:any){if(Number(e.getAttribute('width')||100)>2&&Number(e.getAttribute('height')||100)>2){const src=e.getAttribute('data-src')||e.getAttribute('data-lazy-src')||e.getAttribute('src')||e.getAttribute('srcset')?.split(',')[0]?.trim().split(/\s+/)[0];add('img',mediaUrl(src,page.url),String(e.getAttribute('alt')||'').slice(0,500))}}})
   .on('video',{element(e:any){video={type:'video',url:mediaUrl(e.getAttribute('src'),page.url),poster:mediaUrl(e.getAttribute('poster'),page.url),text:''};if(blocks.length<500)blocks.push(video);e.onEndTag(()=>{video=null})}})
   .on('video source',{element(e:any){if(video&&!video.url)video.url=mediaUrl(e.getAttribute('src'),page.url)}})
   .on('iframe',{element(e:any){const src=mediaUrl(e.getAttribute('src')||e.getAttribute('data-src'),page.url);if(src)add('embed',videoEmbed(src));e.remove()}})
   .on('h1,h2,h3,p,li,pre,blockquote,a',{element(e:any){if(blocks.length>=500)return;const b={type:e.tagName,text:'',url:e.tagName==='a'?mediaUrl(e.getAttribute('href'),page.url):null};blocks.push(b);const previous=current;current=b;e.onEndTag(()=>{current=previous})},text(t:any){if(current)current.text+=t.text}});
  await stream.transform(page.response).text();
  return json({title:title.trim()||new URL(page.url).hostname,url:page.url,blocks:blocks.filter(b=>['img','embed','video'].includes(b.type)?!!b.url:!!b.text.trim()).map(b=>({...b,text:b.text.trim().slice(0,6000)}))});
 }catch(e){return json({error:(e as Error).message},400)}
}
