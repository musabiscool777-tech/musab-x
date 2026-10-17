'use client';
import {Check} from 'lucide-react';
import {themes} from '../lib/appearance';
export function ThemePicker({value,onChange}:{value:string;onChange:(id:string)=>void}) {
  return <div className="themeGrid" role="group" aria-label="Workspace theme">{themes.map(theme=><button type="button" key={theme.id} className={'themeOption '+(value===theme.id?'chosen':'')} aria-pressed={value===theme.id} onClick={()=>onChange(theme.id)}>
    <span className="themePreview" aria-hidden="true" style={{background:theme.background,color:theme.accent}}><span className="previewSidebar" style={{background:theme.surface}}><i/><i/><i/></span><span className="previewCanvas"><span className="previewLine"/><span className="previewSearch" style={{background:theme.surface}}/><span className="previewCards"><i style={{background:theme.surface}}/><i style={{background:theme.surface}}/><i style={{background:theme.surface}}/></span></span>{value===theme.id&&<span className="themeCheck"><Check size={13}/></span>}</span>
    <span className="themeName">{theme.name}</span><span className="themeDescription">{theme.description}</span>
  </button>)}</div>;
}
