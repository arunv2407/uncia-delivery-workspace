import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
import {DatabaseSync} from 'node:sqlite';

const source = await fs.readFile('lib/jira-cleanup.ts', 'utf8');
const js = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022}}).outputText;
const {withoutJiraData, cleanSavedJiraData, JIRA_RESET} = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
const sqlite = new DatabaseSync(':memory:');
sqlite.exec(await fs.readFile('drizzle/0000_opposite_hellfire_club.sql', 'utf8'));
const manual = [{personId:'demo', name:'Example person', planned:8, adhoc:1, other:0}];
const original = {name:'Example plan', sprints:[{id:'s1', status:'Active', goal:'Keep goal', actuals:manual, issues:[{key:'DEMO-1', summary:'Synthetic import'}], importInfo:{file:'synthetic.csv'}, lockedContext:{leaves:[]}}], leaves:[{id:'leave'}], clients:[{id:'client'}], importInbox:[{id:'example-report',issues:[{key:'DEMO-2'}]}], completedImports:['example-report']};
const db = {
 prepare(sql) {return {sql, params:[], bind(...params) {this.params=params; return this;}};},
 async batch(statements) {
  sqlite.exec('BEGIN');
  try {
   const results=statements.map(s=>{const r=sqlite.prepare(s.sql).run(...s.params);return {meta:{changes:Number(r.changes)}};});
   sqlite.exec('COMMIT');return results;
  } catch(error) {sqlite.exec('ROLLBACK');throw error;}
 }
};
for (const owner of ['owner-a','owner-b']) {
 sqlite.prepare('INSERT INTO plans VALUES (?,?,?,?)').run(owner,JSON.stringify(original),4,'before');
 for (const version of [1,2]) sqlite.prepare('INSERT INTO plan_versions VALUES (?,?,?,?,?)').run(owner+version,owner,JSON.stringify(original),version,'before');
}
const row=sqlite.prepare('SELECT data,version,updated_at FROM plans WHERE owner=?').get('owner-a');
const result=await cleanSavedJiraData(db,'owner-a',row);
assert.equal(result.changed,true);assert.equal(result.row.version,5);
const clean=JSON.parse(result.row.data);
assert.deepEqual(clean.sprints[0].actuals,manual);assert.deepEqual(clean.leaves,original.leaves);assert.deepEqual(clean.clients,original.clients);assert.equal(clean.sprints[0].status,'Active');assert.deepEqual(clean.sprints[0].lockedContext,original.sprints[0].lockedContext);
assert.deepEqual(clean.sprints[0].issues,[]);assert.equal(clean.sprints[0].importInfo,null);assert.deepEqual(clean.importInbox,[]);assert.deepEqual(clean.completedImports,[]);assert.equal(clean.dataMaintenance[JIRA_RESET],true);
for(const history of sqlite.prepare('SELECT data FROM plan_versions WHERE owner=?').all('owner-a'))assert.deepEqual(JSON.parse(history.data),clean);
assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM plan_versions WHERE owner=?').get('owner-a').n,3);
assert.deepEqual(JSON.parse(sqlite.prepare('SELECT data FROM plans WHERE owner=?').get('owner-b').data),original);
assert.deepEqual(JSON.parse(sqlite.prepare('SELECT data FROM plan_versions WHERE owner=? LIMIT 1').get('owner-b').data),original);
const beforeStale=sqlite.prepare('SELECT * FROM plan_versions ORDER BY id').all();
await assert.rejects(()=>cleanSavedJiraData(db,'owner-a',row),/changed during Jira cleanup/);
assert.deepEqual(sqlite.prepare('SELECT * FROM plan_versions ORDER BY id').all(),beforeStale);
// A future, explicitly imported report is retained after the one-time reset.
clean.sprints[0].issues=[{key:'DEMO-NEW'}];
const newRow={...result.row,data:JSON.stringify(clean)};
assert.deepEqual(await cleanSavedJiraData(db,'owner-a',newRow),{row:newRow,changed:false});
assert.deepEqual(original.sprints[0].issues,[{key:'DEMO-1',summary:'Synthetic import'}]);
assert.deepEqual(withoutJiraData({sprints:[],dataMaintenance:{other:true}}).dataMaintenance,{other:true,[JIRA_RESET]:true});
// D1 batch failure must roll back current plan and historical rows together.
sqlite.exec('DROP TABLE plan_versions');
await assert.rejects(()=>cleanSavedJiraData(db,'owner-b',row));
assert.equal(sqlite.prepare('SELECT version FROM plans WHERE owner=?').get('owner-b').version,4);
sqlite.close();
console.log('PASS: Jira cleanup preserves planning/manual actuals, scrubs history, isolates owners, rejects stale updates, rolls back failures and retains future imports.');
