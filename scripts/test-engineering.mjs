import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
let source=await fs.readFile('lib/model.ts','utf8');
for(const [symbol,path] of [['seed','seed-plan.json'],['roster','qa-roster.json'],['engineeringRoster','engineering-roster.json']])source=source.replace(`import ${symbol} from '../${path}';`,`const ${symbol}=${await fs.readFile(path,'utf8')};`);
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const m=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
let p=m.clone(m.seedPlan);m.validate(p);
assert.equal(p.engRoster.length,30);assert.equal(p.engRoster.filter(r=>r.status!=='Open').length,28);assert.equal(p.engRoster.filter(r=>r.status==='Open').length,2);assert.equal(m.engMembers(p).length,27);
for(const [part,count] of [['LEAP',18],['FLOW',8],['PRIME',3]])assert.equal(p.engRoster.filter(r=>r.product.includes(part)).length,count);
for(const [designation,count] of [['Tech Lead',6],['Principal Software Engineer',1],['Senior Software Engineer',4],['Software Engineer',10],['Associate Software Engineer',6]])assert.equal(p.engRoster.filter(r=>r.status!=='Open'&&r.designation===designation).length,count);
assert.equal(p.engRoster.filter(r=>r.status==='Active — details pending').length,21);assert(p.engRoster.every(r=>r.employment==='Not specified'));
assert.deepEqual(['dev_manager','tech_lead','developer','l3_support'].map(k=>m.engMembers(p,k).length),[0,6,12,9]);
assert.equal(p.sprints[0].eng,27);assert.equal(p.sprints[0].l3,9);assert(m.startChecks(p,0).includes('Review Engineering roster and allocations'));
const id='eng-amsaveni';const baseQA=m.calculate(p).sprints[0].qaResult;
p.sprints[0].engLeaveMode='Calendar leave';p.sprints[0].engReviewed=true;p.sprints[0].qaLeaveMode='Calendar leave';p.sprints[0].goal='Test goal';
let calculated=m.calculate(p).sprints[0];assert.equal(calculated.engResult.gross,2160);assert.equal(calculated.engResult.indicative,1944);
const before=m.clone(p);m.storeLeave(p,{id:'eng-half',personId:id,start:'2026-11-11',end:'2026-11-11',fraction:.5,kind:'Planned',note:''});m.validate(p);
assert.equal(m.calculate(p).sprints[0].engResult.available,2156);assert.equal(m.calculate(p).sprints[0].engResult.indicative,1940.4);assert.deepEqual(m.calculate(p).sprints[0].qaResult,m.calculate(before).sprints[0].qaResult);
assert.throws(()=>m.storeLeave(p,{...p.leaves[0],id:'duplicate',fraction:.5}),/already has leave/);
assert.throws(()=>m.storeLeave(p,{...p.leaves[0],id:'head',personId:'eng-head'}),/active resource/);
assert.throws(()=>m.storeLeave(p,{...p.leaves[0],id:'open',personId:'eng-arthur-vacancy-1'}),/active resource/);
m.storeLeave(p,{...p.leaves[0],start:'2026-11-23',end:'2026-11-26',fraction:1});assert.equal(m.calendarLeave(p,id,0),2);assert.equal(m.calendarLeave(p,id,1),2);
assert.equal(p.sprints[1].engLeaveMode,'Calendar leave');assert.equal(p.sprints[1].qaLeaveMode,before.sprints[1].qaLeaveMode);
p.leaves=[];assert.equal(m.calculate(p).sprints[0].engResult.indicative,1944);
// Allocation affects gross and leave exactly once; vacancies stay at zero.
p.sprints[0].engPeople[id].allocation=.5;m.storeLeave(p,{id:'allocated',personId:id,start:'2026-11-11',end:'2026-11-11',fraction:1,kind:'Planned',note:''});
assert.equal(m.engRows(p,0).find(x=>x.id===id).gross,40);assert.equal(m.engRows(p,0).find(x=>x.id===id).leave,.5);assert.equal(m.engRows(p,0).find(x=>x.id==='eng-arthur-vacancy-1').gross,0);
const bad=m.clone(p);bad.sprints[0].engPeople[id].allocation=1.5;assert.throws(()=>m.validate(bad),/Engineering allocation/);
// Active unplanned leave revises capacity; current baseline and locks remain intact.
const planned=m.clone(p);m.transitionSprint(p,0,'Active');m.checkLifecycle(planned,p);const baseline=m.clone(p),available=m.calculate(p).sprints[0].engResult.available;
m.storeLeave(p,{id:'surprise',personId:'eng-arthur',start:'2026-11-12',end:'2026-11-12',fraction:.5,kind:'Unplanned',note:''});m.checkLifecycle(baseline,p);assert.equal(m.calculate(p).sprints[0].engResult.available,available-4);assert.equal(m.calculate(p).sprints[0].engResult.baselineAvailable,available);
const edit=m.clone(p);edit.engRoster[1].name='Changed';assert.throws(()=>m.checkLifecycle(p,edit),/Shared settings/);
const active=m.clone(p);m.transitionSprint(p,0,'Ended');m.checkLifecycle(active,p);const frozen=m.calculate(p).sprints[0].engResult;p.engRoster[1].status='Excluded';m.checkLifecycle(m.clone(p),p);assert.deepEqual(m.calculate(p).sprints[0].engResult,frozen);
// Existing started aggregate sprints retain all original staffing and capacity.
const old=m.clone(m.seedPlan);delete old.engRoster;for(const s of old.sprints){delete s.engMode;delete s.engPeople;delete s.engReviewed;delete s.engLeaveMode;}old.sprints[0].status='Ended';old.sprints[0].eng=30;old.sprints[0].techLead=3;old.sprints[0].l3=0;old.sprints[0].roles.forEach(r=>r.estimated=0);
const migrated=m.migratePlan(old);assert.equal(migrated.sprints[0].engMode,'Legacy');assert.equal(migrated.sprints[0].eng,30);assert.equal(m.calculate(migrated).sprints[0].engResult.gross,2400);assert.equal(migrated.sprints[1].engMode,'Roster');m.validate(migrated);
assert.deepEqual(m.migratePlan(migrated),migrated);
const next=m.appendSprint(migrated,'New sprint','Goal','2027-02-03','2027-02-16');assert.equal(next.engMode,'Roster');assert.equal(next.eng,27);assert.equal(next.engReviewed,false);assert.equal(next.engLeaveMode,'Calendar leave');
// Actual hours include Engineering resource identities and capacity.
globalThis.__engineeringModel=m;
let insightSource=await fs.readFile('lib/insights.ts','utf8');insightSource=insightSource.replace(/import .* from '.\/model';/, 'const {qaRows,engRows}=globalThis.__engineeringModel;');
const insights=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(insightSource,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const actualPlan=m.clone(m.seedPlan);actualPlan.sprints[0].engLeaveMode='Calendar leave';actualPlan.sprints[0].actuals=[{personId:id,name:'Amsaveni',designation:'Tech Lead',team:'Engineering',planned:8,adhoc:2,other:0,note:''}];const effort=insights.effortRows(actualPlan,0).find(r=>r.id===id);assert.equal(effort.team,'Engineering');assert.equal(effort.capacity,72);assert.equal(effort.total,10);assert.equal(effort.source,'Manual total');
console.log('PASS: Engineering chart reconciliation, no duplicate leaders, vacancies/Head exclusion, migration, individual leave/allocation, cross-sprint ranges, active unplanned baseline, historical locks, new sprints and Engineering actuals.');
