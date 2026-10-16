import {cpSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';
const destination='dist/browser-assets';mkdirSync(destination,{recursive:true});cpSync('browser/public',destination,{recursive:true});
for(const [pkg,folder] of [['scramjet','scram'],['bare-mux','baremux'],['epoxy-transport','epoxy']]){
 const root=`node_modules/@mercuryworkshop/${pkg}`;
 cpSync(root+'/dist',destination+'/'+folder,{recursive:true,filter:path=>!path.endsWith('.map')&&!path.endsWith('.d.ts')&&!path.includes('/types')});
}
writeFileSync(destination+'/NOTICE.txt',readFileSync('browser/NOTICE.txt'));
console.log('Browser assets prepared from locked open-source packages.');
