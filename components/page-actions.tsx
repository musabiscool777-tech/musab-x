'use client';
import {Copy,CopyPlus,History,House,Search} from 'lucide-react';
import {WorkspaceDialog} from './workspace-dialog';
export function PageActions({title,url,canDuplicate,closedTitle,onClose,onDuplicate,onCopy,onRestore,onHome,onSearch}:{title:string;url:string;canDuplicate:boolean;closedTitle?:string;onClose:()=>void;onDuplicate:()=>void;onCopy:()=>void;onRestore:()=>void;onHome:()=>void;onSearch:()=>void}){
 function run(action:()=>void){onClose();action()}
 return <WorkspaceDialog label="Page actions" onClose={onClose}>
  <p className="dialogSubtitle">A few shortcuts to keep your browsing moving.</p>
  <div className="pageActionPreview"><b>{title}</b><small>{url||'Your personal launchpad'}</small></div>
  <div className="pageActionList">
   <button disabled={!canDuplicate} onClick={()=>run(onDuplicate)}><CopyPlus size={19}/><span><b>Duplicate tab</b><small>Open this page in another workspace tab</small></span></button>
   <button disabled={!url} onClick={()=>run(onCopy)}><Copy size={19}/><span><b>Copy page link</b><small>Share the original website address</small></span></button>
   <button disabled={!closedTitle} onClick={()=>run(onRestore)}><History size={19}/><span><b>Reopen closed tab</b><small>{closedTitle||'No recently closed tabs in this session'}</small></span></button>
   <button onClick={()=>run(onSearch)}><Search size={19}/><span><b>Find an open tab</b><small>Search all your open pages</small></span></button>
   <button onClick={()=>run(onHome)}><House size={19}/><span><b>New launchpad tab</b><small>Your shortcuts and recent discoveries</small></span></button>
  </div>
 </WorkspaceDialog>;
}
