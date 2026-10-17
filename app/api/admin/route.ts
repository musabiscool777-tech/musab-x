import {account,body,checkWrite,db,json,isOwnerAccount} from '../../../lib/core';
type Member={id:string;email:string;name:string;role:string;disabled:number;created:string};
export async function GET(r:Request){try{
 const actor=await account(r);if(actor.role!=='admin')return json({error:'Administrator access required'},403);
 const members=await db().prepare('SELECT id,email,name,role,disabled,created FROM accounts ORDER BY created DESC').all<Member>();
 const activity=await db().prepare('SELECT l.id,l.created,l.old_role,l.new_role,l.old_disabled,l.new_disabled,a.name AS actor_name,t.name AS target_name FROM admin_activity l LEFT JOIN accounts a ON a.id=l.actor_id LEFT JOIN accounts t ON t.id=l.target_id ORDER BY l.created DESC,l.id DESC LIMIT 50').all();
 return json({users:members.results.map(member=>({...member,owner:isOwnerAccount(member)})),activity:activity.results});
}catch(e){return json({error:(e as Error).message},401)}}
export async function PUT(r:Request){try{
 checkWrite(r);const actor=await account(r);if(actor.role!=='admin')return json({error:'Administrator access required'},403);
 const b=await body(r);
 if(typeof b.id!=='string'||b.id.length>100||!['admin','member'].includes(b.role)||typeof b.disabled!=='boolean')return json({error:'Invalid access settings'},400);
 if(b.id===actor.id)return json({error:'You cannot change your own access'},400);
 const target=await db().prepare('SELECT id,email,name,role,disabled,created FROM accounts WHERE id=?').bind(b.id).first<Member>();
 if(!target)return json({error:'Account not found'},404);
 if(isOwnerAccount(target))return json({error:'The owner account cannot be disabled or demoted'},403);
 if(target.role===b.role&&!!target.disabled===b.disabled)return json({ok:true});
 await db().batch([
  db().prepare('UPDATE accounts SET role=?,disabled=? WHERE id=?').bind(b.role,b.disabled?1:0,b.id),
  db().prepare('INSERT INTO admin_activity (id,actor_id,target_id,old_role,new_role,old_disabled,new_disabled,created) VALUES (?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),actor.id,target.id,target.role,b.role,target.disabled?1:0,b.disabled?1:0,new Date().toISOString()),
 ]);
 return json({ok:true});
}catch(e){return json({error:(e as Error).message},400)}}
