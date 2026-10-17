import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const dir=mkdtempSync(join(tmpdir(),'musab-features-'));
const compile=s=>ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
try{
 writeFileSync(join(dir,'appearance.mjs'),compile(readFileSync('lib/appearance.ts','utf8')));
 writeFileSync(join(dir,'workspace.mjs'),compile(readFileSync('lib/workspace.ts','utf8').replace("'zod'",JSON.stringify(import.meta.resolve('zod'))).replace("'./appearance'","'./appearance.mjs'")));
 writeFileSync(join(dir,'search.mjs'),compile(readFileSync('lib/live-search.ts','utf8')));
 const {workspace}=await import(pathToFileURL(join(dir,'workspace.mjs'))),{liveSearchUrl}=await import(pathToFileURL(join(dir,'search.mjs')));
 const legacy={bookmarks:[{id:'saved',title:'My page',url:'https://example.com/'}],history:[],notes:'Keep this note',settings:{theme:'dark',newTab:true,history:true,safe:'strict',view:'live'}};
 const parsed=workspace.parse(legacy);assert.deepEqual(parsed.shortcuts,[]);assert.equal(parsed.settings.searchEngine,'google');assert.equal(parsed.notes,legacy.notes);assert.deepEqual(parsed.bookmarks,legacy.bookmarks);
 const shortcut={id:'one',title:'Example',url:'https://example.com/path?q=a%26b'};
 const next=workspace.parse({...parsed,shortcuts:[shortcut],settings:{...parsed.settings,searchEngine:'duckduckgo'}});assert.deepEqual(next.shortcuts,[shortcut]);assert.equal(next.settings.searchEngine,'duckduckgo');
 for(const url of ['javascript:alert(1)','data:text/html,test','http://example.com','https://user:password@example.com/'])assert.equal(workspace.safeParse({...parsed,shortcuts:[{...shortcut,url}]}).success,false,url);
 assert.equal(workspace.safeParse({...parsed,shortcuts:Array.from({length:13},(_,i)=>({...shortcut,id:String(i)}))}).success,false);
 for(const engine of ['google','duckduckgo'])for(const safe of ['strict','moderate']){
  const query='space & stars + العربية';const url=new URL(liveSearchUrl(query,safe,engine));assert.equal(url.protocol,'https:');assert.equal(url.searchParams.get('q'),query);
  if(engine==='duckduckgo'){assert.equal(url.hostname,'duckduckgo.com');assert.equal(url.searchParams.get('kp'),safe==='strict'?'1':'-1')}else{assert.equal(url.hostname,'www.google.com');assert.equal(url.searchParams.get('safe'),safe==='strict'?'active':'off')}
 }
 console.log('Feature tests passed: old workspace compatibility, shortcut round-trip and URL validation, limits, search engine encoding and Safe Search.');
}finally{rmSync(dir,{recursive:true,force:true})}
