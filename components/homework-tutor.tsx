'use client';
import {useRef,useState} from 'react';
import {StudyView} from './study-view';

type Message={role:'user'|'assistant';content:string};
export function HomeworkStudy(){
 const [resources,setResources]=useState(false),[draft,setDraft]=useState(''),[messages,setMessages]=useState<Message[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const sending=useRef(false);
 async function ask(event:React.FormEvent){
  event.preventDefault();
  const question=draft.trim();
  if(!question||sending.current)return;
  sending.current=true;setBusy(true);setError('');
  const next:Message[]=[...messages,{role:'user',content:question}];
  try{
   const r=await fetch('/api/tutor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:next.slice(-7).map(m=>({...m,content:m.content.slice(0,3000)}))}),signal:AbortSignal.timeout(60000)});
   const data=await r.json() as {answer?:string;error?:string};
   if(!r.ok||!data.answer)throw new Error(data.error||'Could not reach the tutor.');
   setMessages([...next,{role:'assistant',content:data.answer}]);setDraft('');
  }catch(e){setError(e instanceof Error?e.message:'Please try again.')}
  finally{sending.current=false;setBusy(false)}
 }
 return <section className="homeworkStudy"><header><h1>Study</h1><div className="buttonRow">
  <button className="chip" aria-pressed={!resources} onClick={()=>setResources(false)}>Homework tutor</button>
  <button className="chip" aria-pressed={resources} onClick={()=>setResources(true)}>Study resources</button>
 </div></header>{resources?<StudyView/>:<div className="tutorCard">
 <h2>Homework tutor</h2><p>Share your question and what you’ve tried. Ask for a hint, a worked example, or feedback.</p>
 <div role="log" aria-label="Tutoring conversation">{messages.map((m,i)=><div key={i} className="tutorTurn"><strong>{m.role==='user'?'You':'Atom tutor'}</strong><div>{m.content}</div></div>)}</div>
 <form onSubmit={ask}><label htmlFor="homeworkQuestion">{messages.length?'Ask a follow-up':'Your question'}</label>
 <textarea id="homeworkQuestion" value={draft} maxLength={3000} disabled={busy} onChange={e=>setDraft(e.target.value)} placeholder="How do I solve 3x + 5 = 20?" rows={3}/>
 <small>Questions and recent replies are sent to Cloudflare Workers AI. Leave out personal details.</small>
 {error&&<p role="alert">{error}</p>}
 <div className="buttonRow"><button className="primaryButton" disabled={busy||!draft.trim()}>{busy?'Thinking…':'Ask tutor'}</button>
 {messages.length>0&&<button className="chip" type="button" disabled={busy} onClick={()=>{setMessages([]);setDraft('');setError('')}}>New conversation</button>}</div></form>
 </div>}</section>
}
