// Coordinates are never retained or sent to the workspace. Websites use the
// browser's native geolocation API after the visitor approves this shared origin.
export class LocationPermission {
 constructor({navigator,ui,onPending,onRevoked}) {
  Object.assign(this,{navigator,ui,onPending,onRevoked});
  this.allowed=false;this.pending=null;this.permission=null;
  ui.button.addEventListener('click',()=>this.request());
 }
 show(message='Choose Allow location, then approve your browser’s location prompt.',retry=false) {
  this.ui.panel.hidden=false;this.ui.message.textContent=message;
  this.ui.button.disabled=!this.navigator.geolocation;
  this.ui.button.textContent=retry||this.permission?.state==='denied'?'Try again':'Allow location';
  this.onPending(true);
 }
 finish() {
  this.allowed=true;this.ui.panel.hidden=true;this.ui.button.disabled=false;
  this.onPending(false);this.resolve?.();this.resolve=null;this.pending=null;
 }
 async require() {
  if(!this.permission&&this.navigator.permissions){
   try {
    this.permission=await this.navigator.permissions.query({name:'geolocation'});
    this.permission.addEventListener('change',()=>{
     if(this.permission.state==='granted'){if(this.pending)this.finish();return}
     if(this.allowed){this.allowed=false;this.show('Location access changed. Allow location again to continue browsing.');this.onRevoked?.()}
    });
   }catch{}
  }
  if(this.permission?.state==='granted'){this.finish();return}
  if(!this.navigator.geolocation)this.show('This browser does not provide location access. Open Musab X in a browser with location services enabled.');
  else if(this.permission?.state==='denied')this.show('Location is blocked. Allow location for this site in your browser’s site permissions, then try again.');
  else this.show();
  this.pending??=new Promise(resolve=>{this.resolve=resolve});
  return this.pending;
 }
 request() {
  if(!this.navigator.geolocation)return;
  this.ui.button.disabled=true;this.ui.message.textContent='Waiting for your browser’s location permission…';
  this.navigator.geolocation.getCurrentPosition(
   ()=>this.finish(),
   error=>{
    // Device positioning can fail even after the visitor grants permission.
    // Require approval, rather than requiring GPS hardware to produce a fix.
    if(this.permission?.state==='granted'){this.finish();return}
    this.show(error.code===1?'Location is blocked. Allow location for this site in your browser’s site permissions, then try again.':'Location could not be checked. Enable device location services, then try again.',true);
   },
   {enableHighAccuracy:false,timeout:15000,maximumAge:300000}
  );
 }
}
