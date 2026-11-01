// One loaded FontFace and one typography class serve live activities and preview.
let matchFontReady=false,matchFontPromise=null;
async function ensureMatchFont(){
 if(matchFontReady)return;
 if(!matchFontPromise)matchFontPromise=(async()=>{
  if(!window.FontFace||!document.fonts)throw new Error('This browser cannot verify the activity font. Use a supported browser before starting.');
  const face=new FontFace('Clearpath Match','url(/fonts/JetBrainsMono-Regular.woff2)',{weight:'400',style:'normal'});
  let timer;try{await Promise.race([face.load(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Font load timed out.')),10000)})]);}finally{clearTimeout(timer)}
  if(face.status!=='loaded')throw new Error('The activity font did not load.');
  document.fonts.add(face);
  if(!document.fonts.check('24px "Clearpath Match"','Il1O0o'))throw new Error('The loaded activity font is unavailable.');
  matchFontReady=true;document.documentElement.classList.add('match-font-ready');
 })().catch(e=>{matchFontPromise=null;throw new Error('Activity font unavailable. Check the connection, then retry. No new attempt was started. '+e.message)});
 return matchFontPromise;
}
function requiresMatchFont(t){return t.focus?.mode==='near_match'||['speed_accuracy','pressure_ladder','error_recovery','interruption_recovery'].includes(t.activity?.mode)||t.questions?.some(q=>q.reference);}
function matchReference(q){return q.reference?`<p class="match-caption">Match this reference exactly</p><div class="match-scroll"><span class="match-string match-reference">${esc(q.reference)}</span></div>`:`<h3>${esc(q.prompt)}</h3>`;}
function matchChoice(text,exact=true){return exact?`<span class="match-string match-choice">${esc(text)}</span>`:esc(text);}
function matchActivityLayout(reference,left,right){return `<div class="match-layout">${matchReference({reference})}<div class="match-choices"><div class="option"><span aria-hidden="true">←</span><div class="match-scroll">${matchChoice(left)}</div></div><div class="option"><div class="match-scroll">${matchChoice(right)}</div><span aria-hidden="true">→</span></div></div></div>`;}
function paintMatchStimulus(node,stimulus){const m=/^Reference: ([^\n]+)\n← (.+) {4}(.+) →$/.exec(stimulus);if(m)node.innerHTML=matchActivityLayout(m[1],m[2],m[3]);else node.textContent=stimulus;}
async function legibilityPreview(){
 $('#view').innerHTML=`<div class="heading"><div><p class="eyebrow">DISPLAY CHECK · NO SCORE OR ATTEMPT</p><h2>Character preview</h2><p>Inspect on the learner’s actual iPad in Safari at normal zoom. Font loading alone does not verify character legibility.</p></div></div><p id="match-font-status" role="status">Loading bundled JetBrains Mono…</p><div class="notice">New generated exact-match activities exclude unverified confusable characters and all lowercase letters. Existing definitions retain their original strings. This preview includes the excluded characters for inspection only.</div><div id="match-preview"></div>`;
 try{await ensureMatchFont()}catch(e){$('#match-font-status').textContent=e.message;return;}
 if(!$('#match-preview'))return;
 $('#match-font-status').textContent='Bundled JetBrains Mono Regular v2.304 loaded on this browser · 24px · weight 400 · spacing 0.08em · ligatures off. Actual iPad legibility: awaiting device inspection.';
 const samples=[['I l 1','I','l','1'],['O 0 o','O','0','o'],['S 5 s','S','5','s'],['B 8 b','B','8','b'],['G 6 g','G','6','g'],['Z 2 z','Z','2','z'],['rn m','rn','m'],['cl d','cl','d'],['vv w','vv','w'],['ABCDEFGHIJKLMNOPQRSTUVWXYZ','ABCDEFGHIJKLMNOPQRSTUVWXYZ'],['abcdefghijklmnopqrstuvwxyz','abcdefghijklmnopqrstuvwxyz'],['0123456789','0123456789'],['Il1O0oS5sB8bG6gZ2z','Il1O0oS5sB8bG6gZ2z']];
 $('#match-preview').innerHTML=samples.map(([reference,...choices],i)=>`<section class="panel question"><h3>Question layout · sample ${i+1}</h3>${matchReference({reference})}<fieldset>${choices.map(text=>`<label class="option"><input type="radio" name="preview-${i}" aria-label="${esc(text)}">${matchChoice(text)}</label>`).join('')}</fieldset></section>`).join('')+`<details class="panel"><summary>Timed activity layouts · inspection only</summary>${samples.map(([reference,...choices])=>`<section class="panel"><div class="stimulus">${matchActivityLayout(reference,choices[0],choices[1]||choices[0])}</div><div class="row"><button type="button">Left (←)</button><button type="button">Right (→)</button></div></section>`).join('')}</details><p>Check all forms in references and choices, including rn/m, cl/d and vv/w. Scrolling long strings preserves their size and spacing. No automatic device approval or generator re-enabling occurs from using this preview.</p>`;
}
