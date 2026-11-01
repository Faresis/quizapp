export const FOCUS_MODES = {available:['near_match'],planned:['go_no_go','rule_switching','sustained_vigilance','speed_accuracy','interruption_recovery','pressure_ladder','error_recovery']};
export function validateFocus(f) {
  if(f==null)return [];
  const errors=[],add=(path,message)=>errors.push({path:'focus.'+path,message});
  if(typeof f!=='object'||Array.isArray(f))return [{path:'focus',message:'Expected focus metadata.'}];
  if(f.mode!=='near_match')add('mode','Only near_match is available in this release.');
  if(!['selective_attention','sustained_attention','impulse_control','self_monitoring','speed_accuracy','stress_regulation','cognitive_flexibility','interruption_recovery','independent_transfer'].includes(f.target_skill))add('target_skill','Choose a supported primary skill.');
  if(!['relaxed','timed','training','baseline'].includes(f.condition))add('condition','Choose relaxed, timed, training, or baseline.');
  for(const k of ['match_group','round','difficulty','assistance'])if(typeof f[k]!=='string'||!f[k].trim()||f[k].length>200)add(k,'Provide a short label.');
  return errors;
}
function seededRandom(seed) {let x=2166136261;for(const c of String(seed)){x^=c.charCodeAt(0);x=Math.imul(x,16777619)}return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296}}
export function generateFocusPair(config) {
  const count=config.trial_count??8,length=config.sequence_length??8,seconds=config.seconds_per_item??12;
  if(!Number.isInteger(count)||count<3||count>40)throw new Error('Use 3–40 trials per round.');
  if(!Number.isInteger(length)||length<3||length>24)throw new Error('Use a sequence length of 3–24.');
  if(!Number.isInteger(seconds)||seconds<3||seconds>120)throw new Error('Use 3–120 seconds per timed item.');
  if(typeof config.seed!=='string'||!config.seed.trim()||config.seed.length>100)throw new Error('Provide a seed of 1–100 characters.');
  const groups=config.confusable_groups??['O0','I1l','S5','B8','G6'];
  if(!Array.isArray(groups)||!groups.length||groups.length>12||groups.some(g=>typeof g!=='string'||g.length<2||g.length>8||new Set(g).size!==g.length)||new Set(groups.join('')).size!==groups.join('').length)throw new Error('Use nonoverlapping confusable groups with 2–8 unique characters each.');
  const rng=seededRandom(config.seed),choose=a=>a[Math.floor(rng()*a.length)],used=new Set();
  const groupId=config.match_group||'near-match:'+config.seed+':'+count+':'+length+':'+groups.join('-');
  const build=(condition,round)=>{
    const questions=[];
    for(let n=0;n<count;n++){
      let reference='',attempts=0;
      do{reference=Array.from({length},()=>choose(choose(groups))).join('');if(++attempts>10000)throw new Error('Not enough unique references. Increase sequence length or alphabet.');}while(used.has(reference));used.add(reference);
      const variants=new Set();for(let i=0;i<length;i++){const g=groups.find(g=>g.includes(reference[i]));for(const c of g){if(c!==reference[i])variants.add(reference.slice(0,i)+c+reference.slice(i+1));}}
      const candidates=[...variants],wrong=[];while(wrong.length<3){const at=Math.floor(rng()*candidates.length);wrong.push(candidates.splice(at,1)[0]);}
      const strings=[reference,...wrong];for(let i=strings.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[strings[i],strings[j]]=[strings[j],strings[i]];}
      const options=strings.map((text,i)=>({id:'o'+i,text}));questions.push({id:'q'+(n+1),type:'single_select',points:1,prompt:'Match this reference exactly: '+reference,reference,options,answer_key:[options.find(o=>o.text===reference).id],difficulty:'length-'+length,skill_tags:['selective_attention'],confusion_tags:groups,explanation:'Compare every character, including visually similar ones.'});
    }
    return {schema_version:'1.0',title:(config.title||'Exact-match focus')+' · '+condition,domain:'focus',intent:'assessment',instructions:'Find the exact match. Each reference is different. Take a comfortable approach; you can ask your parent to stop.',presentation:{mode:'one_at_a_time',navigation:'forward_only'},timing:{test_duration_ms:null,question_duration_ms:condition==='timed'?seconds*1000:null,pause_policy:'not_allowed'},retry_policy:{retries_allowed:false,max_attempts:1,cooldown_seconds:0,report_score:'first'},feedback:{reveal:'guardian_only'},focus:{mode:'near_match',target_skill:'selective_attention',condition,round,match_group:groupId,difficulty:'length-'+length,assistance:'none',source:'seeded_generator',seed:config.seed,modality:'single_select',sequence_length:length},questions};
  };
  return [build('relaxed','A'),build('timed','B')];
}
export function itemFingerprint(q) {return q.reference?JSON.stringify(['reference',q.reference]):JSON.stringify([q.prompt,(q.options||[]).map(o=>o.text).sort()]);}
export function summarizeFocusAttempt(row,definition) {
  const d=JSON.parse(row.data),r=d.report;if(!r||!definition.focus)return null;
  const count=status=>r.items.filter(i=>i.status===status).length;
  return {attempt_id:row.id,assignment_id:row.assignment_id,child_id:row.child_id,version_id:row.version_id,attempt_number:row.number,started_at:row.started_at,completed_at:row.completed_at,focus:definition.focus,first_attempt:row.number===1,item_count:r.items.length,correct:count('correct'),incorrect:count('incorrect'),timed_out:count('timed_out'),skipped:count('skipped'),never_shown:count('never_shown'),unanswered:count('unanswered'),previously_seen:Object.values(d.novelty||{}).filter(x=>x==='previously_seen').length,novelty_known:!!d.novelty,timing_quality:d.quality,mean_latency_ms:Object.values(d.responses).filter(r=>r.status==='answered'&&Number.isFinite(r.latency_ms)).reduce((s,r,_,arr)=>s+r.latency_ms/arr.length,0)||null};
}
export function compareFocusRounds(a,b) {
  if(!a||!b||a.child_id!==b.child_id||a.focus.condition!=='relaxed'||b.focus.condition!=='timed'||a.focus.match_group!==b.focus.match_group)throw new Error('Select relaxed and timed rounds for the same child and matched set.');
  if(!a.item_count||!b.item_count)throw new Error('Both rounds need scored items.');
  const matching=['target_skill','difficulty','modality','assistance'].every(k=>a.focus[k]!=null&&a.focus[k]===b.focus[k]);
  const eligible=matching&&!a.never_shown&&!b.never_shown&&a.item_count===b.item_count&&a.first_attempt&&b.first_attempt&&a.novelty_known&&b.novelty_known&&!a.previously_seen&&!b.previously_seen&&a.timing_quality==='approximate'&&b.timing_quality==='approximate';
  return {relaxed_attempt:a.attempt_id,timed_attempt:b.attempt_id,percentage_point_gap:100*(a.correct/a.item_count-b.correct/b.item_count),relaxed_correct:a.correct,relaxed_total:a.item_count,timed_correct:b.correct,timed_total:b.item_count,comparable:eligible,caveat:eligible?'Within-child condition comparison; browser timing is approximate and this does not establish broader transfer.':'Interpret cautiously: retakes, seen items, missing metadata, unseen items, unequal conditions, or degraded timing prevent a matched first-attempt comparison.'};
}
