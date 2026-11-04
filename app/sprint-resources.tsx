'use client';
import {engRows,qaRows,grossHours,type Plan} from '../lib/model';
const fmt=(n:number|null)=>n===null?'—':n.toLocaleString('en-IN',{maximumFractionDigits:2});
export default function SprintResources({plan,active,team}:{plan:Plan;active:number;team:'Engineering'|'QA'}){
 const s=plan.sprints[active],rows=(team==='Engineering'?engRows(plan,active):qaRows(plan,active)).filter(r=>r.eligible&&r.allocation>0),hours=grossHours(s);
 return <details className="panel qa-context"><summary>{team} · {s.name} · {rows.length} allocated resources</summary><div className="qa-context-grid">{rows.map(r=><div key={r.id}><h3>{r.name}</h3><p>{r.designation}</p><p>{r.product}{r.client?` · ${r.client}`:''}</p><p>Work share: <b>{fmt(r.allocation*100)}%</b> · <b>{fmt(hours*r.allocation)} h/day</b> of {hours} gross hours</p><p>Sprint capacity: <b>{fmt(r.indicative)} h</b></p></div>)}</div>{rows.length===0&&<p className="panel-foot">No resources allocated to {s.name}.{team==='Engineering'&&s.engMode==='Legacy'?' This historical sprint uses aggregate capacity; individual assignments are unavailable.':''}</p>}</details>;
}
