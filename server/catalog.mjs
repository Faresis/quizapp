// Build-time catalog is injected by the Worker, never fetched from GitHub at runtime.
export async function catalogApi(c){
 const {db,u,path,b,request,one,rows,run,fail,json,id,now,digest,content}=c;
 if(!content||!path.startsWith('/api/catalog'))return null;
 const parent=()=>{if(u.role!=='parent')fail(403,'Only parents can assign content.');};
 const resolve=(kind,slug)=>!['test','session','course'].includes(kind)?undefined:content[kind==='course'?'courses':kind==='session'?'sessions':'tests'].find(x=>x.id===slug);
 const meta=e=>({id:e.id,kind:e.kind,title:e.title,description:e.description,revision:e.revision,fingerprint:e.fingerprint,source:e.source,...(e.rounds?{rounds:e.rounds,session_kind:e.session_kind,target_skill:e.target_skill,instructions:e.instructions}:{}),...(e.steps?{steps:e.steps}:{}),...(e.definition?{domain:e.definition.domain,questions:e.definition.questions.length}:{} )});
 if(path==='/api/catalog'&&request.method==='GET')return json({fingerprint:content.fingerprint,tests:content.tests.map(meta),sessions:content.sessions.map(meta),courses:content.courses.map(meta)});
 if(path==='/api/catalog/definition'&&request.method==='GET'){
  parent();const url=new URL(request.url),entry=resolve(url.searchParams.get('kind'),url.searchParams.get('id'));if(!entry)fail(404,'Content not found.');return json(entry);
 }
 const progress=async()=>{
  if(!['parent','child'].includes(u.role))fail(403,'Use a parent or child account.');
  const enrollments=await rows(db,'SELECT * FROM catalog_enrollments WHERE '+(u.role==='parent'?'1=1':'child_id=?')+' ORDER BY created_at DESC',...(u.role==='parent'?[]:[u.id]));
  const links=await rows(db,"SELECT l.*,a.child_id,a.due_date,a.version_id,json_extract(v.definition,'$.title') AS title,EXISTS(SELECT 1 FROM attempts p WHERE p.assignment_id=a.id AND p.state IN ('submitted','expired')) AS completed FROM catalog_links l JOIN assignments a ON a.id=l.assignment_id JOIN versions v ON v.id=a.version_id WHERE "+(u.role==='parent'?'1=1':'a.child_id=?')+' ORDER BY l.position',...(u.role==='parent'?[]:[u.id]));
  return enrollments.map(e=>{const snapshot=JSON.parse(e.snapshot),items=links.filter(l=>l.enrollment_id===e.id);return {id:e.id,child_id:e.child_id,content_id:e.content_id,kind:e.content_kind,fingerprint:e.content_hash,title:snapshot.title,description:snapshot.description,revision:snapshot.revision,start_date:e.start_date,timezone:e.timezone,total:items.length,completed:items.filter(l=>l.completed).length,items:items.map(l=>({assignment_id:l.assignment_id,session_id:l.session_id,title:l.title,step_title:l.step_title,due_date:l.due_date,position:l.position,completed:!!l.completed}))};});
 };
 if(path==='/api/catalog/enrollments'&&request.method==='GET')return json({enrollments:await progress()});
 if(path!=='/api/catalog/assign'||request.method!=='POST')return null;
 parent();if(!['test','session','course'].includes(b.kind))fail(400,'Choose a test, session or course.');const entry=resolve(b.kind,b.content_id);if(!entry)fail(404,'Content not found in this publication.');
 if(b.fingerprint!==entry.fingerprint)fail(409,'Content changed. Refresh the catalog and review this version before assigning.');
 if(!/^[a-zA-Z0-9-]{8,100}$/.test(b.request_id||''))fail(400,'Provide a stable request ID.');
 if(!Array.isArray(b.child_ids)||!b.child_ids.length||b.child_ids.length>20||b.child_ids.some(x=>typeof x!=='string'))fail(400,'Choose 1–20 child accounts.');
 const children=[...new Set(b.child_ids)].sort();
 for(const child of children)if(!await one(db,"SELECT id FROM users WHERE id=? AND role='child' AND deleted_at IS NULL",child))fail(403,'Choose active children in this household.');
 if(typeof b.start_date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(b.start_date)||!Number.isFinite(Date.parse(b.start_date))||new Date(b.start_date).toISOString().slice(0,10)!==b.start_date)fail(400,'Choose a valid start/due date.');
 if(typeof b.timezone!=='string'||!b.timezone)fail(400,'Choose a timezone.');try{new Intl.DateTimeFormat('en',{timeZone:b.timezone}).format()}catch{fail(400,'Choose a valid timezone.');}
 const dateAt=offset=>{const date=new Date(b.start_date+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+offset);const text=date.toISOString().slice(0,10);if(!/^\d{4}-/.test(text))fail(400,'Course dates exceed the supported calendar.');return text;};
 const steps=b.kind==='course'?entry.steps:[{type:b.kind,ref:entry.id,day_offset:0}];
 const rounds=steps.reduce((n,s)=>n+(s.type==='session'?resolve('session',s.ref).rounds.length:1),0);
 if(rounds*children.length>80)fail(400,'Assign at most 80 rounds per request. Select fewer children or a shorter course.');
 const requestHash=await digest(JSON.stringify({kind:b.kind,id:entry.id,hash:entry.fingerprint,children,date:b.start_date,timezone:b.timezone}));
 const previous=await rows(db,'SELECT id,request_hash FROM catalog_enrollments WHERE request_id=?',b.request_id);
 if(previous.length){if(previous.some(e=>e.request_hash!==requestHash))fail(409,'This request ID was already used for a different assignment.');return json({ids:previous.map(e=>e.id),replayed:true});}
 const statements=[],versionIds=new Map(),at=now(),enrollmentIds=[];
 const bind=(sql,...args)=>db.prepare(sql).bind(...args);
 const materialize=test=>{
  if(versionIds.has(test.id))return versionIds.get(test.id);
  const tid='catalog:'+test.id+':'+test.fingerprint,vid='catalog-version:'+test.id+':'+test.fingerprint;
  statements.push(bind('INSERT OR IGNORE INTO tests VALUES (?,?,?,?)',tid,u.id,test.title,at),bind('INSERT OR IGNORE INTO versions VALUES (?,?,?,?,?)',vid,tid,test.revision,JSON.stringify(test.definition),at));versionIds.set(test.id,vid);return vid;
 };
 for(const child of children){
  const eid=id();enrollmentIds.push(eid);let position=0;
  const snapshot={id:entry.id,title:entry.title,description:entry.description,revision:entry.revision,kind:entry.kind,fingerprint:entry.fingerprint,steps:steps.map(s=>({...s,title:resolve(s.type,s.ref).title,fingerprint:resolve(s.type,s.ref).fingerprint}))};
  statements.push(bind('INSERT INTO catalog_enrollments (id,request_id,request_hash,child_id,created_by,content_id,content_kind,content_hash,snapshot,start_date,timezone,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',eid,b.request_id,requestHash,child,u.id,entry.id,entry.kind,entry.fingerprint,JSON.stringify(snapshot),b.start_date,b.timezone,at));
  for(const step of steps){
   const item=resolve(step.type,step.ref),due=dateAt(step.day_offset);let sid=null;
   if(step.type==='session'){
    sid=id();const independent=item.session_kind==='independent',agenda=independent?[{label:'Objective',minutes:1},{label:'Practice',minutes:6},{label:'Debrief',minutes:1}]:[{label:'Objective',minutes:2},{label:'Technique',minutes:4},{label:'Exercises',minutes:15},{label:'Debrief',minutes:4}];
    statements.push(bind('INSERT INTO focus_sessions (id,child_id,created_by,title,target_skill,kind,scheduled_for,duration_ms,collect_ratings,data) VALUES (?,?,?,?,?,?,?,?,?,?)',sid,child,u.id,item.title,item.target_skill,item.session_kind,due,independent?480000:1500000,item.collect_ratings?1:0,JSON.stringify({agenda,ratings:{},notes:'',catalog_instructions:item.instructions,catalog_hash:item.fingerprint})));
   }
   const tests=step.type==='session'?item.rounds.map(ref=>resolve('test',ref)):[item];
   tests.forEach((test,index)=>{const vid=materialize(test),aid=id();statements.push(bind('INSERT INTO assignments VALUES (?,?,?,?,?,?,?)',aid,u.id,child,vid,due,b.timezone,at),bind('INSERT INTO catalog_links VALUES (?,?,?,?,?)',eid,aid,sid,position++,item.title));if(sid)statements.push(bind('INSERT INTO session_rounds VALUES (?,?,?)',sid,aid,index));});
  }
  statements.push(bind('INSERT INTO audit VALUES (?,?,?,?,?)',id(),u.id,'assign_catalog_content',eid,at));
 }
 try{await db.batch(statements)}catch(error){
  if(String(error).includes('UNIQUE')){const found=await rows(db,'SELECT id,request_hash FROM catalog_enrollments WHERE request_id=?',b.request_id);if(found.length&&found.every(e=>e.request_hash===requestHash))return json({ids:found.map(e=>e.id),replayed:true});fail(409,'Assignment changed concurrently. Refresh before retrying.');}throw error;
 }
 return json({ids:enrollmentIds,replayed:false},201);
}
