'use client';
import {useEffect,useRef,useState} from 'react';
import {Bookmark,Clock,CornerDownLeft,Globe,Search,X} from 'lucide-react';
import {searchSuggestions,type SearchEntry} from '../lib/search-navigation';
type Props={id:string;label:string;placeholder:string;value:string;onChange:(value:string)=>void;onNavigate:(value:string,fresh?:boolean)=>void;onTab:(id:string)=>void;tabs:{id:string;title:string;input:string;kind:string}[];bookmarks:SearchEntry[];history:SearchEntry[];engine:string;selectOnFocus?:boolean};
export function SearchField({id,label,placeholder,value,onChange,onNavigate,onTab,tabs,bookmarks,history,engine,selectOnFocus}:Props){
 const [focused,setFocused]=useState(false),[cursor,setCursor]=useState(-1),[dismissed,setDismissed]=useState(false);
 const input=useRef<HTMLInputElement>(null),list=useRef<HTMLDivElement>(null),composing=useRef(false);
 const matches=searchSuggestions(value,tabs,bookmarks,history),open=focused&&!dismissed&&matches.length>0;
 useEffect(()=>{setCursor(-1)},[value,matches.length]);
 useEffect(()=>{if(cursor>=0)list.current?.children[cursor]?.scrollIntoView({block:'nearest'})},[cursor]);
 function choose(index:number,fresh=false){const item=matches[index];if(!item)return;setDismissed(true);setCursor(-1);input.current?.blur();if(item.tabId&&!fresh)onTab(item.tabId);else onNavigate(item.value,fresh)}
 return <div className="searchField">
  <input ref={input} id={id} name={id==='home-search'?'query':undefined} role="combobox" aria-label={label} aria-autocomplete="list" aria-expanded={open} aria-controls={open?id+'-suggestions':undefined} aria-activedescendant={open&&cursor>=0?matches[cursor]?.id+':'+id:undefined} placeholder={placeholder} value={value} maxLength={4000} autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false}
   onFocus={e=>{setFocused(true);setDismissed(false);if(selectOnFocus)e.currentTarget.select()}} onBlur={()=>{setFocused(false);setCursor(-1)}}
   onCompositionStart={()=>{composing.current=true}} onCompositionEnd={()=>{composing.current=false}}
   onChange={e=>{onChange(e.target.value);setDismissed(false);setCursor(-1)}}
   onKeyDown={e=>{
    if(composing.current||e.nativeEvent.isComposing)return;
    if(e.key==='Escape'){if(open){e.preventDefault();e.stopPropagation()}setDismissed(true);setCursor(-1)}
    if((e.key==='ArrowDown'||e.key==='ArrowUp')&&matches.length){e.preventDefault();setDismissed(false);setCursor(i=>e.key==='ArrowDown'?(i+1)%matches.length:(i<0?matches.length-1:(i-1+matches.length)%matches.length))}
    if(e.key==='Enter'){e.preventDefault();if(open&&cursor>=0)choose(cursor,e.altKey);else if(value.trim()){setDismissed(true);input.current?.blur();onNavigate(value,e.altKey)}}
   }}/>
  {value&&<button className="clearSearch" type="button" aria-label={'Clear '+label.toLowerCase()} onClick={()=>{onChange('');setDismissed(false);input.current?.focus()}}><X size={14}/></button>}
  {open&&<div className="searchSuggestions"><div className="suggestionHeading">YOUR TABS & SAVED DISCOVERIES <span>↑ ↓ · Enter</span></div><div id={id+'-suggestions'} role="listbox" aria-label="Search suggestions" ref={list}>{matches.map((item,index)=>{
   const Icon=item.kind==='tab'?Globe:item.kind==='bookmark'?Bookmark:Clock;
   return <button type="button" role="option" id={item.id+':'+id} aria-selected={index===cursor} key={item.id} onPointerDown={e=>e.preventDefault()} onClick={()=>choose(index)} onMouseEnter={()=>setCursor(index)}><Icon size={16}/><span><b>{item.title}</b><small>{item.value}</small></span><em>{item.kind==='tab'?'Switch tab':item.kind==='bookmark'?'Bookmark':'Recent'}</em><CornerDownLeft size={13}/></button>
  })}</div><div className="suggestionHint"><Search size={12}/>Enter searches {engine==='duckduckgo'?'DuckDuckGo':'Google'} · Alt + Enter opens a new tab</div></div>}
 </div>;
}
