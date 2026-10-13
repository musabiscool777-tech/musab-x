import {githubAccount} from './github-auth';
import { env } from 'cloudflare:workers';
export function json(value:unknown,status=200){return Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
export function db(){if(!env.DB)throw new Error('Account storage is unavailable');return env.DB}
export function isOwnerEmail(email:string){return !!env.OWNER_EMAIL && email.toLowerCase()===env.OWNER_EMAIL.toLowerCase()}
export function checkWrite(r:Request){const origin=r.headers.get('origin');if(origin!==new URL(r.url).origin)throw new Error('Request origin is invalid');if(!r.headers.get('content-type')?.includes('application/json'))throw new Error('JSON is required')}
export function isOwnerAccount(a:{id:string,email:string}){return env.AUTH_MODE==='github'?a.id==='github:'+env.OWNER_GITHUB_ID:isOwnerEmail(a.email)}
export async function account(r:Request){if(env.AUTH_MODE==='github')return githubAccount(r,env);const id=r.headers.get('oai-authenticated-user-id'),email=r.headers.get('oai-authenticated-user-email');if(!id||!email)throw new Error('Sign in to continue');let name=r.headers.get('oai-authenticated-user-full-name')||email.split('@')[0];if(r.headers.get('oai-authenticated-user-full-name-encoding')==='percent-encoded-utf-8'){try{name=decodeURIComponent(name)}catch{}}
// Only the configured owner receives initial administrator access.
await db().prepare('INSERT OR IGNORE INTO accounts (id,email,name,role,created) VALUES (?,?,?,?,?)').bind(id,email,name,isOwnerEmail(email)?'admin':'member',new Date().toISOString()).run();const row=await db().prepare('SELECT * FROM accounts WHERE id=?').bind(id).first<any>();if(row.disabled)throw new Error('This account is disabled');return row}
export async function body(r:Request){if(Number(r.headers.get('content-length')||0)>160000)throw new Error('Data is too large');const raw=await r.text();if(raw.length>160000)throw new Error('Data is too large');return JSON.parse(raw)}
