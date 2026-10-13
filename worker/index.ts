import handler from 'vinext/server/fetch-handler';
import {handleGithubAuth} from '../lib/github-auth';
export default {
 async fetch(request:Request,env:Cloudflare.Env,ctx:ExecutionContext){
  // Only this worker's cookie sessions identify accounts on the independent host.
  // Public request headers must never act as a sign-in mechanism.
  const headers=new Headers(request.headers);
  for(const name of [...headers.keys()])if(name.startsWith('oai-authenticated-user-'))headers.delete(name);
  const clean=new Request(request,{headers});
  const auth=await handleGithubAuth(clean,env);if(auth)return auth;
  return handler.fetch(clean,env,ctx);
 }
};
