import {clone,validate,checkLifecycle,syncEngineering,type Plan} from './model';
export const CAPACITY_REPAIR='capacity-alignment-2026-11-04';
// User-authorized one-time update. Later edits and started baselines are retained.
export function repairCapacityPlan(plan:Plan){
 if(plan.dataMaintenance?.[CAPACITY_REPAIR])return plan;
 const next=clone(plan),source=next.sprints[0];
 if(source.status!=='Planned')throw Error('Capacity alignment requires Sprint 1 to remain Planned. Started baselines have not been changed.');
 source.engLeaveMode='Calendar leave';source.qaLeaveMode='Calendar leave';
 next.sprints.forEach((s,i)=>{
  if(s.status!=='Planned')return;
  s.engLeaveMode='Calendar leave';s.qaLeaveMode='Calendar leave';
  if(i===1||i===2){s.engMode=source.engMode;s.hours=source.hours;s.engPeople=clone(source.engPeople);s.qaPeople=clone(source.qaPeople);s.roles=clone(source.roles);s.engReviewed=source.engReviewed;s.qaAssignmentVersion=source.qaAssignmentVersion;}
  if(i>=3){s.engMode='Roster';for(const inputs of [s.engPeople,s.qaPeople])for(const x of Object.values(inputs)){x.allocation=0;x.estimated=null;x.confirmed=null;}s.roles.forEach(r=>{r.estimated=null;r.confirmed=null;});s.engReviewed=false;}
  syncEngineering(next,i);
  const assigned=next.qaRoster.filter(r=>r.status.startsWith('Active')&&r.role!=='head'&&(s.qaPeople[r.id]?.allocation??0)>0);
  s.qa=assigned.length;s.qaManager=assigned.filter(r=>r.role==='qa_manager').length;s.qaLead=assigned.filter(r=>r.role==='qa_lead').length;
 });
 next.dataMaintenance={...next.dataMaintenance,[CAPACITY_REPAIR]:true};
 validate(next);checkLifecycle(plan,next);return next;
}
export async function repairSavedCapacity(db:D1Database,owner:string,row:{data:string;version:number;updated_at:string},plan:Plan){
 if(plan.dataMaintenance?.[CAPACITY_REPAIR])return row;
 const next=repairCapacityPlan(plan),json=JSON.stringify(next),now=new Date().toISOString(),version=row.version+1;
 const results=await db.batch([
  db.prepare('INSERT INTO plan_versions (id,owner,data,version,saved_at) SELECT ?,owner,data,version,updated_at FROM plans WHERE owner=? AND version=?').bind(crypto.randomUUID(),owner,row.version),
  db.prepare('UPDATE plans SET data=?,version=version+1,updated_at=? WHERE owner=? AND version=?').bind(json,now,owner,row.version),
  db.prepare('INSERT INTO plan_versions (id,owner,data,version,saved_at) SELECT ?,owner,data,version,updated_at FROM plans WHERE owner=? AND version=? AND updated_at=?').bind(crypto.randomUUID(),owner,version,now)
 ]);
 if(!results[1].meta.changes)throw Error('The plan changed during capacity alignment. Reload to retry without overwriting edits.');
 return {data:json,version,updated_at:now};
}
