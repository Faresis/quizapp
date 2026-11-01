import {validateActivity,activityTrials} from './activity-engine.mjs';
import {validateFocus} from './focus-engine.mjs';
/** Pure, shared policy functions. Server handlers supply authoritative timestamps. */
export const focusSkills = ['selective_attention','sustained_attention','impulse_control','self_monitoring','speed_accuracy','stress_regulation','cognitive_flexibility','interruption_recovery','independent_transfer'];
const types = ['single_select','multi_select','free_text_short','free_text_extended'];
export function validateTest(t) {
  const errors = validateFocus(t?.focus);if(t?.activity){errors.push(...validateActivity(t.activity));if(!Number.isInteger(t.timing?.test_duration_ms)||t.timing.test_duration_ms<1||t.timing.test_duration_ms>1500000)errors.push({path:'timing.test_duration_ms',message:'Stimulus activities require a safety cap of at most 25 minutes.'});}if(t?.focus?.mode&&t.focus.mode!=='near_match'&&!t.activity)errors.push({path:'activity',message:'This mode requires activity configuration.'});
  const add = (path, message) => errors.push({path, message});
  if (!t || typeof t !== 'object' || Array.isArray(t)) return [{path:'$',message:'Expected a test object.'}];
  if (typeof t.title !== 'string' || !t.title.trim()) add('title','A title is required.');
  if (typeof t.domain !== 'string' || !t.domain.trim()) add('domain','A domain is required.');
  if (!['training','assessment'].includes(t.intent)) add('intent','Choose training or assessment.');
  if (!['one_at_a_time','all_at_once'].includes(t.presentation?.mode)) add('presentation.mode','Choose a supported presentation mode.');
  if (!['free','forward_only','sequential_with_back'].includes(t.presentation?.navigation)) add('presentation.navigation','Choose a supported navigation policy.');
  for (const k of ['test_duration_ms','question_duration_ms']) {
    const v=t.timing?.[k];
    if (v != null && (!Number.isSafeInteger(v) || v <= 0)) add(`timing.${k}`,'Duration must be a positive integer or null.');
  }
  if (t.presentation?.mode === 'all_at_once' && t.timing?.question_duration_ms != null) add('timing.question_duration_ms','Per-question timing is unavailable in all-at-once mode.');
  if (t.timing?.pause_policy !== 'not_allowed') add('timing.pause_policy','V1 supports uninterrupted attempts only.');
  const r=t.retry_policy;
  if (typeof r?.retries_allowed !== 'boolean') add('retry_policy.retries_allowed','Specify whether retries are allowed.');
  if (r?.max_attempts != null && (!Number.isInteger(r.max_attempts) || r.max_attempts < 1)) add('retry_policy.max_attempts','Use a positive integer or null.');
  if (r?.retries_allowed === false && r.max_attempts !== 1) add('retry_policy.max_attempts','A no-retry test must allow exactly one attempt.');
  if (r?.cooldown_seconds != null && (!Number.isSafeInteger(r.cooldown_seconds) || r.cooldown_seconds < 0)) add('retry_policy.cooldown_seconds','Use a nonnegative integer.');
  if (!['first','latest','best','all'].includes(r?.report_score)) add('retry_policy.report_score','Choose first, latest, best, or all.');
  if (!['after_attempt','guardian_only','never'].includes(t.feedback?.reveal)) add('feedback.reveal','This first implementation supports after_attempt, guardian_only, or never.');
  if (!Array.isArray(t.questions) || !t.questions.length || t.questions.length > 500) {add('questions','Include between 1 and 500 questions.'); return errors;}
  const ids = new Set();
  t.questions.forEach((q,i) => {
    const p=`questions[${i}]`;
    if (!q || typeof q !== 'object') {add(p,'Expected a question object.'); return;}
    if (typeof q.id !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(q.id) || ['constructor','prototype'].includes(q.id) || ids.has(q.id)) add(`${p}.id`,'Question IDs must be unique, start with a letter/number, and use at most 100 letters, numbers, underscores, or hyphens.');
    ids.add(q.id);
    if (!types.includes(q.type)) add(`${p}.type`,'Unsupported question type.');
    if (typeof q.prompt !== 'string' || !q.prompt.trim()) add(`${p}.prompt`,'Question text is required.');
    if (!Number.isFinite(q.points) || q.points <= 0) add(`${p}.points`,'Points must be positive.');
    if (['single_select','multi_select'].includes(q.type)) {
      const options=q.options;
      if (!Array.isArray(options) || options.length < 2) add(`${p}.options`,'Include at least two options.');
      const opts=new Set();
      for (const [j,o] of (Array.isArray(options)?options:[]).entries()) {
        if (!o || typeof o.id !== 'string' || !o.id || opts.has(o.id) || typeof o.text !== 'string' || !o.text.trim()) add(`${p}.options[${j}]`,'Options need unique IDs and nonempty text.');
        if(o) opts.add(o.id);
      }
      if (!Array.isArray(q.answer_key) || !q.answer_key.length || q.answer_key.some(k=>!opts.has(k)) || new Set(q.answer_key).size !== q.answer_key.length || (q.type==='single_select' && q.answer_key.length!==1)) add(`${p}.answer_key`,'Choose valid, unique correct option IDs.');
    } else if (q.type === 'free_text_short') {
      if (!['exact','normalized','manual_rubric'].includes(q.scoring?.mode)) add(`${p}.scoring.mode`,'Choose exact, normalized, or manual_rubric.');
      if (q.scoring?.mode !== 'manual_rubric' && (!Array.isArray(q.answer_key) || !q.answer_key.length || q.answer_key.some(k=>typeof k!=='string'))) add(`${p}.answer_key`,'Provide accepted text answers.');
      if (q.scoring?.mode === 'normalized' && !q.scoring.normalization) add(`${p}.scoring.normalization`,'Declare normalization explicitly.');
    } else if (q.type==='free_text_extended' && q.scoring?.mode !== 'manual_rubric') add(`${p}.scoring.mode`,'Extended responses require manual review.');
  });
  if(t.activity&&validateActivity(t.activity).length===0){if(t.activity.mode!==t.focus?.mode)add('activity.mode','Activity and focus modes must match.');if(t.questions.length!==t.activity.trial_count)add('questions','Activity question count must match the trial count.');else {const plan=activityTrials(t.activity);if(t.questions.some((q,i)=>q.id!==plan[i].id||q.prompt!==plan[i].stimulus||q.answer_key?.length!==1||q.answer_key[0]!==plan[i].expected))add('questions','Activity questions must match the generated protocol. Use Focus Studio to regenerate after changing configuration.');}}
  return errors;
}
export function studentDefinition(test) {
  // Allowlist only: future private author fields cannot accidentally leak.
  return {
    title:test.title,domain:test.domain,instructions:test.instructions,intent:test.intent,
    presentation:structuredClone(test.presentation),timing:structuredClone(test.timing),
    retry_policy:structuredClone(test.retry_policy),feedback:{reveal:test.feedback.reveal},
    focus:test.focus?{mode:test.focus.mode,target_skill:test.focus.target_skill,condition:test.focus.condition,round:test.focus.round}:undefined,
    activity:test.activity?{mode:test.activity.mode,trial_count:test.activity.trial_count}:undefined,
    questions:test.questions.map(q=>({id:q.id,type:q.type,points:q.points,prompt:test.activity?'Activity trial':q.prompt,reference:test.activity?undefined:q.reference,options:test.activity?undefined:q.options?.map(o=>({id:o.id,text:o.text})),skill_tags:q.skill_tags,difficulty:q.difficulty}))
  };
}
export function effectiveDeadline(startedAt, activatedAt, timing) {
  const candidates=[];
  if (timing.test_duration_ms != null) candidates.push(startedAt+timing.test_duration_ms);
  if (timing.question_duration_ms != null && activatedAt != null) candidates.push(activatedAt+timing.question_duration_ms);
  return candidates.length ? Math.min(...candidates) : null;
}
export function acceptsAt(receivedAt, deadline) { return deadline == null || receivedAt <= deadline; }
export function canStartAttempt(policy, attempts, now, assignmentMax = null) {
  if (attempts.some(a=>a.state==='in_progress')) return {allowed:false,reason:'Resume the existing attempt.'};
  const max=policy.retries_allowed ? Math.min(policy.max_attempts ?? Infinity, assignmentMax ?? Infinity) : 1;
  // Voided records stay in history but do not consume an attempt allowance.
  const counted=attempts.filter(a=>a.state!=='voided');
  if (counted.length>=max) return {allowed:false,reason:'No attempts remain.'};
  const last=Math.max(0,...counted.map(a=>a.completedAt ?? 0));
  if (last && now < last+(policy.cooldown_seconds ?? 0)*1000) return {allowed:false,reason:'The retry cooldown has not ended.'};
  return {allowed:true};
}
export function canNavigate(policy, from, to, farthest, count) {
  if (!Number.isInteger(to) || to<0 || to>=count) return false;
  if (policy==='forward_only') return to===from || to===from+1;
  if (policy==='sequential_with_back') return to<=farthest+1;
  return policy==='free';
}
function normalize(s, policy={}) {
  if(policy.unicode === 'NFC') s=s.normalize('NFC');
  if(policy.case_insensitive) s=s.toLocaleLowerCase('en-US');
  if(policy.trim) s=s.trim();
  if(policy.collapse_whitespace) s=s.replace(/\s+/gu,' ');
  if(policy.ignore_punctuation) s=s.replace(/\p{P}/gu,'');
  return s;
}
export function gradeResponse(q, response) {
  const empty={points:0};
  if (!response) return {...empty,status:'never_shown'};
  if (['skipped','timed_out','unanswered','never_shown'].includes(response.status)) return {...empty,status:response.status};
  const a=response.answer;
  if (a == null || a === '' || (Array.isArray(a)&&!a.length)) return {...empty,status:'unanswered'};
  if(q.type==='free_text_extended' || q.scoring?.mode==='manual_rubric') return {points:null,status:'pending_review'};
  let correct=false;
  if(q.type==='single_select' || q.type==='multi_select') {
    const selected=Array.isArray(a)?a:[a];
    correct=selected.length===q.answer_key.length && new Set(selected).size===selected.length && selected.every(k=>q.answer_key.includes(k));
  } else {
    if(typeof a!=='string') return {...empty,status:'incorrect'};
    const n=q.scoring?.mode==='normalized' ? q.scoring.normalization : {};
    correct=q.answer_key.some(k=>normalize(a,n)===normalize(k,n));
  }
  return {points:correct?q.points:0,status:correct?'correct':'incorrect'};
}
export function scoreAttempt(test, responses) {
  const items=test.questions.map(q=>({question_id:q.id,possible:q.points,...gradeResponse(q,responses[q.id])}));
  const count=status=>items.filter(i=>i.status===status).length;
  const raw_score=items.reduce((s,i)=>s+(i.points??0),0),possible_score=items.reduce((s,i)=>s+i.possible,0);
  const answered_count=count('correct')+count('incorrect')+count('pending_review');
  return {items,raw_score,possible_score,percent_score:100*raw_score/possible_score,accuracy_answered:answered_count?count('correct')/answered_count:null,accuracy_total:count('correct')/items.length,answered_count,skipped_count:count('skipped'),expired_count:count('timed_out'),never_shown_count:count('never_shown'),unanswered_count:count('unanswered'),pending_review_count:count('pending_review'),provisional:count('pending_review')>0};
}
export function compareConditions(relaxed, timed) {
  const comparable=['item_count','difficulty','novelty','modality','target_skill'].every(k=>relaxed[k]!=null && relaxed[k]===timed[k]);
  return {percentage_point_gap:100*(relaxed.correct/relaxed.item_count-timed.correct/timed.item_count),relaxed_denominator:relaxed.item_count,timed_denominator:timed.item_count,comparable,caveat:comparable?'Within-child comparison; does not establish broad transfer.':'Conditions differ or matching metadata is missing; interpret cautiously.'};
}
