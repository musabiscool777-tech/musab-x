export type SavedTab={id:string,title:string,input:string,kind:'home'|'search'|'page',stack:string[],position:number};
export type TabSession={version:1,tabs:SavedTab[],active:string};
export function tabSessionKey(accountId?:string){return 'musab-x-tabs:v1:'+(accountId?'account:'+encodeURIComponent(accountId):'guest')}
function safeInput(value:unknown):value is string{
 if(typeof value!=='string'||value.length>4000)return false;
 if(/^https?:\/\//i.test(value)){try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password}catch{return false}}
 return true;
}
export function parseTabSession(raw:string|null):TabSession|null{
 if(!raw||raw.length>1000000)return null;
 try{
  const data=JSON.parse(raw);if(data.version!==1||!Array.isArray(data.tabs)||!data.tabs.length||data.tabs.length>20)return null;
  const ids=new Set<string>(),tabs:SavedTab[]=[];
  for(const tab of data.tabs){
   if(!tab||typeof tab.id!=='string'||!tab.id||tab.id.length>100||ids.has(tab.id)||typeof tab.title!=='string'||tab.title.length>1000||!safeInput(tab.input)||!['home','search','page'].includes(tab.kind)||!Array.isArray(tab.stack)||!tab.stack.length||tab.stack.length>100||!tab.stack.every(safeInput)||!Number.isInteger(tab.position)||tab.position<0||tab.position>=tab.stack.length)return null;
   if(tab.kind==='home'&&tab.input!=='')return null;
   if(tab.kind==='page'&&!/^https?:\/\//i.test(tab.input))return null;
   ids.add(tab.id);tabs.push({id:tab.id,title:tab.title,input:tab.input,kind:tab.kind,stack:tab.stack,position:tab.position});
  }
  return {version:1,tabs,active:ids.has(data.active)?data.active:tabs[0].id};
 }catch{return null}
}
export function saveTabSession(storage:Pick<Storage,'setItem'>,key:string,tabs:SavedTab[],active:string){
 try{
  const compact=tabs.map(tab=>{const start=Math.max(0,tab.position-49);return {...tab,stack:tab.stack.slice(start,start+100),position:tab.position-start}});
  const raw=JSON.stringify({version:1,tabs:compact,active});if(!parseTabSession(raw))return false;
  storage.setItem(key,raw);return true;
 }catch{return false}
}
