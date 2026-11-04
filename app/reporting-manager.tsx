'use client';
import {type Plan} from '../lib/model';
import {reportingManagers} from '../lib/roster-fields';
import {useEditorLock} from './editor-lock';
export default function ReportingManager({plan,resourceId,onChange}:{plan:Plan;resourceId:string;onChange:(name:string)=>void}){
 const disabled=useEditorLock(),person=[...plan.engRoster,...plan.qaRoster].find(r=>r.id===resourceId)!,options=reportingManagers(plan,resourceId);
 return <select disabled={disabled} aria-label={`${resourceId} reporting manager`} value={person.lead} onChange={e=>onChange(e.target.value)}><option value="">Select reporting manager</option>{person.lead&&!options.includes(person.lead)&&<option value={person.lead}>{person.lead} (current)</option>}{options.map(name=><option key={name} value={name}>{name}</option>)}</select>;
}
