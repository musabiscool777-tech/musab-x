import assert from 'node:assert/strict';
import {LocationPermission} from '../browser/public/location-permission.mjs';
class Element extends EventTarget {hidden=true;disabled=false;textContent=''}
class Permission extends EventTarget {state='prompt';change(state){this.state=state;this.dispatchEvent(new Event('change'))}}
function setup(state='prompt',geolocation=true){
 const permission=new Permission();permission.state=state;
 const ui={panel:new Element(),button:new Element(),message:new Element()},pending=[];
 let success,error,requests=0,revoked=0;
 const gate=new LocationPermission({navigator:{permissions:{async query({name}){assert.equal(name,'geolocation');return permission}},...(geolocation?{geolocation:{getCurrentPosition(ok,fail){requests++;success=ok;error=fail}}}:{})},ui,onPending:p=>pending.push(p),onRevoked:()=>revoked++});
 return {gate,permission,ui,pending,get requests(){return requests},get revoked(){return revoked},success:()=>success({coords:{latitude:1,longitude:2}}),error:code=>error({code})};
}
const turn=()=>new Promise(r=>setTimeout(r,0));
const ask=setup();let opened=false;const wait=ask.gate.require().then(()=>opened=true);await turn();
assert.equal(opened,false);assert.equal(ask.requests,0,'Do not request location before the visitor clicks');assert.equal(ask.ui.panel.hidden,false);
ask.ui.button.dispatchEvent(new Event('click'));assert.equal(ask.requests,1);assert.equal(opened,false);assert.equal(ask.ui.button.disabled,true);
ask.permission.change('granted');await wait;assert.equal(opened,true);assert.equal(ask.gate.allowed,true);assert.equal(ask.ui.panel.hidden,true);assert.equal(ask.pending.at(-1),false);
ask.permission.change('denied');assert.equal(ask.gate.allowed,false);assert.equal(ask.ui.panel.hidden,false);assert.equal(ask.revoked,1);
const denied=setup();let deniedOpened=false;void denied.gate.require().then(()=>deniedOpened=true);await turn();denied.ui.button.dispatchEvent(new Event('click'));denied.error(1);await turn();assert.equal(deniedOpened,false);assert.match(denied.ui.message.textContent,/blocked/);assert.equal(denied.ui.button.disabled,false);assert.equal(denied.ui.button.textContent,'Try again');
const unavailable=setup('prompt',false);void unavailable.gate.require();await turn();assert.equal(unavailable.ui.button.disabled,true);assert.match(unavailable.ui.message.textContent,/does not provide/);
const approved=setup('granted');await approved.gate.require();assert.equal(approved.requests,0,'Previously approved location needs no extra coordinates');assert.equal(approved.gate.allowed,true);
const timeout=setup();const resolved=timeout.gate.require();await turn();timeout.ui.button.dispatchEvent(new Event('click'));timeout.permission.state='granted';timeout.error(3);await resolved;assert.equal(timeout.gate.allowed,true,'GPS positioning failure must not discard a valid permission grant');
console.log('Location permission tests passed: click-to-request, required approval, denial/retry, revocation, missing support, remembered browser approval, and position timeout.');
