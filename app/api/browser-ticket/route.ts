import {env} from 'cloudflare:workers';
import {account,checkWrite,db,json} from '../../../lib/core';
import {browserOrigin,issueBrowserTicket} from '../../../lib/browser-ticket';
export async function POST(r:Request){
 try{checkWrite(r)}catch{return json({error:'Invalid request origin or content type.'},403)}
 let a:{id:string};try{a=await account(r)}catch{return json({error:'Sign in to Musab X to browse websites.'},401)}
 try{return json({origin:browserOrigin(env),ticket:await issueBrowserTicket(db(),a.id)})}catch{return json({error:'The browser service is not configured. Redeploy the latest version.'},503)}
}
