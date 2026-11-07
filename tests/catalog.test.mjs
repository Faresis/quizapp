import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {loadCatalog} from '../scripts/content.mjs';
import {compileCatalog,canonicalJson} from '../lib/catalog.mjs';
import {api} from '../server/api.mjs';
import {d1} from '../scripts/d1-test-adapter.mjs';
const digest=s=>createHash('sha256').update(s).digest('hex');
const base=await loadCatalog();
const files=()=>structuredClone([
 ...base.tests.map(e=>({file:e.source,data:{id:e.id,kind:e.kind,title:e.title,description:e.description,revision:e.revision,definition:e.definition}})),
 ...base.sessions.map(e=>({file:e.source,data:Object.fromEntries(['id','kind','title','description','revision','session_kind','collect_ratings','instructions','rounds'].map(k=>[k,e[k]]))})),
 ...base.courses.map(e=>({file:e.source,data:Object.fromEntries(['id','kind','title','description','revision','steps'].map(k=>[k,e[k]]))}))
]);
function fixture(content=base){
 const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');
 for(const tag of JSON.parse(readFileSync(new URL('../drizzle/meta/_journal.json',import.meta.url))).entries.map(e=>e.tag))sql.exec(readFileSync(new URL('../drizzle/'+tag+'.sql',import.meta.url),'utf8'));
 for(const [id,role] of [['parentA','parent'],['parentB','parent'],['childA','child'],['childB','child'],['admin','admin']]){
  sql.prepare('INSERT INTO users (id,username,name,role,password_hash,must_change,created_at) VALUES (?,?,?,?,?,0,?)').run(id,id.toLowerCase(),id,role,'unused',Date.now());
  sql.prepare('INSERT INTO sessions VALUES (?,?,?)').run(digest('session-'+id),id,Date.now()+1000000);
 }
 const env={DB:d1(sql),CONTENT_CATALOG:content};
 async function call(path,body,who='parentA'){
  const headers={};if(who)headers.cookie='clearpath_session=session-'+who;if(body!==undefined)headers['content-type']='application/json';
  const r=await api(new Request('https://example.test'+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)}),env);
  return {status:r.status,data:await r.json()};
 }
 return {sql,env,call};
}
function assignment(kind='test',id='arithmetic-starter',extra={}){
 const e=base[kind==='course'?'courses':kind==='session'?'sessions':'tests'].find(e=>e.id===id);
 return {kind,content_id:id,fingerprint:e.fingerprint,child_ids:['childA'],start_date:'2026-11-09',timezone:'America/Los_Angeles',request_id:'request-'+kind,...extra};
}

test('repository catalog compiles deterministically and cascades definition changes into course fingerprints',()=>{
 const a=compileCatalog(files(),digest),b=compileCatalog([...files()].reverse(),digest);assert.equal(a.fingerprint,b.fingerprint);
 const changed=files();changed.find(e=>e.data.id==='focus-match-relaxed').data.definition.questions[0].prompt+=' Updated instructions.';
 const c=compileCatalog(changed,digest);assert.notEqual(c.sessions[0].fingerprint,a.sessions[0].fingerprint);assert.notEqual(c.courses[0].fingerprint,a.courses[0].fingerprint);
 assert.equal(canonicalJson({b:1,a:2}),canonicalJson({a:2,b:1}));
});

test('content validation rejects invalid data, duplicate IDs, missing references and unsafe generators',()=>{
 const bad=mutation=>{const input=files();mutation(input);assert.throws(()=>compileCatalog(input,digest));};
 bad(a=>a.push(structuredClone(a[0])));
 bad(a=>a[0].data.revision=0);
 bad(a=>a[0].data.child_id='private-learner');
 bad(a=>a.find(e=>e.data.kind==='session').data.rounds=['missing','focus-match-timed']);
 bad(a=>a.find(e=>e.data.kind==='course').data.steps=[{type:'course',ref:'focus-first-week',day_offset:0}]);
 bad(a=>a.find(e=>e.data.kind==='course').data.steps=[{type:'test',ref:'missing',day_offset:0}]);
 bad(a=>a.find(e=>e.data.kind==='session').data.rounds=['focus-match-timed','focus-inhibition']);
 bad(a=>a[0].data.definition.questions[0].answer_key=['not-an-option']);
 bad(a=>{delete a[0].data.definition;a[0].data.generator={type:'eval',config:{source:'process.exit()'}}});
 bad(a=>{delete a[0].data.definition;a[0].data.generator={type:'focus_pair',round:'timed',config:{seed:'unsafe',confusable_groups:['I1l']}}});
 const dir=mkdtempSync(join(tmpdir(),'clearpath-content-'));writeFileSync(join(dir,'broken.json'),'{');return assert.rejects(loadCatalog(dir),/broken.json: invalid JSON/).finally(()=>rmSync(dir,{recursive:true}));
});

