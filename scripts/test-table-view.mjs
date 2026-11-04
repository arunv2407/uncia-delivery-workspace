import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
const load=async path=>import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(await fs.readFile(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const t=await load('lib/table-view.ts'),r=await load('lib/roster-fields.ts');
assert.deepEqual(t.columnOrder([2,2,-1,99,0],4),[2,0,1,3]);assert.deepEqual(t.moveColumn([0,1,2],2,0),[2,0,1]);
assert(t.compareValues('9','100')<0);assert(t.compareValues('87.5%','100%')<0);assert(t.compareValues('Sprint 2','Sprint 10')<0);
assert(t.matchesRow(['Rajkumar','QA','87.5%'],'raj',{1:'qa'}));assert(!t.matchesRow(['Rajkumar','QA'],'raj',{1:'engineering'}));
const p={engRoster:[{id:'a',name:'Alice',lead:'Bob',role:'tech_lead'},{id:'b',name:'Bob',lead:'',role:'dev_manager'}],qaRoster:[{id:'q',name:'QA',lead:'Bob',role:'qa_tester'}]};
r.renameResource(p,'b','Robert');assert.equal(p.qaRoster[0].lead,'Robert');assert.equal(p.engRoster[0].lead,'Robert');
r.setReportingManager(p,'q','Alice');assert.equal(p.qaRoster[0].lead,'Alice');assert.throws(()=>r.setReportingManager(p,'q','QA'),/themselves/i);
assert.equal(r.ENGINEERING_DESIGNATIONS.length,6);
console.log('PASS: column reorder recovery, numeric/natural sorting, combined filters, cross-team manager edits and rename references.');

const managers={engRoster:[{id:'h',name:'Denslyn J',role:'dev_manager',status:'Excluded'},...['Amsaveni','Riyas Mohammed','Priyadharshni Anand Vishal','Arthur','Vignesh Kannan','Aylwin Titus'].map((name,i)=>({id:'lead'+i,name,role:'tech_lead',status:'Active'})),{id:'dev',name:'Developer',role:'developer',status:'Active'}],qaRoster:[]};
assert.equal(r.reportingManagers(managers,'dev').length,7);assert(r.reportingManagers(managers,'dev').includes('Denslyn J'));assert(!r.reportingManagers(managers,'lead0').includes('Amsaveni'));
console.log('PASS: Engineering Head and every Tech Lead appear, excluded head remains selectable, self-reporting is excluded.');
