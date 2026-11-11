importScripts('/scram/scramjet.all.js');
const {ScramjetServiceWorker}=$scramjetLoadWorker();

// The controller saves its fixed config to IndexedDB before navigating.
// Scramjet 1.1.0's message handler would set this.config without loading WASM.
self.addEventListener('message',event=>{
 if(event.data?.scramjet$type==='loadConfig')event.stopImmediatePropagation();
});
const scramjet=new ScramjetServiceWorker();
let configReady;
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 const {origin,pathname}=new URL(event.request.url);
 if(origin!==self.location.origin||(!pathname.startsWith('/browse/')&&pathname!=='/scram/scramjet.wasm.wasm'))return;
 event.respondWith((async()=>{
  // Parallel script and frame requests must wait for the same rewriter setup.
  configReady??=scramjet.loadConfig().then(()=>{
   if(!scramjet.config)throw new Error('Browser configuration is unavailable');
  }).catch(error=>{
   scramjet.config=undefined;
   configReady=undefined;
   throw error;
  });
  await configReady;
  return scramjet.fetch(event);
 })());
});
