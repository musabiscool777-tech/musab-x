import assert from 'node:assert/strict';
import {networkAccess} from '../lib/network-access.ts';

function request(ip,org,extra={}){
 const r=new Request('https://atom.example/',{headers:{'CF-Connecting-IP':ip,...extra}});
 Object.defineProperty(r,'cf',{value:{asOrganization:org}});
 return r;
}
let calls=0;
globalThis.fetch=async url=>{
 calls++;
 assert.equal(url,'https://raw.githubusercontent.com/proxifly/free-proxy-list/main/proxies/all/data.txt');
 return new Response(Array.from({length:125},(_,i)=>'http://192.0.2.'+i+':443').join('\n'));
};
assert.equal((await networkAccess(request('198.51.100.1','Example Unified School District'))).status,403);
for(const org of ['North College','Regional University','North Academy','Université de Ville','K-12 Network']){
 assert.equal((await networkAccess(request('198.51.100.1',org))).status,403);
}
assert.equal(calls,0);
assert.equal((await networkAccess(request('192.0.2.2','Ordinary ISP'))).status,403);
assert.equal(await networkAccess(request('198.51.100.1','Ordinary ISP',{'X-Forwarded-For':'192.0.2.2'})),undefined);
assert.equal(calls,1);
console.log('School-network, proxy match, unlisted address, feed reuse and untrusted forwarding header checks passed.');
