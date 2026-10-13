import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';

export async function deployIndependent(sourceEnv=process.env,spawnCommand=spawn){
 const secret=sourceEnv.MUSAB_GITHUB_CLIENT_SECRET;
 if(!secret)throw new Error('Set MUSAB_GITHUB_CLIENT_SECRET in the encrypted build secrets before deploying.');
 const env={...sourceEnv};delete env.MUSAB_GITHUB_CLIENT_SECRET;
 const run=(args,input)=>new Promise((resolve,reject)=>{
  const child=spawnCommand(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args],{env,stdio:[input===undefined?'ignore':'pipe','inherit','inherit']});
  child.once('error',()=>reject(new Error('Unable to start the deployment command.')));
  child.once('close',code=>resolve(code??1));
  if(input!==undefined){child.stdin.on('error',()=>{});child.stdin.end(input)}
 });
 // Deploy first so the Worker exists, including on its initial publication.
 const deployed=await run(['deploy','--config','dist/server/wrangler.json']);
 if(deployed!==0)return deployed;
 // Wrangler bulk reads the pipe directly. Reopening /dev/stdin fails when Node
 // uses a socket for child stdin in Cloudflare's build environment.
 return run(['secret','bulk','--config','dist/server/wrangler.json'],JSON.stringify({GITHUB_CLIENT_SECRET:secret}));
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{process.exitCode=await deployIndependent()}catch{console.error('Deployment could not complete. Verify the encrypted build secret and Cloudflare permissions.');process.exitCode=1}
}
