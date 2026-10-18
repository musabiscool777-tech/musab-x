import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const dir=mkdtempSync(join(tmpdir(),'musab-tabs-'));
try{
 writeFileSync(join(dir,'tabs.mjs'),ts.transpileModule(readFileSync('lib/tab-session.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText);
 const {parseTabSession,saveTabSession,tabSessionKey}=await import(pathToFileURL(join(dir,'tabs.mjs')));
 const values=new Map(),storage={setItem:(key,value)=>values.set(key,value)};
 const youtube={id:'youtube',title:'YouTube',input:'https://www.youtube.com/watch?v=fixture',kind:'page',stack:['','https://www.youtube.com/','https://www.youtube.com/watch?v=fixture'],position:2};
 const search={id:'search',title:'NASA',input:'site:nasa.gov stars',kind:'search',stack:['','site:nasa.gov stars'],position:1};
 assert.equal(saveTabSession(storage,tabSessionKey('a'),[youtube,search],'youtube'),true);
 assert.deepEqual(parseTabSession(values.get(tabSessionKey('a'))),{version:1,tabs:[youtube,search],active:'youtube'});
 assert.notEqual(tabSessionKey('a'),tabSessionKey('b'));assert.notEqual(tabSessionKey('a'),tabSessionKey());assert.notEqual(tabSessionKey('guest'),tabSessionKey());assert.equal(parseTabSession(values.get(tabSessionKey('b'))||null),null);
 assert.equal(saveTabSession(storage,tabSessionKey('a'),[search],'search'),true);assert.deepEqual(parseTabSession(values.get(tabSessionKey('a'))).tabs,[search],'Explicitly closed tabs stay closed');
 assert.equal(parseTabSession(JSON.stringify({version:1,tabs:[youtube],active:'missing'})).active,'youtube');
 const long={...youtube,stack:Array.from({length:200},(_,i)=>'https://example.com/'+i),position:150};assert.equal(saveTabSession(storage,'long',[long],'youtube'),true);const restored=parseTabSession(values.get('long')).tabs[0];assert.equal(restored.stack.length,99);assert.equal(restored.stack[restored.position],'https://example.com/150');
 for(const raw of [null,'{','null',JSON.stringify({version:2,tabs:[youtube]}),JSON.stringify({version:1,tabs:[]}),JSON.stringify({version:1,tabs:[youtube,youtube]}),JSON.stringify({version:1,tabs:[{...youtube,input:'javascript:alert(1)'}]}),JSON.stringify({version:1,tabs:[{...youtube,input:'https://name:password@example.com'}]}),JSON.stringify({version:1,tabs:[{...youtube,position:100}]})])assert.equal(parseTabSession(raw),null);
 assert.equal(saveTabSession({setItem(){throw Error('Quota exceeded')}},'full',[youtube],'youtube'),false);
 console.log('Tab sessions passed: restored URLs/selection, account separation, closed-tab removal, search queries, bounded navigation history, malformed data, credential URLs, and storage errors.');
}finally{rmSync(dir,{recursive:true,force:true})}
