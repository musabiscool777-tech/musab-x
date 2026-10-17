import assert from 'node:assert/strict';
import {resilientTransport} from '../browser/public/transport-core.mjs';
let initialized=0,requests=0,fail=false;
class FixtureTransport {
  async init(){initialized++;await new Promise(resolve=>setTimeout(resolve,5));}
  async request(){requests++;if(fail)throw new Error('Wisp(MuxTaskEnded)');return {status:200};}
  connect(){return 'socket';}
}
const Transport=resilientTransport(FixtureTransport,async()=>{});
const transport=new Transport({});
await Promise.all(Array.from({length:24},()=>transport.request(new URL('https://example.com'),'GET',null,{},null)));
assert.equal(initialized,1,'Concurrent first loads share initialization');
fail=true;requests=0;initialized=0;
const failed=await Promise.allSettled(Array.from({length:12},()=>transport.request(new URL('https://example.com'),'GET',null,{},null)));
assert.ok(failed.every(result=>result.status==='rejected'));
assert.equal(initialized,2,'Concurrent failures share each bounded replacement');
assert.equal(requests,36,'Each safe read has at most two retries');
requests=0;initialized=0;
await assert.rejects(()=>transport.request(new URL('https://example.com'),'POST','form',{},null),/MuxTaskEnded/);
assert.equal(requests,1,'Submitted forms must never be replayed');assert.equal(initialized,0);
fail=false;
const abort=new AbortController();abort.abort(new Error('Cancelled'));
await assert.rejects(()=>transport.request(new URL('https://example.com'),'GET',null,{},abort.signal),/Cancelled/);
assert.equal(requests,1);
let recoveryCalls=0;
class OnceDisconnected extends FixtureTransport {async request(){if(recoveryCalls++===0)throw new Error('Wisp(MuxTaskEnded)');return {status:200};}}
const Recovered=resilientTransport(OnceDisconnected,async()=>{});
assert.equal((await new Recovered({}).request(new URL('https://example.com'),'HEAD',null,{},null)).status,200);
class SiteFailure extends FixtureTransport {async request(){requests++;throw new Error('Website rejected request');}}
requests=0;const NoRetry=resilientTransport(SiteFailure,async()=>{});
await assert.rejects(()=>new NoRetry({}).request(new URL('https://example.com'),'GET',null,{},null),/Website rejected/);assert.equal(requests,1);
console.log('Transport tests passed: concurrent initialization, shared reconnect, safe-read recovery, bounded retries, cancellation, and no form replay.');
