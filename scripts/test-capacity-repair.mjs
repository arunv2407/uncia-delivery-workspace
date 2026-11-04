import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
const load=async code=>import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
let source=await fs.readFile('lib/model.ts','utf8');
for(const [symbol,path] of [['seed','seed-plan.json'],['roster','qa-roster.json'],['engineeringRoster','engineering-roster.json']])source=source.replace(`import ${symbol} from '../${path}';`,`const ${symbol}=${await fs.readFile(path,'utf8')};`);
const m=await load(source);globalThis.__capacityModel=m;
const repair=await load((await fs.readFile('lib/capacity-repair.ts','utf8')).replace(/import .* from '.\/model';/, 'const {clone,validate,checkLifecycle,syncEngineering}=globalThis.__capacityModel;'));
const p=m.clone(m.seedPlan);p.buffer=0;p.leaves=[];
for(const x of Object.values(p.sprints[0].engPeople))x.allocation=0;
const rates=[2,5,6,6,5,5,2,2,2,2,2,2,2,2],people=m.engMembers(p).slice(0,14);
people.forEach((r,i)=>p.sprints[0].engPeople[r.id].allocation=rates[i]/8);
p.sprints[0].engLeaveMode='Role estimates';p.sprints[0].roles.forEach(r=>r.estimated=0);p.sprints[0].roles.find(r=>r.key==='tech_lead').estimated=1;p.sprints[0].roles.find(r=>r.key==='developer').estimated=6;
p.sprints[0].qaPeople.kishan.allocation=.875;
p.sprints[0].goal='Approved goal';p.sprints[0].engReviewed=true;p.sprints[4].actuals=[{personId:people[0].id,name:'Existing',designation:'Tech Lead',team:'Engineering',planned:2,adhoc:1,other:0,note:''}];
assert.equal(m.calculate(p).sprints[0].engResult.indicative,394,'Reproduce stale pooled leave mismatch');
const fixed=repair.repairCapacityPlan(p),calc=m.calculate(fixed);
for(let i=0;i<3;i++){assert.equal(calc.sprints[i].engResult.indicative,450);assert.equal(calc.sprints[i].qaResult.indicative,210);assert.equal(m.engRows(fixed,i).reduce((a,r)=>a+r.indicative,0),450);assert.equal(calc.sprints[i].eng,14);}
for(let i=3;i<6;i++){assert.equal(calc.sprints[i].engResult.indicative,0);assert.equal(calc.sprints[i].qaResult.indicative,0);assert.equal(calc.sprints[i].eng,0);assert(m.startChecks(fixed,i).length>0);}
assert.deepEqual(fixed.sprints[0].engPeople,p.sprints[0].engPeople);assert.deepEqual(fixed.sprints[0].qaPeople,p.sprints[0].qaPeople);assert.deepEqual(fixed.leaves,p.leaves);assert.deepEqual(fixed.engRoster,p.engRoster);assert.deepEqual(fixed.sprints[4].actuals,p.sprints[4].actuals);assert.deepEqual(fixed.sprints.map(s=>[s.name,s.goal,s.start,s.end]),p.sprints.map(s=>[s.name,s.goal,s.start,s.end]));
assert.deepEqual(repair.repairCapacityPlan(fixed),fixed);fixed.sprints[1].engPeople[people[0].id].allocation=.5;assert.equal(repair.repairCapacityPlan(fixed).sprints[1].engPeople[people[0].id].allocation,.5);
// Dates, leave and buffer remain real inputs, rather than hard-coded totals.
const dated=m.clone(fixed);m.storeLeave(dated,{id:'future-leave',personId:people[0].id,start:dated.sprints[1].start,end:dated.sprints[1].start,fraction:1,kind:'Planned',note:''});assert(m.calculate(dated).sprints[1].engResult.indicative<m.calculate(fixed).sprints[1].engResult.indicative);assert.equal(m.calculate(dated).sprints[0].engResult.indicative,450);
const closed=m.clone(p);closed.sprints[4].status='Ended';const before=m.clone(closed.sprints[4]);assert.deepEqual(repair.repairCapacityPlan(closed).sprints[4],before);
// Persistence uses a scoped compare-and-swap, backups, and rejects stale writes.
const row={data:JSON.stringify(p),version:150,updated_at:'old'},calls=[];const db={prepare(sql){return {bind(...args){return {sql,args};}}},async batch(stmts){calls.push(...stmts);return stmts.map((s,i)=>({meta:{changes:i===1?1:1}}));}};
const saved=await repair.repairSavedCapacity(db,'owner-a',row,p);assert.equal(saved.version,151);assert(JSON.parse(saved.data).dataMaintenance[repair.CAPACITY_REPAIR]);assert.equal(calls.length,3);assert(calls[1].sql.includes('WHERE owner=? AND version=?'));assert.deepEqual(calls[1].args.slice(-2),['owner-a',150]);assert(calls[0].sql.includes('INSERT INTO plan_versions'));assert(calls[2].sql.includes('updated_at=?'));
const stale={...db,async batch(){return [{meta:{changes:0}},{meta:{changes:0}},{meta:{changes:0}}];}};await assert.rejects(()=>repair.repairSavedCapacity(stale,'owner-a',row,p),/changed/);
console.log('PASS: reproduces 394, reconciles 450/210, copies S1 to S2/S3, zeros later capacity, retains dates/leave/actuals/history, idempotence and scoped stale-write protection.');

const grossBase=m.clone(p);grossBase.sprints[0].hours=9;grossBase.sprints[0].engLeaveMode='Calendar leave';assert.equal(m.calculate(grossBase).sprints[0].engResult.indicative,450);assert.equal(m.qaRows(grossBase,0).find(r=>r.id==='kishan').gross,70);const normalized=m.migratePlan(grossBase);assert.equal(normalized.sprints[0].hours,8);assert.deepEqual(normalized.sprints[0].engPeople,grossBase.sprints[0].engPeople);const historic=m.clone(grossBase);historic.sprints[0].status='Ended';assert.equal(m.grossHours(historic.sprints[0]),9);
console.log('PASS: work share uses 8 gross hours regardless of obsolete planned hours, preserves percentages and retains historical baselines.');
