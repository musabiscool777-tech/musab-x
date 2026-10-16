'use client';
import {useState} from 'react';
type Mode='password'|'code'|'signup'|'reset';
export function EmailSignIn({enabled,link=false}:{enabled:boolean;link?:boolean}){
 const[mode,setMode]=useState<Mode>('password'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[code,setCode]=useState(''),[sent,setSent]=useState(false),[verifyType,setVerifyType]=useState('email'),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 function choose(next:Mode){setMode(next);setPassword('');setCode('');setSent(false);setMessage('');setError('')}
 async function submit(event:React.FormEvent){event.preventDefault();if(busy)return;setBusy(true);setError('');setMessage('');try{
  const action=mode==='password'?'password':mode==='signup'&&!sent?'signup':sent?'verify-code':'send-code';
  const response=await fetch('/auth/email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,email,link,...(action==='password'||action==='signup'?{password}:{}),...(action==='verify-code'?{code,verifyType,...(mode==='reset'?{newPassword:password}:{})}:{})})});
  const result:any=await response.json();if(!response.ok)throw new Error(result.error||'Sign-in could not be completed.');
  if(result.ok){setPassword('');setCode('');window.location.assign('/');return}
  setSent(true);setVerifyType(result.verifyType||'email');setPassword('');setMessage(result.message);
 }catch(error){setError((error as Error).message)}finally{setBusy(false)}}
 return <div className="emailAuth"><h3>{link?'Link email sign-in':'Sign in with email'}</h3>{link&&<p>Verify your email to use it with this workspace and keep your saved data and permissions.</p>}
 {!enabled?<p className="notice">Email sign-in is awaiting setup by the workspace owner. GitHub sign-in remains available.</p>:<>
 <div className="buttonRow" role="group" aria-label="Email sign-in method"><button className={'chip '+(mode==='password'?'activeChip':'')} onClick={()=>choose('password')}>Email & password</button><button className={'chip '+(mode==='code'?'activeChip':'')} onClick={()=>choose('code')}>Email code</button></div>
 <form onSubmit={submit} className="emailForm"><label>Email<input type="email" autoComplete="email" value={email} onChange={e=>{setEmail(e.target.value);if(sent){setSent(false);setCode('')}}} maxLength={254} required/></label>
 {(mode==='password'||mode==='signup'&&!sent||mode==='reset'&&sent)&&<label>{mode==='reset'?'New password':'Password'}<input type="password" autoComplete={mode==='password'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} minLength={12} maxLength={128} required/>{mode!=='password'&&<small>At least 12 characters.</small>}</label>}
 {sent&&mode!=='password'&&<label>Email verification code<input autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6,8}" minLength={6} maxLength={8} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} required/></label>}
 <button className="primaryButton" disabled={busy}>{busy?'Please wait…':mode==='password'?'Sign in':mode==='signup'&&!sent?'Create account':sent?mode==='reset'?'Verify & set password':'Verify & sign in':'Send email code'}</button>
 </form><div className="emailLinks"><button className="textButton" onClick={()=>choose('signup')}>Create an email account</button><button className="textButton" onClick={()=>choose('reset')}>Set or reset password with a code</button>{sent&&<button className="textButton" onClick={()=>{setSent(false);setCode('');setMessage('')}}>Request another code</button>}</div>
 {message&&<p role="status">{message}</p>}{error&&<p role="alert" className="emailError">{error}</p>}
 </>}
 </div>
}