test('catalog discovery is authenticated and child metadata never contains definitions or answer keys',async()=>{
 const f=fixture();assert.equal((await f.call('/api/catalog',undefined,null)).status,401);
 const child=await f.call('/api/catalog',undefined,'childA');assert.equal(child.status,200);assert.ok(child.data.tests.length>=4);assert.ok(!JSON.stringify(child.data).includes('answer_key'));assert.ok(!JSON.stringify(child.data).includes('options'));
 assert.equal((await f.call('/api/catalog/definition?kind=test&id=arithmetic-starter',undefined,'childA')).status,403);
 assert.equal((await f.call('/api/catalog/definition?kind=test&id=arithmetic-starter')).data.definition.questions[0].answer_key[0],'b');
});

test('catalog assignment snapshots a quiz, supports retries and retains normal child reports',async()=>{
 const f=fixture();const body=assignment();let result=await f.call('/api/catalog/assign',body);assert.equal(result.status,201,JSON.stringify(result.data));
 const again=await f.call('/api/catalog/assign',body,'parentB');assert.equal(again.data.replayed,true);assert.equal(f.sql.prepare('SELECT count(*) n FROM assignments').get().n,1);
 const as=(await f.call('/api/assignments',undefined,'childA')).data.assignments;assert.equal(as.length,1);assert.equal(as[0].due_date,body.start_date);
 assert.equal((await f.call('/api/assignments',undefined,'childB')).data.assignments.length,0);
 const started=await f.call('/api/attempts/start',{assignment_id:as[0].id},'childA');assert.equal(started.status,201);assert.ok(!JSON.stringify(started.data).includes('answer_key'));
 const submitted=await f.call('/api/attempt/action',{attempt_id:started.data.id,revision:started.data.revision,type:'submit'},'childA');assert.equal(submitted.status,200);
 assert.equal((await f.call('/api/catalog/enrollments',undefined,'childA')).data.enrollments[0].completed,1);
 assert.equal((await f.call('/api/report?id='+started.data.id,undefined,'parentB')).status,200);
 assert.equal((await f.call('/api/catalog/enrollments',undefined,'childB')).data.enrollments.length,0);
});

test('course enrollment schedules dated sessions and exercises, with fixed session rules and shared parents',async()=>{
 const f=fixture();const r=await f.call('/api/catalog/assign',assignment('course','focus-first-week',{child_ids:['childA','childB']}));assert.equal(r.status,201,JSON.stringify(r.data));
 assert.equal(f.sql.prepare('SELECT count(*) n FROM catalog_enrollments').get().n,2);
 assert.equal(f.sql.prepare('SELECT count(*) n FROM assignments').get().n,6);
 const sessions=(await f.call('/api/focus/sessions',undefined,'childA')).data.sessions;assert.equal(sessions.length,1);assert.equal(sessions[0].duration_ms,1500000);assert.equal(sessions[0].scheduled_for,'2026-11-09');assert.equal(sessions[0].data.catalog_instructions,base.sessions[0].instructions);
 const courses=(await f.call('/api/catalog/enrollments',undefined,'childA')).data.enrollments;assert.equal(courses[0].total,3);assert.deepEqual(courses[0].items.map(x=>x.due_date),['2026-11-09','2026-11-09','2026-11-10']);
 assert.equal((await f.call('/api/catalog/enrollments',undefined,'parentB')).data.enrollments.length,2);
 const aid=courses[0].items[0].assignment_id;assert.equal((await f.call('/api/attempts/start',{assignment_id:aid},'childA')).status,403);
 assert.equal((await f.call('/api/focus/session/action',{session_id:sessions[0].id,type:'start'},'childB')).status,404);
 assert.equal((await f.call('/api/focus/session/action',{session_id:sessions[0].id,type:'start'},'childA')).status,200);
 assert.equal((await f.call('/api/attempts/start',{assignment_id:aid},'childA')).status,201);
 assert.deepEqual(f.sql.prepare('PRAGMA foreign_key_check').all(),[]);
});

test('deploying edited, removed or rolled-back content never rewrites an existing assignment or score',async()=>{
 const f=fixture();await f.call('/api/catalog/assign',assignment());const old=f.sql.prepare('SELECT * FROM versions').get();
 const a=(await f.call('/api/assignments',undefined,'childA')).data.assignments[0];const attempt=(await f.call('/api/attempts/start',{assignment_id:a.id},'childA')).data;await f.call('/api/attempt/action',{attempt_id:attempt.id,revision:attempt.revision,type:'submit'},'childA');const oldAttempt=f.sql.prepare('SELECT * FROM attempts').get();
 const input=files();const quiz=input.find(e=>e.data.id==='arithmetic-starter');quiz.data.title='Revised arithmetic';quiz.data.revision=2;quiz.data.definition.questions[0].prompt='A new prompt';
 f.env.CONTENT_CATALOG=compileCatalog(input,digest);const updated=f.env.CONTENT_CATALOG.tests.find(e=>e.id==='arithmetic-starter');
 assert.equal((await f.call('/api/catalog/assign',assignment())).status,409);
 assert.equal((await f.call('/api/catalog/assign',assignment('test','arithmetic-starter',{fingerprint:updated.fingerprint,request_id:'request-edited'}))).status,201);
 assert.deepEqual(f.sql.prepare('SELECT * FROM versions WHERE id=?').get(old.id),old);assert.deepEqual(f.sql.prepare('SELECT * FROM attempts WHERE id=?').get(oldAttempt.id),oldAttempt);
 f.env.CONTENT_CATALOG={...f.env.CONTENT_CATALOG,tests:[]};assert.equal((await f.call('/api/catalog/enrollments',undefined,'childA')).data.enrollments.length,2);assert.equal((await f.call('/api/report?id='+attempt.id)).status,200);
 f.env.CONTENT_CATALOG=base;assert.equal((await f.call('/api/catalog/assign',assignment('test','arithmetic-starter',{request_id:'request-rollback'}))).status,201);assert.equal(f.sql.prepare('SELECT count(*) n FROM versions').get().n,2);
});

