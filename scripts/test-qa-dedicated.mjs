import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
let source=await fs.readFile('lib/model.ts','utf8');
for(const [symbol,path] of [['seed','seed-plan.json'],['roster','qa-roster.json'],['engineeringRoster','engineering-roster.json']])source=source.replace(`import ${symbol} from '../${path}';`,`const ${symbol}=${await fs.readFile(path,'utf8')};`);
const options={module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022};
const load=async code=>import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(code,{compilerOptions:options}).outputText).toString('base64'));
const m=await load(source),a=await load(await fs.readFile('lib/assignments.ts','utf8'));
const p=m.clone(m.seedPlan);m.validate(p);
assert.equal(m.qaMembers(p).length,13,'Company QA roster is retained');
assert.deepEqual(m.qaRows(p,0).filter(r=>r.allocation>0).map(r=>r.id).sort(),['parthiban','rajkumar']);
assert.equal(p.sprints[0].qaPeople.parthiban.allocation,.875);assert.equal(p.sprints[0].qaPeople.rajkumar.allocation,.875);
assert.equal(m.calculate(p).sprints[0].qa,2);assert.equal(m.calculate(p).sprints[0].qaResult.gross,140);assert.equal(m.calculate(p).sprints[0].qaResult.indicative,126);
assert.equal(m.calculate(p).sprints[0].roles[4].people,0);assert.equal(m.calculate(p).sprints[0].roles[5].people,1);assert.equal(m.calculate(p).sprints[0].roles[6].people,1);
assert(!p.qaRoster.some(r=>r.seniority==='Engineer / Tester'));assert.equal(p.qaRoster.find(r=>r.id==='rachappa').role,'qa_manager');
const withLeave=m.clone(p);
m.storeLeave(withLeave,{id:'dedicated',personId:'rajkumar',start:'2026-11-11',end:'2026-11-11',fraction:.5,kind:'Planned',note:''});
assert.equal(m.calculate(withLeave).sprints[0].qaResult.available,136.5);
m.storeLeave(withLeave,{id:'outside',personId:'nivedha',start:'2026-11-11',end:'2026-11-11',fraction:1,kind:'Planned',note:''});
assert.equal(m.calculate(withLeave).sprints[0].qaResult.available,136.5,'Unallocated QA leave does not reduce sprint capacity');
// Migration runs once and preserves later explicit allocation adjustments.
const edited=m.clone(p);edited.sprints[0].qaPeople.nivedha.allocation=.5;
assert.equal(m.migratePlan(edited).sprints[0].qaPeople.nivedha.allocation,.5);
assert.deepEqual(m.migratePlan(p),p);
const future=m.appendSprint(edited,'Next sprint','Goal','2027-02-03','2027-02-16');
assert.equal(future.qaPeople.nivedha.allocation,0);assert.equal(future.qaPeople.parthiban.allocation,.875);assert.equal(future.qaPeople.rajkumar.allocation,.875);
// Started historical baselines are not reassigned or recalculated as two people.
const legacy=m.clone(p);for(const sprint of legacy.sprints){delete sprint.qaAssignmentVersion;sprint.qa=13;sprint.qaManager=1;sprint.qaLead=3;sprint.qaLeaveMode='Role estimates';Object.values(sprint.qaPeople).forEach(x=>x.allocation=1);}
legacy.sprints[0].status='Ended';legacy.sprints[0].lockedContext=m.clone({engRoster:legacy.engRoster,qaRoster:legacy.qaRoster,holidays:legacy.holidays,stageDays:legacy.stageDays,leaves:legacy.leaves});
const before=m.calculate(legacy).sprints[0].qaResult,upgraded=m.migratePlan(legacy);
assert.deepEqual(m.calculate(upgraded).sprints[0].qaResult,before);assert.equal(upgraded.sprints[0].qaPeople.nivedha.allocation,1);assert.equal(upgraded.sprints[1].qaPeople.nivedha.allocation,0);
// Old combined/Cross-product labels become independent selections; client
// compatibility is the union of all selected products.
assert.deepEqual(a.productIds('Cross-product'),['prime','leap','flow']);
assert.deepEqual(a.productIds('UNCIA LEAP; UNCIA FLOW'),['leap','flow']);
a.addClient(p,'Demo LMS',['leap']);a.addClient(p,'Demo shared',['leap','flow']);
const person=p.qaRoster.find(r=>r.id==='rajkumar');person.client='Demo LMS; Demo shared';
a.setResourceProducts(p,'rajkumar',['leap','flow']);assert.deepEqual(a.productIds(person.product),['leap','flow']);assert.equal(person.client,'Demo LMS; Demo shared');
a.setResourceProducts(p,'rajkumar',['flow']);assert.equal(person.client,'Demo shared');
a.setResourceProducts(p,'rajkumar',[]);assert.equal(person.client,'');assert.equal(person.product,'');
assert.throws(()=>a.setResourceProducts(p,'rajkumar',['new-product']),/existing products/);
a.setResourceProducts(p,'eng-amsaveni',['prime','flow']);assert.deepEqual(a.productIds(p.engRoster.find(r=>r.id==='eng-amsaveni').product),['prime','flow']);
console.log('PASS: two dedicated QA resources, one-time planned migration, frozen history, new sprint defaults, leave/zero allocation, QA Engineer wording and product multi-select/client compatibility.');
// Work share and buffer are independent deductions; shared buffer freezes at start.
const configurable=m.clone(m.seedPlan);configurable.buffer=.2;configurable.sprints[0].qaPeople.parthiban.allocation=.5;
assert.equal(m.qaRows(configurable,0).find(r=>r.id==='parthiban').gross,40);
assert.equal(m.qaRows(configurable,0).find(r=>r.id==='parthiban').indicative,32);
assert.equal(m.calculate(configurable).sprints[0].qaResult.indicative,88);
for(const value of [-.01,1.01,NaN]){const invalid=m.clone(configurable);invalid.buffer=value;assert.throws(()=>m.validate(invalid),/buffer/);}
configurable.sprints[0].goal='Validated capacity';configurable.sprints[0].engLeaveMode='Calendar leave';configurable.sprints[0].engReviewed=true;
m.transitionSprint(configurable,0,'Active');assert.equal(configurable.sprints[0].lockedContext.buffer,.2);
const beforeBuffer=m.clone(configurable),illegal=m.clone(configurable);illegal.buffer=.3;assert.throws(()=>m.checkLifecycle(beforeBuffer,illegal),/Shared settings/);
m.transitionSprint(configurable,0,'Ended');const frozenBuffer=m.calculate(configurable).sprints[0].qaResult;
configurable.buffer=0;assert.deepEqual(m.calculate(configurable).sprints[0].qaResult,frozenBuffer);
assert.equal(m.qaRows(configurable,0).find(r=>r.id==='parthiban').indicative,32);
console.log('PASS: sprint work share, configurable buffer validation, one deduction and immutable started buffer baseline.');
