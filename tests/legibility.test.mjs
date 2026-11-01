import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {MATCH_ALPHABET,generateFocusPair,displayConcern,summarizeFocusAttempt,compareFocusRounds} from '../lib/focus-engine.mjs';
import {activityTrials,createActivityDefinition,adaptationAdvice,gradeTrial} from '../lib/activity-engine.mjs';

test('all new exact-match generators exclude unverified characters and custom unsafe groups',()=>{
 for(let seed=0;seed<25;seed++){
  for(const t of generateFocusPair({seed:String(seed)}))for(const q of t.questions)for(const text of [q.reference,...q.options.map(o=>o.text)])assert.ok([...text].every(c=>MATCH_ALPHABET.includes(c)),text);
  for(const mode of ['speed_accuracy','pressure_ladder','error_recovery','interruption_recovery']){
   const d=createActivityDefinition({mode,seed:String(seed),trial_count:4});assert.equal(d.activity.alphabet_policy,'clear-v2');
   for(const t of activityTrials(d.activity))assert.ok([...t.stimulus.replace('Reference: ','').replaceAll(/[^A-Za-z0-9]/g,'')].every(c=>MATCH_ALPHABET.includes(c)));
  }
 }
 for(const group of ['Il1','O0o','S5s','B8b','G6g','Z2z','rnm','cld','vw'])assert.throws(()=>generateFocusPair({seed:'bad',confusable_groups:[group]}),/Unverified/);
});

test('legacy protocol generation and outcomes remain byte-for-byte unchanged',()=>{
 const fixtures=JSON.parse(readFileSync(new URL('./legacy-activity-fixtures.json',import.meta.url)));
 for(const {definition,trials} of fixtures){assert.deepEqual(activityTrials(definition.activity),trials);for(const t of trials)assert.equal(gradeTrial(t,t.expected).correct,true);}
});

test('historical display concern preserves stored score but prevents unqualified advice and comparison',()=>{
 const d=generateFocusPair({seed:'history'})[0],data={report:{items:d.questions.map(q=>({question_id:q.id,status:'correct'})),raw_score:8},responses:{},quality:'approximate',novelty:{}};
 const row={id:'attempt',child_id:'child',number:1,data:JSON.stringify(data)};const before=row.data,s=summarizeFocusAttempt(row,d);
 assert.match(s.display_concern,/reported on iPad/);assert.equal(s.correct,8);assert.equal(row.data,before);
 assert.equal(displayConcern({...data,display_profile:'match-v2'},d),null);
 assert.equal(displayConcern(data,{questions:[]}),null);
 assert.equal(adaptationAdvice([s,s,s]).eligible_attempts,0);
 const timed={...s,attempt_id:'timed',focus:{...s.focus,condition:'timed'}};assert.equal(compareFocusRounds(s,timed).comparable,false);
});

function fontContext(fail=false){
 const classes=new Set();let loaded=0;
 const ctx=vm.createContext({setTimeout,clearTimeout,window:{FontFace:true},FontFace:class {status='unloaded';async load(){loaded++;if(fail)throw Error('network');this.status='loaded';return this;}},document:{fonts:{add(){},check(){return true}},documentElement:{classList:{add:c=>classes.add(c)}}}});
 vm.runInContext(readFileSync(new URL('../web/legibility.js',import.meta.url),'utf8'),ctx);
 return {ctx,classes,loaded:()=>loaded};
}
test('font gate requires a successful explicit font load and retries failures without fallback',async()=>{
 const ok=fontContext();await vm.runInContext('ensureMatchFont()',ok.ctx);await vm.runInContext('ensureMatchFont()',ok.ctx);assert.equal(ok.loaded(),1);assert.ok(ok.classes.has('match-font-ready'));
 const bad=fontContext(true);await assert.rejects(vm.runInContext('ensureMatchFont()',bad.ctx),/font unavailable/);assert.ok(!bad.classes.has('match-font-ready'));await assert.rejects(vm.runInContext('ensureMatchFont()',bad.ctx));assert.equal(bad.loaded(),2);
});

test('packaged font is the pinned official binary and served with its correct content type',async()=>{
 const {default:worker}=await import('../dist/server/index.js');const r=await worker.fetch(new Request('https://example.test/fonts/JetBrainsMono-Regular.woff2'),{});
 assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'font/woff2');const bytes=Buffer.from(await r.arrayBuffer());assert.equal(bytes.subarray(0,4).toString(),'wOF2');assert.equal(createHash('sha256').update(bytes).digest('hex'),'a9cb1cd82332b23a47e3a1239d25d13c86d16c4220695e34b243effa999f45f2');
});