test('assignment validation rejects children, stale content, bad dates and conflicting retries without writes',async()=>{
 const f=fixture();assert.equal((await f.call('/api/catalog/assign',assignment(),'childA')).status,403);
 for(const [extra,status] of [[{fingerprint:'stale'},409],[{start_date:'2026-02-30'},400],[{timezone:'no-timezone'},400],[{child_ids:['missing']},403],[{child_ids:[]},400],[{request_id:'x'},400]])assert.equal((await f.call('/api/catalog/assign',assignment('test','arithmetic-starter',extra))).status,status);
 assert.equal(f.sql.prepare('SELECT count(*) n FROM assignments').get().n,0);
 await f.call('/api/catalog/assign',assignment());assert.equal((await f.call('/api/catalog/assign',assignment('test','arithmetic-starter',{start_date:'2026-11-11'}))).status,409);assert.equal(f.sql.prepare('SELECT count(*) n FROM assignments').get().n,1);
});

test('assignment batches roll back completely on storage failure',async()=>{
 const f=fixture();f.sql.exec("CREATE TRIGGER reject_catalog_assignment BEFORE INSERT ON assignments BEGIN SELECT RAISE(ABORT,'simulated write failure'); END");
 const r=await f.call('/api/catalog/assign',assignment('course','focus-first-week'));assert.equal(r.status,500);
 for(const table of ['catalog_enrollments','catalog_links','assignments','focus_sessions','tests','versions'])assert.equal(f.sql.prepare('SELECT count(*) n FROM '+table).get().n,0,table);
});

test('the production Worker loads content after build and blocks runtime authoring without exposing keys as assets',async()=>{
 const {default:worker}=await import('../dist/server/index.js'),f=fixture();
 const get=async(path,body)=>{const headers={cookie:'clearpath_session=session-parentA'};if(body)headers['content-type']='application/json';return worker.fetch(new Request('https://example.test'+path,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined}),{DB:f.env.DB});};
 const catalog=await (await get('/api/catalog')).json();assert.equal(catalog.fingerprint,base.fingerprint);
 for(const path of ['/api/tests','/api/focus/pair','/api/focus/activity','/api/focus/plan'])assert.equal((await get(path,{})).status,409,path);
 for(const path of ['/content/tests/arithmetic-starter.json','/catalog.json'])assert.equal((await get(path)).status,404);
 const js=await (await get('/app.js')).text();assert.ok(!js.includes('Arithmetic warm-up'));
});

test('generic domain sessions use the same catalog and execution flow without focus metadata',async()=>{
 const input=files(),original=input.find(e=>e.data.id==='arithmetic-starter');
 const second=structuredClone(original);second.file='content/tests/arithmetic-second.json';second.data.id='arithmetic-second';second.data.title='More arithmetic';input.push(second);
 input.push({file:'content/sessions/maths-session.json',data:{id:'maths-session',kind:'session',title:'Mathematics practice',description:'A generic domain session.',revision:1,session_kind:'independent',collect_ratings:false,instructions:'Work at a comfortable pace.',rounds:['arithmetic-starter','arithmetic-second']}});
 const content=compileCatalog(input,digest),session=content.sessions.find(s=>s.id==='maths-session');assert.equal(session.target_skill,'domain:mathematics');
 const f=fixture(content);assert.equal((await f.call('/api/catalog/assign',{...assignment(),kind:'session',content_id:session.id,fingerprint:session.fingerprint})).status,201);
 const sessions=(await f.call('/api/focus/sessions',undefined,'childA')).data.sessions;assert.equal(sessions.length,1);assert.equal(sessions[0].duration_ms,480000);
 assert.equal((await f.call('/api/focus/monthly?month=2026-11')).data.scheduled,0);
 await f.call('/api/focus/session/action',{session_id:sessions[0].id,type:'start'},'childA');assert.equal((await f.call('/api/attempts/start',{assignment_id:sessions[0].rounds[0].assignment_id},'childA')).status,201);
});
