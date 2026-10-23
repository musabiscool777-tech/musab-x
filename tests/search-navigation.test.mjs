import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const dir=mkdtempSync(join(tmpdir(),'musab-search-navigation-'));
const compile=source=>ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
try{
 writeFileSync(join(dir,'live-search.mjs'),compile(readFileSync('lib/live-search.ts','utf8')));
 writeFileSync(join(dir,'navigation.mjs'),compile(readFileSync('lib/search-navigation.ts','utf8').replace("'./live-search'","'./live-search.mjs'")));
 const {normalizeNavigation,searchSuggestions,rememberVisit}=await import(pathToFileURL(join(dir,'navigation.mjs')));
 const {alternateSearchUrl}=await import(pathToFileURL(join(dir,'live-search.mjs')));
 for(const [raw,expected] of [[' example.com#section ','https://example.com/#section'],['example.com/path?q=one#two','https://example.com/path?q=one#two'],['HTTPS://EXAMPLE.COM/a','https://example.com/a'],['site:nasa.gov space','site:nasa.gov space'],['weather tomorrow','weather tomorrow'],['مثال.إختبار','https://xn--mgbh0fb.xn--kgbechtv/']])assert.equal(normalizeNavigation(raw),expected);
 for(const raw of ['javascript:alert(1)','data:text/html,hello','file:///etc/passwd','ftp://example.com','https://user:pass@example.com','http://example.com','a'.repeat(4001)])assert.throws(()=>normalizeNavigation(raw));
 for(const raw of ['ع'.repeat(1000),'!d '+'ع'.repeat(1000),'a'.repeat(3990)])assert.throws(()=>normalizeNavigation(raw),'Encoded destinations fit workspace storage limits');
 for(const prefix of ['!d','!ddg','!g','!G']){const url=new URL(normalizeNavigation(prefix+' space & stars','strict'));assert.equal(url.searchParams.get('q'),'space & stars');assert.equal(url.hostname,prefix.toLowerCase()==='!g'?'www.google.com':'duckduckgo.com');assert.equal(url.searchParams.get(prefix.toLowerCase()==='!g'?'safe':'kp'),prefix.toLowerCase()==='!g'?'active':'1')}
 const tabs=[{id:'a',title:'NASA stars',input:'https://nasa.gov/A',kind:'page'},{id:'b',title:'New tab',input:'',kind:'home'}];
 const bookmarks=[{id:'c',title:'NASA stars',url:'https://nasa.gov/A'},{id:'d',title:'Star atlas',url:'https://nasa.gov/a'},{id:'e',title:'Stars',url:'https://example.com/stars'}];
 const history=[{id:'f',title:'NASA science',url:'https://nasa.gov/science'},{id:'g',title:'NASA stars',url:'https://nasa.gov/A'}];
 const matches=searchSuggestions('nasa stars',tabs,bookmarks,history);assert.equal(matches.length,1);assert.equal(matches[0].tabId,'a');assert.equal(searchSuggestions('missing',tabs,bookmarks,history).length,0);
 assert.equal(searchSuggestions('stars',tabs,bookmarks,history)[0].title,'Stars','Exact title ranks first');
 assert.equal(searchSuggestions('',tabs,bookmarks,history).length,4,'Duplicate URLs removed; case-sensitive paths retained');
 assert.equal(searchSuggestions('',[],Array.from({length:20},(_,i)=>({id:String(i),title:'Result '+i,url:'https://example.com/'+i})),[]).length,6);
 const visit={id:'new',title:'NASA',url:'https://nasa.gov/',date:'2026-10-22'};
 assert.deepEqual(rememberVisit([],visit),[visit]);const existing=[{...visit,id:'old'}];assert.equal(rememberVisit(existing,visit),existing,'Unchanged visit avoids another save');
 const result=rememberVisit([{id:'first',title:'Other',url:'https://example.com/'},{...visit,id:'old',title:'Old title'}],visit);assert.equal(result[0].id,'old');assert.equal(result[0].title,'NASA');assert.equal(result.length,2);
 assert.equal(rememberVisit(Array.from({length:200},(_,i)=>({id:String(i),title:'Page',url:'https://example.com/'+i})),visit).length,200);
 for(const safe of ['active','off']){const url=new URL(alternateSearchUrl('https://www.google.com/search?q=space%26stars&safe='+safe));assert.equal(url.hostname,'duckduckgo.com');assert.equal(url.searchParams.get('q'),'space&stars');assert.equal(url.searchParams.get('kp'),safe==='off'?'-1':'1')}
 for(const url of ['https://google.com.evil.example/search?q=x','https://example.com/?q=x','https://www.google.com/','bad'])assert.equal(alternateSearchUrl(url),'');
 console.log('Search navigation passed: URL fragments, Unicode hosts, search operators, bounded input, unsafe schemes, engine shortcuts, ranked/deduplicated suggestions, visit history and Safe Search recovery.');
}finally{rmSync(dir,{recursive:true,force:true})}
