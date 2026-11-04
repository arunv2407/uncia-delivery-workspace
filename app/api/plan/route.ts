import {cleanSavedJiraData} from '../../../lib/jira-cleanup';
import {env} from 'cloudflare:workers';import {getChatGPTUser} from '../../chatgpt-auth';import {seedPlan,validate,migratePlan,leaveConflict,checkLifecycle} from '../../../lib/model';
export async function GET(){
 const user=await getChatGPTUser();
 if(!user)return Response.json({error:'Sign in to save and load your plan.'},{status:401});
 const db=env.DB;
 if(!db)return Response.json({error:'Saved plans are temporarily unavailable.'},{status:503});
 try {
  let row=await db.prepare('SELECT data,version,updated_at FROM plans WHERE owner = ?').bind(user.userId).first<{data:string;version:number;updated_at:string}>();
  let cleaned=false;
  if(row){const result=await cleanSavedJiraData(db,user.userId,row);row=result.row;cleaned=result.changed;}
  const plan=migratePlan(row?JSON.parse(row.data):seedPlan);
  return Response.json({plan,upgraded:row?JSON.stringify(JSON.parse(row.data))!==JSON.stringify(plan):true,revision:row?.version??0,updatedAt:row?.updated_at??null,importMessage:cleaned?'Jira data cleared from this plan and saved history. You can import a new report when ready.':''},{headers:{'Cache-Control':'no-store'}});
 }catch(error){return Response.json({error:error instanceof Error?error.message:'Unable to load saved plan'},{status:409});}
}
export async function PUT(request:Request){const user=await getChatGPTUser();if(!user)return Response.json({error:'Please sign in.'},{status:401});if(request.headers.get('origin')&&new URL(request.url).origin!==request.headers.get('origin'))return Response.json({error:'Invalid origin'},{status:403});try{const raw=await request.text();if(raw.length>8000000)return Response.json({error:'Plan is too large'},{status:413});const body=JSON.parse(raw),plan=validate(body.plan),rev=body.revision;if(!Number.isInteger(rev)||rev<0)throw new Error('Invalid revision');const db=env.DB;if(!db)return Response.json({error:'Saved plans unavailable'},{status:503});const previous=await db.prepare('SELECT data FROM plans WHERE owner = ?').bind(user.userId).first<{data:string}>();
if(previous){const old=JSON.parse(previous.data);plan.dataMaintenance={...plan.dataMaintenance,...old.dataMaintenance};checkLifecycle(migratePlan(old),plan);}
const oldLeaves=previous?JSON.parse(previous.data).leaves??[]:[];
for(const entry of plan.leaves){const old=oldLeaves.find((e:any)=>e.id===entry.id);if((!old||old.personId!==entry.personId||old.start!==entry.start||old.end!==entry.end||old.fraction!==entry.fraction)&&leaveConflict(plan.leaves,entry))throw new Error('This resource already has leave on an overlapping calendar date. Edit or delete the existing booking.');}
const now=new Date().toISOString(),json=JSON.stringify(plan);const stmt=rev===0?db.prepare('INSERT OR IGNORE INTO plans (owner,data,version,updated_at) VALUES (?,?,1,?)').bind(user.userId,json,now):db.prepare('UPDATE plans SET data=?,version=version+1,updated_at=? WHERE owner=? AND version=?').bind(json,now,user.userId,rev);const result=await stmt.run();if(!result.meta.changes)return Response.json({error:'This plan changed in another session. Reload before saving so no edits are overwritten.'},{status:409});await db.prepare('INSERT INTO plan_versions (id,owner,data,version,saved_at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),user.userId,json,rev+1,now).run();return Response.json({revision:rev+1,updatedAt:now});}catch(error){return Response.json({error:error instanceof Error?error.message:'Unable to save plan'},{status:400});}}
