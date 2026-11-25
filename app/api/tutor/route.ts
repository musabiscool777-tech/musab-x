import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {body,checkWrite,json} from '../../../lib/core';

import {tutorStyles,tutorInstructions} from '../../../lib/tutor-styles';

const dialogue=z.object({style:z.enum(tutorStyles).default('Guide me'),messages:z.array(z.object({
 role:z.enum(['user','assistant']),content:z.string().trim().min(1).max(3000)
})).min(1).max(7)});
const instruction='Your name is Astra. You are Atom’s creative homework tutor. Answer the student’s question at their level. Explain reasoning in short steps, offer a hint or worked example, and invite them to try the next step. Give constructive feedback on their work. Use plain text. If information is missing, ask for it. Do not request personal details.';

export async function POST(request:Request){
 try{checkWrite(request)}catch{return json({error:'Open the tutor in Atom to ask a question.'},403)}
 let parsed;
 try{parsed=dialogue.parse(await body(request))}catch{return json({error:'Enter a question under 3,000 characters.'},400)}
 if(parsed.messages.at(-1)?.role!=='user')return json({error:'Send a question to the tutor.'},400);
 try{
  if(!env.AI||!env.TUTOR_LIMIT)return json({error:'The tutor is temporarily unavailable.'},503);
  const ip=request.headers.get('CF-Connecting-IP');
  if(!ip||!(await env.TUTOR_LIMIT.limit({key:ip})).success)return json({error:'Please wait a minute before asking another question.'},429);
  const output=await env.AI.run('@cf/meta/llama-3.2-3b-instruct',{
   messages:[{role:'system',content:instruction+' '+tutorInstructions[parsed.style]},...parsed.messages],max_tokens:400
  });
  if(!('response' in output)||typeof output.response!=='string'||!output.response.trim())throw new Error('Empty response');
  return json({answer:output.response.trim()});
 }catch{return json({error:'The tutor could not answer right now. Please try again.'},503)}
}
