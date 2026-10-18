/* Musab X browser shell. Websites execute only on this separate browser origin. */
const APP=window.MUSAB_APP_ORIGIN,box=document.getElementById('message');
let frame,connection,starting=false,authenticated=false;
function send(type,extra={}){parent.postMessage({type,...extra},APP)}
function status(message){box.textContent=message;box.hidden=false}
function fail(error){starting=false;status(error?.message||'Browser could not connect. Try reloading.');send('musab:error',{error:box.textContent,details:error?.details||''})}
function validUrl(raw){const u=new URL(raw);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)throw new Error('Enter a public website address.');return u.href}
async function ensureTransport(){
 const setup=async()=>{
  // All workspace tabs share this BareMux worker. Reuse its transport.
  if(await connection.getTransport()!=='/transport.mjs?v=20261018c')await connection.setTransport('/transport.mjs?v=20261018c',[{wisp:location.origin.replace(/^http/,'ws')+'/wisp/',wisp_v2:false,udp_extension_required:false}]);
 };
 if(navigator.locks)await navigator.locks.request('musab-browser-transport',setup);else await setup();
}
async function initialise(){
 const {ScramjetController}=$scramjetLoadController();
 const controller=new ScramjetController({prefix:'/browse/',files:{wasm:'/scram/scramjet.wasm.wasm',all:'/scram/scramjet.all.js',sync:'/scram/scramjet.sync.js'}});
 await controller.init();
 const registration=await navigator.serviceWorker.register('/sw.js',{scope:'/'});
 await navigator.serviceWorker.ready;
 if(!navigator.serviceWorker.controller)await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Browser service worker did not activate. Allow website storage and reload.')),15000);navigator.serviceWorker.addEventListener('controllerchange',()=>{clearTimeout(timeout);resolve()},{once:true});if(navigator.serviceWorker.controller){clearTimeout(timeout);resolve()}});
 connection=new BareMux.BareMuxConnection('/baremux/worker.js');
 await ensureTransport();
 frame=controller.createFrame();frame.frame.id='page';frame.frame.hidden=true;frame.frame.title='Website';frame.frame.allow='geolocation; camera; microphone; fullscreen; clipboard-read; clipboard-write; picture-in-picture';frame.frame.setAttribute('allowfullscreen','');
 frame.frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-modals allow-downloads allow-pointer-lock');
 frame.addEventListener('navigate',()=>{frame.frame.hidden=true;status('Loading website…');send('musab:loading')});
 frame.addEventListener('urlchange',event=>{try{send('musab:url',{url:validUrl(event.url)})}catch{}});
 frame.addEventListener('contextInit',event=>{event.window.document.addEventListener('click',click=>{const link=click.target?.closest?.('a[target]');if(link&&link.target!=='_self')link.target='_self'},true);event.window.document.addEventListener('submit',submit=>{if(submit.target?.tagName==='FORM')submit.target.target='_self'},true)});
 frame.frame.addEventListener('load',()=>{
  const doc=frame.frame.contentDocument;
  if(frame.frame.src==='about:blank'||doc?.URL==='about:blank')return;
  if(doc?.getElementById('errorTrace')&&doc?.getElementById('errorTitle')){
   frame.frame.hidden=true;
   const error=new Error('The website could not load. Expand Technical details below to see the error.');error.details=String(doc.getElementById('errorTrace').value||'').slice(0,8000);fail(error);return;
  }
  frame.frame.hidden=false;box.hidden=true;document.getElementById('source').hidden=true;send('musab:loaded');
  try{send('musab:url',{url:validUrl(frame.url.href),title:doc.title.slice(0,120)})}catch{}
 });
 document.body.appendChild(frame.frame);
}
let initialized;
window.addEventListener('message',async event=>{
 if(event.origin!==APP||event.source!==parent)return;const d=event.data;if(!d||typeof d!=='object')return;
 try{
  if(d.type==='musab:connect'){
   if(starting)return;starting=true;status('Connecting your browser…');
   const result=await fetch('/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ticket:d.ticket})});
   if(!result.ok)throw new Error(await result.text());authenticated=true;initialized??=initialise().catch(error=>{initialized=undefined;throw error});await initialized;starting=false;frame.go(validUrl(d.url));send('musab:connected');return;
  }
  if(d.type==='musab:refresh'){const r=await fetch('/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ticket:d.ticket})});if(!r.ok)throw new Error('Sign in again to reconnect.');return}
  if(!authenticated||!frame)return;
  if(d.type==='musab:navigate')frame.go(validUrl(d.url));
  if(d.type==='musab:back')frame.back();
  if(d.type==='musab:forward')frame.forward();
  if(d.type==='musab:reload')frame.reload();
 }catch(error){fail(error)}
});
send('musab:ready');
// Refresh the relay's account session without replacing the loaded website.
setInterval(()=>send('musab:renew'),6*3600000);
