'use client';
import {useState} from 'react';
import {ArrowUpRight,Plus,Trash2} from 'lucide-react';
import {WorkspaceDialog} from './workspace-dialog';
type Shortcut={id:string;title:string;url:string};
type Starter={title:string;url:string;letter:string;color:string;desc:string};
export function Launchpad({shortcuts,starters,onAdd,onRemove,onOpen,onBookmarks}:{shortcuts:Shortcut[];starters:Starter[];onAdd:(entry:Shortcut)=>void;onRemove:(id:string)=>void;onOpen:(url:string)=>void;onBookmarks:()=>void}){
 const [adding,setAdding]=useState(false),[error,setError]=useState('');
 function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();const data=new FormData(event.currentTarget);try{
  const raw=String(data.get('url')||'').trim();const url=new URL(/^[a-z][a-z\d+.-]*:/i.test(raw)?raw:'https://'+raw);
  if(url.protocol!=='https:'||url.username||url.password)throw new Error('Enter an HTTPS website without a username or password.');
  if(shortcuts.some(s=>s.url===url.href))throw new Error('This website is already on your launchpad.');
  if(shortcuts.length>=12)throw new Error('Your launchpad can hold up to 12 custom shortcuts.');
  const title=String(data.get('title')||'').trim();if(!title)throw new Error('Give your shortcut a name.');
  onAdd({id:crypto.randomUUID(),title,url:url.href});setAdding(false);setError('');
 }catch(e){setError(e instanceof Error?e.message:'Enter a valid website address.')}}
 return <section className="quicklinks"><div className="sectionHeading"><h2>Your launchpad <span>THE PLACES YOU COME BACK TO</span></h2><div className="buttonRow"><button className="chip" disabled={shortcuts.length>=12} onClick={()=>{setError('');setAdding(true)}}><Plus size={14}/>Add shortcut</button><button className="bookmarksLink" onClick={onBookmarks}>Bookmarks<ArrowUpRight size={14}/></button></div></div>
 {shortcuts.length>0&&<div className="customShortcuts">{shortcuts.map(s=><div className="shortcutCard" key={s.id}><button className="shortcutOpen" onClick={()=>onOpen(s.url)}><span className="shortcutLetter">{s.title[0]?.toUpperCase()||'↗'}</span><b>{s.title}</b><small>{(()=>{try{return new URL(s.url).hostname}catch{return s.url}})()}</small></button><button className="icon shortcutRemove" aria-label={'Remove shortcut '+s.title} onClick={()=>onRemove(s.id)}><Trash2 size={13}/></button></div>)}</div>}
 <div className="cards">{starters.map(s=><button className="linkCard" key={s.title} onClick={()=>onOpen(s.url)}><div className="cardTop"><span className="siteIcon" style={{color:s.color,background:s.color+'16'}}>{s.letter}</span><ArrowUpRight size={17}/></div><b>{s.title}</b><p>{s.desc}</p><small>{new URL(s.url).hostname}</small></button>)}</div>
 {adding&&<WorkspaceDialog label="Add a shortcut" onClose={()=>setAdding(false)}><p className="dialogSubtitle">Keep a favorite website one click away.</p><form className="shortcutForm" onSubmit={submit}><label>Name<input name="title" autoFocus maxLength={60} placeholder="e.g. My favorite site" required/></label><label>Website address<input name="url" maxLength={4000} placeholder="example.com" autoCapitalize="none" autoCorrect="off" spellCheck={false} required/></label>{error&&<p role="alert" className="emailError">{error}</p>}<div className="buttonRow"><button className="primaryButton" type="submit"><Plus size={16}/>Add to launchpad</button><button className="chip" type="button" onClick={()=>setAdding(false)}>Cancel</button></div></form></WorkspaceDialog>}</section>;
}
