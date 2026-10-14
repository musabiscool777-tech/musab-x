import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const compile=source=>ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const dir=mkdtempSync(join(tmpdir(),'musab-pages-'));
try{
 writeFileSync(join(dir,'web.mjs'),compile(readFileSync('lib/web.ts','utf8')));
 const {publicAddress}=await import(pathToFileURL(join(dir,'web.mjs')));
 for(const ip of ['192.0.66.108','198.51.42.1','8.8.8.8','2a04:fa87:fffd::c000:426c'])assert.equal(publicAddress(ip),true,ip);
 for(const ip of ['192.0.0.1','192.0.2.1','198.51.100.8','10.0.0.1','127.0.0.1','169.254.169.254','2001:db8::1','::1'])assert.equal(publicAddress(ip),false,ip);
 const media=compile(readFileSync('lib/media.ts','utf8'));
 writeFileSync(join(dir,'media.mjs'),media);
 const {mediaUrl,videoEmbed}=await import(pathToFileURL(join(dir,'media.mjs')));
 assert.equal(mediaUrl('/img.jpg','https://example.com/page'),'https://example.com/img.jpg');
 for(const url of ['javascript:alert(1)','data:image/svg+xml,test','https://127.0.0.1/x','https://localhost.test/x','https://u:p@example.com/x'])assert.equal(mediaUrl(url,'https://example.com'),null);
 assert.equal(videoEmbed('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'),'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');assert.equal(videoEmbed('https://evil.example/embed/test'),null);
 const fixture='<html><title>Media sample</title><body><h1>Example</h1><p>Text</p><img src="/one.jpg" alt="First"><img data-src="/lazy.jpg" alt="Lazy"><img src="javascript:bad"><video poster="/poster.jpg"><source src="/clip.mp4"></video><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe><iframe src="https://evil.example/track"></iframe><script>alert(1)</script></body></html>';
 let route=readFileSync('app/api/read/route.ts','utf8').replace(/^import .*;$/gm,'');
 const stub=`const json=(v,s=200)=>Response.json(v,{status:s});const fetchPage=async(raw)=>raw.includes('direct.jpg')?({url:raw,response:new Response(),mediaType:'image'}):({url:raw,response:new Response(${JSON.stringify(fixture)})});`;
 const require=createRequire(import.meta.resolve('wrangler/package.json'));
 const {Miniflare}=await import(pathToFileURL(require.resolve('miniflare')));
 const mf=new Miniflare({modules:true,script:media+'\n'+compile(stub+route)+'\nexport default {fetch:GET};',compatibilityDate:'2026-05-15'});
 try{
  const response=await mf.dispatchFetch('https://musab.test/api/read?url=https%3A%2F%2Fexample.com%2Fpage');assert.equal(response.status,200);
  const page=await response.json();assert.equal(page.title,'Media sample');
  assert.equal(page.blocks.filter(b=>b.type==='img').length,2);
  assert.equal(page.blocks.find(b=>b.type==='video').url,'https://example.com/clip.mp4');
  assert.equal(page.blocks.filter(b=>b.type==='embed').length,1);
  assert.ok(!JSON.stringify(page).includes('javascript:'));assert.ok(!JSON.stringify(page).includes('evil.example'));assert.ok(!JSON.stringify(page).includes('alert(1)'));
  const direct=await (await mf.dispatchFetch('https://musab.test/api/read?url=https%3A%2F%2Fexample.com%2Fdirect.jpg')).json();assert.equal(direct.blocks[0].type,'img');
 }finally{await mf.dispose()}
 console.log('Public DNS ranges, media URL filtering, native HTMLRewriter image/video extraction, embed allowlist, and direct image opening passed.');
}finally{rmSync(dir,{recursive:true,force:true})}
