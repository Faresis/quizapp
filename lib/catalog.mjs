import {validateTest} from './quiz-engine.mjs';
import {generateFocusPair} from './focus-engine.mjs';
import {createActivityDefinition} from './activity-engine.mjs';

export function canonicalJson(value){
 if(Array.isArray(value))return '['+value.map(canonicalJson).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).filter(k=>value[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+canonicalJson(value[k])).join(',')+'}';
 return JSON.stringify(value);
}
// Files are data only. Generators are named, built-in functions; never eval source.
export function compileCatalog(files,hash){
 const output={schema_version:1,managed:true,tests:[],sessions:[],courses:[]},ids=new Set();
 const error=(file,message)=>{throw new Error(file+': '+message)};
 for(const {file,data:e} of files){
  if(!e||typeof e!=='object'||Array.isArray(e))error(file,'Expected a content object.');
  if(!/^[a-z][a-z0-9-]{1,79}$/.test(e.id||''))error(file,'Use a stable lowercase id of 2–80 letters, numbers and hyphens.');
  if(ids.has(e.id))error(file,'Duplicate content id '+e.id);ids.add(e.id);
  if(!['test','quiz','exercise','session','course'].includes(e.kind))error(file,'Choose test, quiz, exercise, session or course.');
  if(typeof e.title!=='string'||!e.title.trim()||e.title.length>150)error(file,'Provide a title of at most 150 characters.');
  if(typeof e.description!=='string'||e.description.length>2000)error(file,'Provide a description of at most 2000 characters.');
  if(!Number.isSafeInteger(e.revision)||e.revision<1)error(file,'revision must be a positive integer.');
  const allowed=['id','kind','title','description','revision',...(['test','quiz','exercise'].includes(e.kind)?['definition','generator']:e.kind==='session'?['rounds','session_kind','collect_ratings','instructions']:['steps'])];
  for(const key of Object.keys(e))if(!allowed.includes(key))error(file,'Unsupported field '+key+'; keep learner data and execution state out of content files.');
  const item={...e,source:file};
  if(['test','quiz','exercise'].includes(e.kind)){
   if(!!e.definition===!!e.generator)error(file,'Provide exactly one definition or generator.');
   let d;try{
    if(e.definition)d=structuredClone(e.definition);
    else if(e.generator?.type==='focus_pair'){
     if(!['relaxed','timed'].includes(e.generator.round))error(file,'Choose relaxed or timed round.');
     d=generateFocusPair(e.generator.config||{})[e.generator.round==='relaxed'?0:1];
    }else if(e.generator?.type==='activity')d=createActivityDefinition(e.generator.config||{});
    else error(file,'Unknown generator; use focus_pair or activity.');
    d.title=e.title;const issues=validateTest(d);if(issues.length)error(file,issues.map(x=>x.path+': '+x.message).join('; '));
   }catch(ex){if(ex.message.startsWith(file+': '))throw ex;error(file,ex.message)}
   item.definition=d;delete item.generator;output.tests.push(item);
  }else if(e.kind==='session'){
   if(!['coached','independent','monthly_review'].includes(e.session_kind))error(file,'Unsupported session_kind.');
   if(!Array.isArray(e.rounds)||e.rounds.length<2||e.rounds.length>3||new Set(e.rounds).size!==e.rounds.length)error(file,'A session needs 2–3 distinct test IDs.');
   if(typeof e.collect_ratings!=='boolean'||typeof e.instructions!=='string'||e.instructions.length>2000)error(file,'Provide collect_ratings and short instructions.');
   output.sessions.push(item);
  }else{
   if(!Array.isArray(e.steps)||!e.steps.length||e.steps.length>40)error(file,'A course needs 1–40 steps.');
   for(const step of e.steps)if(!step||!['test','session'].includes(step.type)||typeof step.ref!=='string'||!Number.isInteger(step.day_offset)||step.day_offset<0||step.day_offset>3650||Object.keys(step).some(k=>!['type','ref','day_offset'].includes(k)))error(file,'Each step needs type, ref and day_offset (0–3650).');
   if(e.steps.some((step,i)=>i&&step.day_offset<e.steps[i-1].day_offset))error(file,'Course steps must be ordered by day_offset.');
   output.courses.push(item);
  }
 }
 const testById=new Map(output.tests.map(t=>[t.id,t]));
 for(const t of output.tests)t.fingerprint=hash(canonicalJson({id:t.id,revision:t.revision,kind:t.kind,definition:t.definition}));
 for(const s of output.sessions){
  const rounds=s.rounds.map(id=>testById.get(id));
  if(rounds.some(t=>!t))error(s.source,'A session round references a missing test.');
  if(rounds.every(t=>t.definition.focus)){
   if(new Set(rounds.map(t=>t.definition.focus.target_skill)).size!==1)error(s.source,'Session rounds must have one shared focus skill.');
   s.target_skill=rounds[0].definition.focus.target_skill;
  }else{
   if(rounds.some(t=>t.definition.focus)||new Set(rounds.map(t=>t.definition.domain)).size!==1)error(s.source,'Generic session rounds must share one domain; do not mix generic and focus rounds.');
   s.target_skill='domain:'+rounds[0].definition.domain;
  }
  s.fingerprint=hash(canonicalJson({...s,rounds:rounds.map(t=>t.fingerprint)}));
 }
 const sessions=new Map(output.sessions.map(s=>[s.id,s]));
 for(const course of output.courses){
  const refs=course.steps.map(s=>(s.type==='test'?testById:sessions).get(s.ref));
  if(refs.some(x=>!x))error(course.source,'A course step references missing content or the wrong kind.');
  course.fingerprint=hash(canonicalJson({...course,steps:course.steps.map((s,i)=>({...s,fingerprint:refs[i].fingerprint}))}));
 }
 for(const key of ['tests','sessions','courses'])output[key].sort((a,b)=>a.id.localeCompare(b.id));
 if(output.tests.length>500||output.sessions.length>250||output.courses.length>100)throw new Error('Catalog exceeds bounded content limits.');
 if(JSON.stringify(output).length>5000000)throw new Error('Compiled catalog exceeds 5 MB. Split or reduce published content.');
 output.fingerprint=hash(canonicalJson(output));return output;
}
