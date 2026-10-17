'use client';
import {useEffect,useRef,type ReactNode} from 'react';
import {X} from 'lucide-react';
export function WorkspaceDialog({label,onClose,children}:{label:string;onClose:()=>void;children:ReactNode}){
 const ref=useRef<HTMLDialogElement>(null),close=useRef(onClose),previousFocus=useRef(typeof document==='undefined'?null:document.activeElement);close.current=onClose;
 useEffect(()=>{const dialog=ref.current!;dialog.showModal();return()=>{dialog.close();if(previousFocus.current instanceof HTMLElement&&previousFocus.current.isConnected)previousFocus.current.focus()}},[]);
 return <dialog ref={ref} className="workspaceDialog" aria-label={label} onCancel={e=>{e.preventDefault();close.current()}} onClick={e=>{if(e.target===e.currentTarget)close.current()}}><div className="dialogContent"><div className="dialogHeading"><h2>{label}</h2><button className="icon" aria-label="Close dialog" onClick={onClose}><X size={18}/></button></div>{children}</div></dialog>;
}
