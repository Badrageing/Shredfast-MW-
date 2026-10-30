// Version 9: record actual training; preserve all version 8 and archive entries.
let appBlock='hybrid1';
try{if(localStorage.getItem('sf_active_block')==='block2')appBlock='block2';}catch(_){}
const HYBRID_EXERCISES={
 squat:{name:'Kurzhantel-Kniebeuge',target:'8–12',hint:'Kontrolliert beugen; Gewicht je Hantel.',groups:['Beine','Gesäß']},
 floor:{name:'Floor Press',target:'8–12',hint:'Auf dem Boden drücken, Oberarme kontrolliert absetzen.',groups:['Brust','Trizeps','Schultern']},
 pushup:{name:'Liegestütze',target:'8–15',bodyweight:true,hint:'Rumpf stabil; bei Bedarf Hände erhöht abstützen.',groups:['Brust','Trizeps','Schultern']},
 rdl:{name:'Rumänisches Kreuzheben',target:'8–12',hint:'Hüfte nach hinten, Rücken stabil. Zwei Hanteln.',groups:['Beinrückseite','Gesäß']},
 row:{name:'Einarmiges Rudern',target:'8–15 / Seite',hint:'Hand am eigenen Oberschenkel abstützen; beide Seiten trainieren, schwächere Seite eintragen.',groups:['Rücken','Bizeps']},
 lunge:{name:'Rückwärts-Ausfallschritt',target:'8–12 / Seite',hint:'Beide Seiten; bei Bedarf zunächst ohne Zusatzgewicht.',groups:['Beine','Gesäß']},
 press:{name:'Schulterdrücken',target:'8–12',hint:'Bauch fest; ohne Schwung oder Hohlkreuz.',groups:['Schultern','Trizeps']},
 lateral:{name:'Seitheben',target:'12–20',accessory:true,hint:'Leichtes Gewicht, kontrolliert seitlich anheben.',groups:['Schultern']},
 curl:{name:'Bizeps-Curls',target:'10–15',accessory:true,hint:'Ellbogen ruhig; ohne Schwung.',groups:['Bizeps']},
 hammer:{name:'Hammer-Curls',target:'10–15',accessory:true,hint:'Handflächen zueinander, Ellbogen ruhig.',groups:['Bizeps']},
 triceps:{name:'Überkopf-Trizepsstrecken',target:'10–15',accessory:true,single:true,hint:'Eine Hantel mit beiden Händen; hier das Gewicht dieser einen Hantel eintragen.',groups:['Trizeps']},
 closefloor:{name:'Enger Floor Press',target:'10–15',accessory:true,hint:'Ellbogen körpernah, kontrolliert drücken. Zwei Hanteln.',groups:['Trizeps','Brust']},
 drag:{name:'Plank Dumbbell Drag',target:'6–10 Züge gesamt',unit:'Züge gesamt',weighted:true,hint:'Hoher Stütz, Füße etwas breiter. Leichte, sicher verriegelte Hantel unter dem Körper ziehen; Seiten abwechseln, Becken ruhig. Eine Hand am Boden. Gesamtzüge eintragen, z. B. 8 = 4 je Seite.',groups:['Bauch']},
 reverse:{name:'Reverse Crunch',target:'10–15',unit:'Wdh.',hint:'Becken einrollen; ohne Schwung.',groups:['Bauch']},
 side:{name:'Seitstütz',target:'20–40 s / Seite',unit:'Sek./Seite',hint:'Beide Seiten; Zeit der schwächeren Seite eintragen.',groups:['Bauch']},
 deadbug:{name:'Dead Bug',target:'6–10 / Seite',unit:'Wdh./Seite',hint:'Langsam ausatmen; Rücken stabil halten.',groups:['Bauch']}
};
const HYBRID_WORKOUTS={
 'strength-a':{name:'Ganzkörper A',kind:'strength',main:['squat','floor','rdl','row'],ids:['squat','floor','rdl','row','lateral','curl','triceps','drag','reverse'],legacyIds:['deadbug','side'],pairs:'Paar 1: Kniebeuge + Floor Press. Paar 2: RDL + Rudern. Danach Schulter-/Armsätze und Core.'},
 'strength-b':{name:'Ganzkörper B',kind:'strength',main:['lunge','row','rdl','pushup'],ids:['lunge','row','rdl','pushup','press','hammer','closefloor','drag','side'],legacyIds:['reverse'],pairs:'Paar 1: Ausfallschritt + Rudern. Paar 2: RDL + Liegestütze. Danach Schulter-/Armsätze und Core.'},
 'circuit-press':{name:'AMRAP15 Press Up',kind:'circuit',metric:'rounds',defaultMinutes:15,ids:['reverse','side'],pairs:'15 Min: 10 Liegestütze → 10 Deadlifts → 10 Press → 10 Row. Rudern einarmig: 10 gesamt, 5 je Seite. Zählweise immer gleich halten.'},
 'circuit-burpee':{name:'AMRAP20 Burpee',kind:'circuit',metric:'rounds',defaultMinutes:20,ids:['reverse','side'],pairs:'20 Min: 10 Burpees → 10 Squats → 10 Row → 10 Press → 20 Knee-to-Elbow. Einarmiges Rudern: 10 gesamt, 5 je Seite. Technik vor Tempo.'},
 'circuit-150':{name:'150 Rep Challenge',kind:'circuit',metric:'reps',defaultMinutes:20,totalReps:150,ids:['reverse','side'],pairs:'Je 30: Thruster → Deadlift → Renegade Row + Press → Alt Row → Reverse Lunge. Maximal 20 Min. Bei Zeitlimit erreichte Wiederholungen eintragen; zusätzliche oder geänderte Zählweise in der Notiz festhalten.'},
 'circuit-cap20':{name:'Time Cap 20 Min',kind:'circuit',metric:'reps',defaultMinutes:20,totalReps:210,ids:['reverse','side'],pairs:'Je 30: Deadlift → High Pull → Thruster → Clean + Press → Burpee → Knee-to-Elbow → Russian Twist. Maximal 20 Min. Erreichte Wiederholungen erfassen; nur bei gleicher Ausführung vergleichen.'},
 'easy-run':{name:'Locker joggen / Run-Walk',kind:'run',ids:[],pairs:'Optional 20–30 Min, ganze Sätze sprechen können (etwa RPE 3–4/10). Bei Bedarf Lauf-Geh-Wechsel. Kein Tempolauf.'},
 optional:{name:'Optional: Kraft oder lockerer Lauf',kind:'choice',ids:[],pairs:'Zusatztermin bei guter Erholung. Kraft A/B weiter abwechseln oder locker laufen. Tatsächliches Datum frei wählbar; zwischen Krafttagen möglichst ein freier Tag.'}
};
const CIRCUIT_ROTATION=['circuit-press','circuit-burpee','circuit-150','circuit-cap20'];
const HYBRID_PLAN=Array.from({length:8},(_,i)=>i+1).flatMap(week=>[
 {week,day:'Mo',workoutId:'strength-a'},{week,day:'Mi',workoutId:'strength-b'},
 {week,day:'Fr',workoutId:CIRCUIT_ROTATION[(week-1)%4]}, {week,day:'So',workoutId:'optional',optional:true}
]);
const getPlan=()=>appBlock==='block2'?BLOCK2_PLAN:HYBRID_PLAN;
const localLogsKey=()=>appBlock==='block2'?STORAGE_KEY:'sf_hybrid1_logs';
const completed=l=>(l.status||'completed')==='completed';
const allExerciseIds=w=>[...w.ids,...(w.legacyIds||[])];
const planPosition=p=>HYBRID_PLAN.findIndex(s=>s.week===p.week&&s.day===p.day);
function allowedWorkouts(plan){return plan.day==='So'?['strength-a','strength-b','easy-run']:plan.day==='Fr'?CIRCUIT_ROTATION:['strength-a','strength-b'];}
function suggestedWorkout(plan){
 if(plan.day==='Fr')return plan.workoutId;
 const previous=logs.filter(l=>HYBRID_WORKOUTS[l.workoutId]?.kind==='strength'&&planPosition(l)<planPosition(plan)).sort((a,b)=>planPosition(b)-planPosition(a))[0];
 return previous?(previous.workoutId==='strength-a'?'strength-b':'strength-a'):plan.day==='Mi'?'strength-b':'strength-a';
}
function normalizeHybridEntry(row,plan){
 if(!allowedWorkouts(plan).includes(row.workoutId))throw Error('Training passt nicht zu diesem Termin.');
 const w=HYBRID_WORKOUTS[row.workoutId],clean={key:row.key,week:plan.week,day:plan.day,workoutId:row.workoutId};
 for(const field of ['date','dateISO','mode','duration','rpe','note','weight','rounds','circuitMinutes','distance','reps','elapsedSeconds','extraReps']){
  if(row[field]!=null&&!['string','number'].includes(typeof row[field]))throw Error('Ungültiges Datenfeld.');
  clean[field]=String(row[field]??'');if(clean[field].length>(field==='note'?2000:100))throw Error('Datenfeld zu lang.');
 }
 clean.schemaVersion=row.schemaVersion??8;if(![8,9].includes(clean.schemaVersion))throw Error('Unbekannte Trainingsversion.');
 clean.status=row.status??'completed';if(!['completed','partial'].includes(clean.status))throw Error('Ungültiger Abschlussstatus.');
 const num=(v,min,max,integer=false)=>v!==''&&Number.isFinite(Number(v))&&Number(v)>=min&&Number(v)<=max&&(!integer||Number.isInteger(Number(v)));
 if(!['standard','short'].includes(clean.mode))throw Error('Ungültige Variante.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(clean.dateISO)||isNaN(Date.parse(clean.dateISO))||new Date(clean.dateISO+'T12:00:00Z').toISOString().slice(0,10)!==clean.dateISO)throw Error('Bitte gültiges Datum wählen.');
 clean.date=new Date(clean.dateISO+'T12:00:00').toLocaleDateString('de-DE');
 if(!num(clean.duration,1,180,true)||(clean.rpe!==''&&!num(clean.rpe,1,10,true)))throw Error('Gesamtdauer prüfen; Anstrengung ist optional (1–10).');
 if(!Array.isArray(row.sets)||row.sets.length>40)throw Error('Ungültige Satzliste.');
 const seen=new Set();clean.sets=row.sets.map(s=>{
  if(!s||!allExerciseIds(w).includes(s.exercise))throw Error('Übung passt nicht zur Einheit.');
  const ex=HYBRID_EXERCISES[s.exercise],key=s.exercise+'-'+s.set;
  if(seen.has(key)||!num(String(s.set),1,5,true))throw Error('Ungültige oder doppelte Satznummer.');seen.add(key);
  for(const v of [s.reps,s.weight,s.rir])if(v!=null&&!['string','number'].includes(typeof v))throw Error('Ungültiger Satzwert.');
  const reps=String(s.reps??''),weight=String(s.weight??''),rir=String(s.rir??'');
  if(!num(reps,1,ex.unit?600:100,true)||((!ex.unit||ex.weighted)&&!ex.bodyweight&&!num(weight,0,24))||(rir!==''&&!num(rir,0,10,true)))throw Error('Satzwerte prüfen: maximal 24 kg je Hantel, positive ganze Wiederholungen/Zeit, Reserve 0–10.');
  return {exercise:s.exercise,set:Number(s.set),weight:ex.bodyweight?'0':ex.unit&&!ex.weighted?'':weight,reps,rir:ex.unit?'':rir};
 });
 if(w.kind==='strength'){
  if(!clean.sets.length)throw Error('Mindestens einen tatsächlich absolvierten Satz eintragen.');
  // Version 8 strength B had overhead press instead of push-ups. Preserve those entries.
  const mainB=clean.schemaVersion===9?'pushup':clean.sets.some(s=>s.exercise==='pushup')?'pushup':clean.sets.some(s=>s.exercise==='press')?'press':'pushup';
  const main=w.kind==='strength'&&row.workoutId==='strength-b'?['lunge','row','rdl',mainB]:w.main;
  if(clean.status==='completed'&&main.some(id=>clean.sets.filter(s=>s.exercise===id).length<2))throw Error('Für einen vollständigen Krafttag je Hauptübung mindestens 2 Sätze eintragen; sonst „Verkürzt / abgebrochen“ wählen.');
 }
 if(w.kind==='circuit'){
  if(!num(clean.weight,0,24)||!num(clean.circuitMinutes,1,30,true)||Number(clean.duration)<Number(clean.circuitMinutes))throw Error('Zirkelgewicht und Dauer prüfen.');
  if(w.metric==='rounds'&&(!num(clean.rounds,0,100,true)||(clean.extraReps!==''&&!num(clean.extraReps,0,1000,true))))throw Error('Vollständige Runden und zusätzliche Wiederholungen prüfen.');
  if(w.metric==='reps'&&!num(clean.reps,1,w.totalReps,true))throw Error('Erreichte Wiederholungen prüfen.');
  if(clean.elapsedSeconds!==''&&!num(clean.elapsedSeconds,1,Number(clean.circuitMinutes)*60,true))throw Error('Benötigte Sekunden müssen innerhalb des Zeitlimits liegen.');
 }
 if(w.kind==='run'&&clean.distance!==''&&!num(clean.distance,0,100))throw Error('Ungültige Laufdistanz.');
 clean.mins='';clean.secs='';return clean;
}
let hybridEditing=null,restDeadline=0;
const oldRenderPlan=renderPlan,oldRenderProgress=renderProgress,oldRenderHeader=renderHeader;
renderPlan=function(){if(appBlock==='block2')return oldRenderPlan();renderHybridPlan();};
renderProgress=function(){if(appBlock==='block2')return oldRenderProgress();renderHybridProgress();};
renderHeader=function(){
 document.getElementById('blockTitle').textContent=appBlock==='block2'?'10 Wochen · bisheriger Block':'8 Wochen · Kraft & Ausdauer';
 document.getElementById('blockSubtitle').textContent=appBlock==='block2'?'ShredFast · Archiv / bisheriger Plan':'2 × Kraft · Zirkelrotation · Core · Zusatztermin optional';
 document.getElementById('totalTarget').textContent=appBlock==='block2'?'/30':'/24';
 if(appBlock==='block2')return oldRenderHeader();
 const done=logs.filter(l=>l.day!=='So'&&completed(l)).length,pct=Math.round(done/24*100);
 document.getElementById('totalDone').textContent=done;document.getElementById('progressFill').style.width=pct+'%';document.getElementById('progressPercent').textContent=pct+'%';
};
function phaseHint(week){return week===1?'Einstieg: etwa 3 Wiederholungen in Reserve; passende Gewichte je Übung finden.':week===5?'Entlastung: etwas leichter, 3–4 Wiederholungen in Reserve; beim Zirkel 10–12 Min locker.':'Aufbau: meist 1–2 Wiederholungen in Reserve. Oberes Wiederholungsziel in allen geplanten Sätzen sauber erreicht? Nächstes Mal kleinste Gewichtsstufe erhöhen.';}
function exercisePrescription(id){const ex=HYBRID_EXERCISES[id];return `${ex.unit?'2':ex.accessory||id==='press'?'1–2':'2'} × ${ex.target}`;}
function trainingSummary(log){
 const w=HYBRID_WORKOUTS[log.workoutId];let out=`${escapeHTML(log.duration)} Min · ${completed(log)?'abgeschlossen':'verkürzt / abgebrochen'}${log.rpe?' · RPE '+escapeHTML(log.rpe)+'/10':''}`;
 if(w.kind==='circuit')out+=w.metric==='rounds'?`<br>${escapeHTML(log.circuitMinutes)} Min AMRAP · ${escapeHTML(log.rounds)} Runden${log.extraReps?' + '+escapeHTML(log.extraReps)+' Wdh.':''} · ${escapeHTML(log.weight)} kg/Hantel`:`<br>${escapeHTML(log.reps)}/${w.totalReps} Wdh. · Limit ${escapeHTML(log.circuitMinutes)} Min · ${escapeHTML(log.weight)} kg/Hantel${log.elapsedSeconds?' · benötigt '+escapeHTML(log.elapsedSeconds)+' s':''}`;
 if(w.kind==='run')out+=` · ${escapeHTML(log.distance||'–')} km`;
 const ids=[...new Set(log.sets.map(s=>s.exercise))];
 out+=ids.map(id=>{const ex=HYBRID_EXERCISES[id];return `<br><strong>${ex.name}:</strong> ${log.sets.filter(s=>s.exercise===id).map(s=>`${s.weight!==''&&!ex.bodyweight?escapeHTML(s.weight)+' kg × ':''}${escapeHTML(s.reps)}${ex.unit?' '+ex.unit:' Wdh.'}${s.rir!==''?' (Reserve '+escapeHTML(s.rir)+')':''}`).join(' / ')}`}).join('');
 if(log.note)out+='<br>'+escapeHTML(log.note);return out;
}
// Kept as a compatibility alias for callers from v8.
const hybridSummary=trainingSummary;
function renderHybridPlan(){
 const plans=HYBRID_PLAN.filter(p=>p.week===currentWeek);
 document.getElementById('content').innerHTML=`<div class="week-tabs">${Array.from({length:8},(_,i)=>`<button class="${currentWeek===i+1?'active':''}" onclick="window.setWeek(${i+1})">W${i+1}</button>`).join('')}</div>
 <div class="note-box"><strong>Woche ${currentWeek}</strong><br>${phaseHint(currentWeek)}<br><br><strong>20 Min:</strong> 3 Min aufwärmen, 2 Sätze je Hauptübung, 1 Core-Übung mit 2 Sätzen. <strong>30–40 Min:</strong> zusätzlich 1–2 Sätze für Schultern, Bizeps, Trizeps und eine zweite Core-Übung. Übungen paarweise abwechseln: 30–45 s wechseln, danach 75–90 s Pause; bei Bedarf länger. Bei Zeitdruck Zusatzsätze weglassen, nicht hetzen.<br><br>Zwei Krafttage sind die Basis. Optional A/B weiter abwechseln oder locker laufen; tatsächliches Datum frei wählen. Core nach dem Zirkel ist freiwillig.</div>
 ${plans.map(p=>{const key=`W${p.week}-${p.day}`,log=logs.find(l=>l.key===key),id=log?.workoutId||(p.day==='Mo'||p.day==='Mi'?suggestedWorkout(p):p.workoutId),w=HYBRID_WORKOUTS[id];return `<div class="hybrid-card"><div class="hybrid-heading"><div><strong>${p.optional?'Zusatztermin':p.day} · ${w.name}</strong><p>${p.optional?'Optional · kein Pflichtziel':w.kind==='strength'?'20–40 Min':'20–30 Min'}${log?' · '+(completed(log)?'✓':'◐')+' '+escapeHTML(log.date):''}</p></div><button onclick="openHybrid('${key}')">${log?'Bearbeiten':'Training erfassen'}</button></div><p>${w.pairs}</p>
 ${w.kind==='strength'?`<ul>${w.ids.map(ex=>`<li>${HYBRID_EXERCISES[ex].name}: ${exercisePrescription(ex)}</li>`).join('')}</ul>`:''}
 ${w.kind==='circuit'?`<p>${w.metric==='reps'?'Nach spätestens 20 Min stoppen und erreichte Wiederholungen eintragen.':'Kurzversion 12 Min; unterschiedliche Zeitvorgaben getrennt vergleichen.'} Ziel etwa RPE 7–8/10, kurze Pausen erlaubt. Gewicht passend zum schwächsten Teil wählen. In Woche 5 locker. Optional Reverse Crunch oder Seitstütz 2 Sätze.</p>`:''}
 ${log?`<div class="note-box">${trainingSummary(log)}<p><button class="secondary" onclick="window.deleteLog('${key}')">Eintrag löschen</button></p></div>`:''}</div>`}).join('')}
 <div class="note-box">Core: Körperrotation beim Dumbbell Drag verhindern. Definition hängt auch vom gesamten Körperfett und Ernährung ab. Der neue Block bleibt vom bisherigen 30-Sessions-Block getrennt.</div>`;
}
function renderHybridProgress(){
 const ordered=[...logs].sort((a,b)=>planPosition(a)-planPosition(b)),required=logs.filter(l=>l.day!=='So'&&completed(l)).length,optional=logs.filter(l=>l.day==='So').length;
 const weekLogs=logs.filter(l=>l.week===currentWeek),groups=[...new Set(weekLogs.flatMap(l=>l.sets.flatMap(s=>HYBRID_EXERCISES[s.exercise]?.groups||[])))];
 document.getElementById('content').innerHTML=`<div class="details-title">${required}/24 Kerneinheiten · ${optional} Zusatztermine · ${logs.filter(l=>!completed(l)).length} verkürzte Einheiten</div><div class="note-box"><strong>W${currentWeek} · tatsächlich erfasste Muskelgruppen:</strong> ${groups.join(', ')||'Noch keine Kraft-/Core-Sätze.'}<br>Auch indirekt beteiligte Muskeln werden genannt. Das ersetzt keine Bewertung des Trainingsvolumens. Zirkel vergleichen: gleicher Typ, gleiche Dauer, Last und Zählweise.</div>${ordered.map(l=>`<div class="hybrid-card"><strong>W${l.week} ${l.day==='So'?'Zusatztermin':l.day} · ${HYBRID_WORKOUTS[l.workoutId].name}</strong><p>${escapeHTML(l.date)}</p>${trainingSummary(l)}<p><button onclick="openHybrid('${l.key}')">Bearbeiten</button></p></div>`).join('')||'<div class="empty-state">Noch keine Einheiten im neuen Block.</div>'}`;
}
const draftKey=key=>'sf_draft_v9_'+(account?.id||'local')+'_'+appBlock+'_'+key;
function readDraft(key){try{return JSON.parse(localStorage.getItem(draftKey(key))||'null');}catch(_){return null;}}
function collectHybridFields(){const values={};document.querySelectorAll('#hybridFields input, #hybridFields select, #hybridFields textarea').forEach(el=>{if(el.id)values[el.id]=el.value;});return values;}
function saveHybridDraft(){
 if(!hybridEditing)return;
 try{localStorage.setItem(draftKey(hybridEditing.key),JSON.stringify({workoutId:hybridEditing.workoutId,values:collectHybridFields(),at:Date.now()}));document.getElementById('draftStatus').textContent='Entwurf auf diesem Gerät gesichert · noch nicht als Training gespeichert';}
 catch(_){document.getElementById('draftStatus').textContent='Entwurf konnte nicht gesichert werden. Bitte Training ausdrücklich speichern.';}
}
function previousExercise(id,key){return [...logs].filter(l=>l.key!==key).sort((a,b)=>String(b.dateISO).localeCompare(String(a.dateISO))).flatMap(l=>l.sets||[]).find(s=>s.exercise===id);}
function openHybrid(key,chosenId){
 const p=HYBRID_PLAN.find(p=>key===`W${p.week}-${p.day}`);if(!p||appBlock!=='hybrid1')return;
 const old=logs.find(l=>l.key===key),allowed=allowedWorkouts(p),candidate=chosenId?null:readDraft(key),draft=allowed.includes(candidate?.workoutId)?candidate:null;
 const id=chosenId||draft?.workoutId||old?.workoutId||(p.day==='So'?suggestedWorkout(p):p.day==='Fr'?p.workoutId:suggestedWorkout(p));
 if(!allowed.includes(id))return;
 const w=HYBRID_WORKOUTS[id],same=old?.workoutId===id?old:null;
 hybridEditing={...p,key,workoutId:id};
 document.getElementById('hybridDialogTitle').textContent=`W${p.week} · ${p.optional?'Zusatztermin':p.day}`;
 const ids=[...w.ids,...(same?.sets||[]).map(s=>s.exercise).filter(ex=>!w.ids.includes(ex))].filter((ex,i,arr)=>arr.indexOf(ex)===i);
 const dateISO=same?.dateISO||new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
 document.getElementById('hybridFields').innerHTML=`<label>Tatsächlich trainiert<select id="hWorkout">${allowed.map(value=>`<option value="${value}" ${value===id?'selected':''}>${HYBRID_WORKOUTS[value].name}</option>`).join('')}</select></label>
 <label>Datum<input id="hDate" type="date" value="${dateISO}" required></label><label>Variante<select id="hMode"><option value="standard" ${same?.mode!=='short'?'selected':''}>Standard · 30–40 Min Kraft</option><option value="short" ${same?.mode==='short'?'selected':''}>Kurz · ca. 20 Min</option></select></label>
 <label>Abschluss<select id="hStatus"><option value="completed" ${completed(same||{})?'selected':''}>Abgeschlossen</option><option value="partial" ${same&&!completed(same)?'selected':''}>Verkürzt / abgebrochen</option></select></label><p>${w.pairs}</p>
 ${ids.map(exId=>{const ex=HYBRID_EXERCISES[exId],core=!!ex.unit,weighted=(!core||ex.weighted)&&!ex.bodyweight,last=previousExercise(exId,key),count=Math.max(core||ex.accessory?2:3,...(same?.sets||[]).filter(s=>s.exercise===exId).map(s=>s.set));return `<fieldset><legend>${ex.name} · ${exercisePrescription(exId)}</legend><p>${ex.hint}</p>${last?`<p class="last-set">Zuletzt: ${last.weight!==''?escapeHTML(last.weight)+' kg × ':''}${escapeHTML(last.reps)} ${ex.unit||'Wdh.'}</p>`:''}${Array.from({length:count},(_,n)=>{const prior=same?.sets?.find(s=>s.exercise===exId&&s.set===n+1),prefix='s-'+exId+'-'+(n+1);return `<div class="set-row" data-exercise="${exId}" data-set="${n+1}"><span>${n+1}.</span>${weighted?`<label>${core||ex.single?'kg (1 Hantel)':'kg/Hantel'}<input id="${prefix}-weight" data-field="weight" type="number" min="0" max="24" step="any" inputmode="decimal" value="${escapeHTML(prior?.weight??'')}"></label>`:''}<label>${ex.unit||'Wdh.'}<input id="${prefix}-reps" data-field="reps" type="number" min="1" max="${core?600:100}" inputmode="numeric" value="${escapeHTML(prior?.reps??'')}"></label>${!core?`<label>Reserve<input id="${prefix}-rir" data-field="rir" type="number" min="0" max="10" inputmode="numeric" value="${escapeHTML(prior?.rir??'')}" placeholder="optional"></label>`:''}</div>`}).join('')}${weighted?`<button type="button" class="secondary copy-weight" data-exercise="${exId}">Gewicht aus Satz 1 übernehmen</button>`:''}</fieldset>`}).join('')}
 ${w.kind==='circuit'?`<label>${w.metric==='rounds'?'AMRAP-Dauer':'Zeitlimit'} (Minuten)<input id="hCircuitMinutes" type="number" min="1" max="30" required value="${escapeHTML(same?.circuitMinutes||String(p.week===5?12:w.defaultMinutes))}"></label><label>Zirkelgewicht je Hantel (kg)<input id="hWeight" type="number" min="0" max="24" step="any" required inputmode="decimal" value="${escapeHTML(same?.weight||'')}"></label>${w.metric==='rounds'?`<label>Vollständige Runden<input id="hRounds" type="number" min="0" max="100" required value="${escapeHTML(same?.rounds??'')}"></label><label>Zusätzliche Wiederholungen (optional)<input id="hExtraReps" type="number" min="0" max="1000" value="${escapeHTML(same?.extraReps||'')}"></label>`:`<label>Erreichte Wiederholungen (max. ${w.totalReps})<input id="hReps" type="number" min="1" max="${w.totalReps}" required value="${escapeHTML(same?.reps||'')}"></label><label>Benötigte Zeit in Sekunden (optional, z. B. 15:30 = 930)<input id="hElapsedSeconds" type="number" min="1" max="1800" value="${escapeHTML(same?.elapsedSeconds||'')}"></label>`}<p>Einarmige Wiederholungen und Kombinationen immer gleich zählen. Abweichungen und unterschiedliche Übungsgewichte in die Notiz. Core ist hier optional.</p>`:''}
 <label>Gesamtdauer inklusive Aufwärmen (Minuten)<input id="hDuration" type="number" min="1" max="180" required value="${escapeHTML(same?.duration||'')}"></label><label>Gesamtanstrengung RPE 1–10 (optional)<input id="hRpe" type="number" min="1" max="10" value="${escapeHTML(same?.rpe||'')}"></label>
 ${w.kind==='run'?`<label>Distanz in km (optional)<input id="hDistance" type="number" min="0" max="100" step="any" value="${escapeHTML(same?.distance||'')}"></label>`:''}
 <label>Notiz<textarea id="hNote" maxlength="2000">${escapeHTML(same?.note||'')}</textarea></label><p>Nur tatsächlich absolvierte Sätze ausfüllen. Leere Wiederholungsfelder werden ausgelassen. Für einen vollständigen Krafttag je Hauptübung 2 Sätze; sonst „Verkürzt / abgebrochen“ wählen. Core und Zusatzübungen werden nur gezählt, wenn eingetragen.</p>`;
 if(draft?.workoutId===id&&draft.values&&typeof draft.values==='object')for(const [field,value]of Object.entries(draft.values)){const el=document.getElementById(field);if(el&&el.closest('#hybridFields')&&typeof value==='string')el.value=value;}
 document.getElementById('draftStatus').textContent=draft?'Entwurf wiederhergestellt · bitte nach dem Training ausdrücklich speichern.':'';
 document.getElementById('hybridFields').oninput=saveHybridDraft;
 document.getElementById('hybridFields').onchange=saveHybridDraft;
 document.getElementById('hWorkout').addEventListener('change',event=>{
  if(!confirm('Training wechseln? Bitte bisherige Eingaben zuerst speichern, wenn du sie behalten möchtest.')){event.target.value=id;return;}
  openHybrid(key,event.target.value);saveHybridDraft();
 });
 document.getElementById('hMode').addEventListener('change',event=>{if(w.kind==='circuit'){document.getElementById('hCircuitMinutes').value=event.target.value==='short'||p.week===5?'12':String(w.defaultMinutes);saveHybridDraft();}});
 document.querySelectorAll('.copy-weight').forEach(button=>button.addEventListener('click',()=>{
  const exId=button.dataset.exercise,value=document.getElementById('s-'+exId+'-1-weight').value;
  if(value==='')return;
  document.querySelectorAll(`[data-exercise="${exId}"] [data-field="weight"]`).forEach(input=>input.value=value);saveHybridDraft();
 }));
 document.getElementById('hybridModal').hidden=false;
}
function closeHybrid(){if(hybridEditing)saveHybridDraft();document.getElementById('hybridModal').hidden=true;hybridEditing=null;}
document.getElementById('closeHybrid').addEventListener('click',closeHybrid);
document.getElementById('hybridForm').addEventListener('submit',event=>{
 event.preventDefault();if(!hybridEditing)return;
 try{
  const sets=[];
  document.querySelectorAll('#hybridFields .set-row').forEach(row=>{
   const read=field=>row.querySelector(`[data-field="${field}"]`)?.value||'',reps=read('reps');if(!reps)return;
   const ex=HYBRID_EXERCISES[row.dataset.exercise],weight=read('weight');
   if((!ex.unit||ex.weighted)&&!ex.bodyweight&&weight==='')throw Error('Gewicht für jeden absolvierten belasteten Satz eintragen.');
   sets.push({exercise:row.dataset.exercise,set:Number(row.dataset.set),weight:ex.bodyweight?'0':weight,reps,rir:read('rir')});
  });
  const read=id=>document.getElementById(id)?.value||'';
  const entry={...hybridEditing,schemaVersion:9,dateISO:read('hDate'),mode:read('hMode'),status:read('hStatus'),duration:read('hDuration'),rpe:read('hRpe'),note:read('hNote'),sets,weight:read('hWeight'),rounds:read('hRounds'),circuitMinutes:read('hCircuitMinutes'),extraReps:read('hExtraReps'),reps:read('hReps'),elapsedSeconds:read('hElapsedSeconds'),distance:read('hDistance')};
  const previous=structuredClone(logs);logs=[...logs.filter(l=>l.key!==entry.key),entry];
  if(!storeTrainingChange()){logs=previous;return;}
  try{localStorage.removeItem(draftKey(hybridEditing.key));}catch(_){}
  hybridEditing=null;document.getElementById('hybridModal').hidden=true;render();
 }catch(error){alert(error.message);}
});
document.getElementById('blockSelect').value=appBlock;
document.getElementById('blockSelect').addEventListener('change',async event=>{
 if(event.target.value===appBlock)return;
 closeHybrid();closeModal();accountEpoch++;appBlock=event.target.value;currentWeek=1;
 try{localStorage.setItem('sf_active_block',appBlock);}catch(_){}
 loadDeviceState();syncMessage=storageFault?syncMessage:account?'Cloud wird geladen …':'Nur auf diesem Gerät gespeichert';render();updateCloudUI();await syncCloud();
});
function updateRestTimer(){const seconds=Math.max(0,Math.ceil((restDeadline-Date.now())/1000));document.getElementById('restStatus').textContent=restDeadline?(seconds?'Pause '+seconds+' s':'Pause beendet'):'Pausentimer';}
document.getElementById('startRest').addEventListener('click',()=>{restDeadline=Date.now()+90000;updateRestTimer();});
document.getElementById('stopRest').addEventListener('click',()=>{restDeadline=0;updateRestTimer();});
setInterval(updateRestTimer,1000);
