import {spawn} from 'node:child_process';
const {MUSAB_GITHUB_CLIENT_SECRET}=process.env;
if(!MUSAB_GITHUB_CLIENT_SECRET)throw new Error('Set the MUSAB_GITHUB_CLIENT_SECRET repository secret before deploying.');
const env={...process.env};delete env.MUSAB_GITHUB_CLIENT_SECRET;
// The secret is passed through stdin, never argv, console output, or a build file.
const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','deploy','--config','dist/server/wrangler.json','--secrets-file','/dev/stdin'],{env,stdio:['pipe','inherit','inherit']});
child.stdin.end(JSON.stringify({GITHUB_CLIENT_SECRET:MUSAB_GITHUB_CLIENT_SECRET}));
child.on('error',()=>{console.error('Unable to start deployment.');process.exitCode=1});
child.on('close',code=>{process.exitCode=code??1});
