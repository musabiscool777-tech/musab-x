'use client';
import {useState} from 'react';
import {Sparkles,BookOpen,Gamepad2,Joystick,MessageCircle,Plus,Trash2} from 'lucide-react';
import {WorkspaceDialog} from './workspace-dialog';
type Shortcut={id:string;title:string;url:string};
type Starter={title:string;url:string;letter:string;color:string};
const shortcutIcons:Record<string,typeof Gamepad2>={CrazyGames:Gamepad2,Poki:Joystick,Discord:MessageCircle};
export function Launchpad({shortcuts,starters,onAdd,onRemove,onOpen,onStudy}:{shortcuts:Shortcut[];starters:Starter[];onAdd:(entry:Shortcut)=>void;onRemove:(id:string)=>void;onOpen:(url:string)=>void;onStudy:()=>void}){
 const [adding,setAdding]=useState(false),[error,setError]=useState('');
 function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();const data=new FormData(event.currentTarget);try{
  const raw=String(data.get('url')||'').trim();const url=new URL(/^[a-z][a-z\d+.-]*:/i.test(raw)?raw:'https://'+raw);
  if(url.protocol!=='https:'||url.username||url.password)throw new Error('Enter an HTTPS website without a username or password.');
  if(shortcuts.some(s=>s.url===url.href))throw new Error('This website is already on your launchpad.');
  if(shortcuts.length>=12)throw new Error('Your launchpad can hold up to 12 custom shortcuts.');
  const title=String(data.get('title')||'').trim();if(!title)throw new Error('Give your shortcut a name.');
  onAdd({id:crypto.randomUUID(),title,url:url.href});setAdding(false);setError('');
 }catch(e){setError(e instanceof Error?e.message:'Enter a valid website address.')}}
 return <section className="quicklinks" aria-label="Shortcuts">
 <div className="homeShortcuts">
  <a className="homeShortcut astraShortcut" href="/astra"><span className="shortcutDisc"><Sparkles size={20}/></span>Astra</a>
  <button className="homeShortcut" onClick={onStudy}><span className="shortcutDisc"><BookOpen size={20}/></span>Study</button>
  {starters.map(s=>{const Icon=shortcutIcons[s.title];return <button className="homeShortcut" key={s.url} onClick={()=>onOpen(s.url)}><span className="shortcutDisc" style={{color:s.color}}>{Icon?<Icon size={19}/>:s.letter}</span>{s.title}</button>})}
  {shortcuts.map(s=><div className="savedShortcut" key={s.id}>
   <button className="homeShortcut" onClick={()=>onOpen(s.url)}><span className="shortcutDisc">{s.title[0]?.toUpperCase()}</span>{s.title}</button>
   <button className="removeShortcut" aria-label={'Remove shortcut '+s.title} onClick={()=>onRemove(s.id)}><Trash2 size={12}/></button>
  </div>)}
  <button className="homeShortcut addShortcut" disabled={shortcuts.length>=12} onClick={()=>{setError('');setAdding(true)}}><span className="shortcutDisc"><Plus size={20}/></span>Add shortcut</button>
 </div>
 {adding&&<WorkspaceDialog label="Add a shortcut" onClose={()=>setAdding(false)}><p className="dialogSubtitle">Keep a favorite website one click away.</p><form className="shortcutForm" onSubmit={submit}><label>Name<input name="title" autoFocus maxLength={60} placeholder="e.g. My favorite site" required/></label><label>Website address<input name="url" maxLength={4000} placeholder="example.com" autoCapitalize="none" autoCorrect="off" spellCheck={false} required/></label>{error&&<p role="alert" className="emailError">{error}</p>}<div className="buttonRow"><button className="primaryButton" type="submit"><Plus size={16}/>Add to launchpad</button><button className="chip" type="button" onClick={()=>setAdding(false)}>Cancel</button></div></form></WorkspaceDialog>}</section>;
}
