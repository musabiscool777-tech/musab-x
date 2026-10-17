'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,Globe,Search} from 'lucide-react';
import {WorkspaceDialog} from './workspace-dialog';
export function TabSwitcher({tabs,active,onSelect,onClose}:{tabs:{id:string;title:string;input:string}[];active:string;onSelect:(id:string)=>void;onClose:()=>void}){
 const [query,setQuery]=useState(''),[cursor,setCursor]=useState(0);
 const list=useRef<HTMLDivElement>(null);
 useEffect(()=>{list.current?.children[cursor]?.scrollIntoView({block:'nearest'})},[cursor,query]);
 const matches=tabs.filter(tab=>(tab.title+' '+tab.input).toLowerCase().includes(query.trim().toLowerCase()));
 function choose(id:string){onSelect(id);onClose()}
 return <WorkspaceDialog label="Find an open tab" onClose={onClose}><p className="dialogSubtitle">Jump to a page without losing your place.</p><div className="dialogSearch"><Search size={18}/><input autoFocus aria-label="Search open tabs" placeholder="Search by title or website…" value={query} onChange={e=>{setQuery(e.target.value);setCursor(0)}} onKeyDown={e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setCursor(i=>matches.length?(i+(e.key==='ArrowDown'?1:-1)+matches.length)%matches.length:0)}if(e.key==='Enter'&&matches[cursor]){e.preventDefault();choose(matches[cursor].id)}}}/><kbd>ESC</kbd></div><div className="tabMatches" ref={list}>{matches.map((tab,index)=><button key={tab.id} className={index===cursor?'highlighted':''} onMouseEnter={()=>setCursor(index)} onClick={()=>choose(tab.id)}><span className="resumeIcon"><Globe size={18}/></span><span><b>{tab.title}</b><small>{tab.input||'Your launchpad'}</small></span>{tab.id===active?<span className="pill">Current</span>:<ArrowUpRight size={15}/>}</button>)}{!matches.length&&<p className="dialogEmpty">No matching tabs. Try another title or address.</p>}</div><div className="dialogFooter"><span>{matches.length} of {tabs.length} tabs</span><span>↑ ↓ to choose · Enter to open</span></div></WorkspaceDialog>;
}
