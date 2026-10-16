import {env} from 'cloudflare:workers';
import {account,body,checkWrite,db,json} from '../../../lib/core';
import {createLiveBrowser,LiveError} from '../../../lib/browserless';
import {validUrl} from '../../../lib/web';
export async function POST(r:Request){
 try{checkWrite(r)}catch{return json({error:'Invalid request origin or content type.'},403)}
 let a:{id:string};try{a=await account(r)}catch{return json({error:'Sign in to Musab X to use the live browser.'},401)}
 try{
  const b=await body(r);if(typeof b.url!=='string'||b.url.length>4000)return json({error:'Enter a public HTTPS website.'},400);
  let target:string;try{target=validUrl(b.url).href}catch{return json({error:'Enter a public HTTPS website.'},400)}
  if(!env.BROWSERLESS_TOKEN)return json({error:'BROWSERLESS_TOKEN is missing from this Worker. Add it as a runtime secret and deploy.'},503);
  const now=Date.now(),cutoff=now-600000;
  // A durable, atomic limit prevents parallel requests from bypassing the usage cap.
  const result=await db().prepare('INSERT INTO live_browser_usage (account_id,window_start,starts) VALUES (?,?,1) ON CONFLICT(account_id) DO UPDATE SET starts=CASE WHEN window_start<=? THEN 1 ELSE starts+1 END, window_start=CASE WHEN window_start<=? THEN ? ELSE window_start END WHERE window_start<=? OR starts<6').bind(a.id,now,cutoff,cutoff,now,cutoff).run();
  if(!result.meta.changes)return json({error:'Live browser start limit reached. Search within the displayed website, or try again in 10 minutes.'},429);
  return json(await createLiveBrowser(target,env.BROWSERLESS_TOKEN,{quality:['fast','balanced','sharp'].includes(b.quality)?b.quality:'balanced',sessionMinutes:[2,15,30,60,120].includes(b.sessionMinutes)?b.sessionMinutes:60}));
 }catch(e){return json({error:e instanceof LiveError?e.message:'The live browser could not start. Check that the latest database migration has deployed.'},e instanceof LiveError?e.status:502)}
}
