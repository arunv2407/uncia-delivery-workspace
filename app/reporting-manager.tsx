'use client';
import {useId} from 'react';
import {type Plan} from '../lib/model';
import {reportingManagers} from '../lib/roster-fields';
import {useEditorLock} from './editor-lock';
export default function ReportingManager({plan,resourceId,onChange}:{plan:Plan;resourceId:string;onChange:(name:string)=>void}){
 const id=useId(),disabled=useEditorLock(),person=[...plan.engRoster,...plan.qaRoster].find(r=>r.id===resourceId)!;
 return <><input disabled={disabled} list={id} aria-label={`${resourceId} reporting manager`} value={person.lead} placeholder="Select or enter manager" onChange={e=>onChange(e.target.value)}/><datalist id={id}>{reportingManagers(plan,resourceId).map(name=><option key={name} value={name}/>)}</datalist></>;
}
