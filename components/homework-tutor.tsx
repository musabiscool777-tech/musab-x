'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowUp,Plus,MessageSquare,PanelLeft,Trash2} from 'lucide-react';
import {tutorStyles,type TutorStyle} from '../lib/tutor-styles';

type Message={role:'user'|'assistant';content:string};
type Conversation={id:string;messages:Message[]};
export function HomeworkStudy(){
 const [style,setStyle]=useState<TutorStyle>('Guide me'),[draft,setDraft]=useState(''),[chats,setChats]=useState<Conversation[]>([{id:'first',messages:[]}]),[active,setActive]=useState('first'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[sidebar,setSidebar]=useState(false);
 const sending=useRef(false),bottom=useRef<HTMLDivElement>(null);
 const chat=chats.find(c=>c.id===active)||chats[0];
 useEffect(()=>{bottom.current?.scrollIntoView({block:'end'})},[chat.messages.length,busy]);
 function newChat(){
  if(busy)return;
  const id=crypto.randomUUID();setChats(items=>[{id,messages:[]},...items]);setActive(id);setDraft('');setError('');setSidebar(false);
 }
 async function ask(event:React.FormEvent){
  event.preventDefault();
  const question=draft.trim();
  if(!question||sending.current)return;
  sending.current=true;setBusy(true);setError('');setDraft('');
  const id=chat.id,next:Message[]=[...chat.messages,{role:'user',content:question}];
  setChats(items=>items.map(c=>c.id===id?{...c,messages:next}:c));
  try{
   const r=await fetch('/api/tutor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({style,messages:next.slice(-7).map(m=>({...m,content:m.content.slice(0,3000)}))}),signal:AbortSignal.timeout(60000)});
   const data=await r.json() as {answer?:string;error?:string};
   if(!r.ok||!data.answer)throw new Error(data.error||'Could not reach Astra.');
   setChats(items=>items.map(c=>c.id===id?{...c,messages:[...next,{role:'assistant',content:data.answer!}]}:c));
  }catch(e){
   setChats(items=>items.map(c=>c.id===id?{...c,messages:chat.messages}:c));setDraft(question);
   setError(e instanceof Error?e.message:'Please try again.');
  }finally{sending.current=false;setBusy(false)}
 }
 return <section className={'astraChat'+(sidebar?' showChatList':'')}>
 <aside className="astraChatList">
  <a className="astraBrand" href="/study"><img src="/atom-planet.svg" alt="" width="30" height="30"/>Astra</a>
  <button onClick={newChat} disabled={busy}><Plus size={18}/>New chat</button>
  <p>Conversations</p><div className="astraRecents">{chats.map(c=><button key={c.id} disabled={busy} aria-current={c.id===active?'page':undefined} onClick={()=>{setActive(c.id);setError('');setDraft('');setSidebar(false)}}><MessageSquare size={15}/><span>{c.messages[0]?.content||'New chat'}</span></button>)}</div>
  <a href="/astra">Original Astra resources ↗</a><a href="/">Atom home</a>
  <small>Conversations last while this page is open.</small>
 </aside>
 <div className="astraChatMain">
 <header><button className="icon" title="Conversations" aria-label="Conversations" aria-expanded={sidebar} onClick={()=>setSidebar(v=>!v)}><PanelLeft size={19}/></button><h1>Astra</h1>
 <button className="icon" title="Clear conversation" aria-label="Clear conversation" disabled={busy} onClick={()=>{setChats(items=>items.map(c=>c.id===active?{...c,messages:[]}:c));setError('')}}><Trash2 size={17}/></button></header>
 <div className="astraMessages" role="log" aria-label="Conversation with Astra">
 {chat.messages.length===0&&<div className="astraWelcome"><img src="/atom-planet.svg" alt="" width="64" height="64"/><h2>What are we learning today?</h2><p>Ask a question, work through a problem, or try a quick quiz.</p></div>}
 {chat.messages.map((m,i)=><article key={i} className={'astraMessage '+m.role}><strong>{m.role==='assistant'?'Astra':'You'}</strong><div>{m.content}</div></article>)}
 {busy&&<div className="astraThinking" role="status">Astra is thinking<span>…</span></div>}<div ref={bottom}/>
 </div>
 <div className="astraComposerWrap"><form className="astraComposer" onSubmit={ask}>
 <label className="sr-only" htmlFor="homeworkQuestion">Message Astra</label>
 <textarea id="homeworkQuestion" value={draft} maxLength={3000} disabled={busy} onChange={e=>setDraft(e.target.value)} placeholder="Message Astra" rows={2} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();e.currentTarget.form?.requestSubmit()}}}/>
 <div><select aria-label="Learning style" value={style} disabled={busy} onChange={e=>setStyle(e.target.value as TutorStyle)}>{tutorStyles.map(s=><option key={s}>{s}</option>)}</select><button aria-label="Send message" disabled={busy||!draft.trim()}><ArrowUp size={20}/></button></div>
 </form>{error&&<p role="alert">{error}</p>}<small>Astra can make mistakes. Questions go to Cloudflare Workers AI. Leave out personal details.</small></div>
 </div></section>
}
