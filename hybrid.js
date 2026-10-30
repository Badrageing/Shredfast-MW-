// Eight-week strength/endurance block. Historical block2 storage is unchanged.
let appBlock = 'hybrid1';
try { if (localStorage.getItem('sf_active_block') === 'block2') appBlock = 'block2'; } catch (_) {}
const HYBRID_EXERCISES = {
 squat: {name:'Kniebeuge mit zwei Kurzhanteln',target:'8–12',hint:'Hanteln seitlich oder an den Schultern; kontrolliert und so tief wie sauber möglich.'},
 floor: {name:'Floor Press',target:'8–12',hint:'Auf dem Boden drücken; Oberarme kontrolliert absetzen. Gewicht je Hantel.'},
 rdl: {name:'Rumänisches Kreuzheben',target:'8–12',hint:'Hüfte zurück, Rücken stabil; Dehnung der Beinrückseite. Zwei Hanteln.'},
 row: {name:'Einarmiges Rudern',target:'8–15 / Seite',hint:'Freie Hand am eigenen Oberschenkel abstützen. Beide Seiten; schwächere Seite bestimmt die Wiederholungen.'},
 lunge: {name:'Rückwärts-Ausfallschritt',target:'8–12 / Seite',hint:'Beide Seiten; zum Einstieg bei Bedarf ohne Hanteln.'},
 press: {name:'Schulterdrücken',target:'8–12',hint:'Stehend, Bauch fest, ohne Schwung oder Hohlkreuz.'},
 deadbug: {name:'Dead Bug',target:'6–10 / Seite',unit:'Wdh./Seite',hint:'Langsam ausatmen, unteren Rücken stabil halten.'},
 reverse: {name:'Reverse Crunch',target:'10–15',unit:'Wdh.',hint:'Becken einrollen statt Beine mit Schwung bewegen.'},
 side: {name:'Seitstütz',target:'20–40 s / Seite',unit:'Sek./Seite',hint:'Beide Seiten; bei Bedarf mit angewinkelten Knien.'}
};
const HYBRID_WORKOUTS = {
 'strength-a': {name:'Ganzkörper A',kind:'strength',ids:['squat','floor','rdl','row','deadbug','side'],pairs:'Paar 1: Kniebeuge + Floor Press. Paar 2: RDL + Rudern. Danach Core.'},
 'strength-b': {name:'Ganzkörper B',kind:'strength',ids:['lunge','row','rdl','press','reverse','side'],pairs:'Paar 1: Ausfallschritt + Rudern. Paar 2: RDL + Schulterdrücken. Danach Core.'},
 'circuit-press': {name:'AMRAP15 Press Up + Core',kind:'circuit',ids:['reverse','side'],pairs:'15 Minuten: 10 Press Ups → 10 Deadlifts → 10 Press → 10 Row. Wiederholen; Technik vor Tempo. Wiederholungszählung immer gleich halten. Bei einarmigem Row insgesamt 10, also 5 je Seite. Das ist die Zählweise dieses neuen Blocks; alte Rundenzahlen nur bei gleicher Ausführung vergleichen.'},
 'easy-run': {name:'Locker joggen / Run-Walk',kind:'run',ids:[],pairs:'Optional 20–30 Minuten. Ganze Sätze sprechen können, RPE etwa 3–4/10. Als Laufeinstieg 1–2 Minuten laufen / 1 Minute gehen. Kein Tempolauf.'}
};
const HYBRID_PLAN = Array.from({length:8},(_,i)=>i+1).flatMap(week => [
 {week,day:'Mo',workoutId:'strength-a'}, {week,day:'Mi',workoutId:'strength-b'},
 {week,day:'Fr',workoutId:'circuit-press'}, {week,day:'So',workoutId:'easy-run',optional:true}
]);
const getPlan = () => appBlock === 'block2' ? BLOCK2_PLAN : HYBRID_PLAN;
const localLogsKey = () => appBlock === 'block2' ? STORAGE_KEY : 'sf_hybrid1_logs';
function normalizeHybridEntry(row,plan) {
 const w=HYBRID_WORKOUTS[plan.workoutId];
 const clean={key:row.key,week:plan.week,day:plan.day,workoutId:plan.workoutId};
 for(const field of ['date','dateISO','mode','duration','rpe','note','weight','rounds','circuitMinutes','distance']) {
  if(row[field]!=null && !['string','number'].includes(typeof row[field])) throw Error('Ungültiges Datenfeld.');
  clean[field]=String(row[field]??'');
  if(clean[field].length>(field==='note'?2000:100)) throw Error('Datenfeld zu lang.');
 }
 const numeric=(value,min,max,integer=false)=>value!=='' && Number.isFinite(Number(value)) && Number(value)>=min && Number(value)<=max && (!integer || Number.isInteger(Number(value)));
 if(!['standard','short'].includes(clean.mode)) throw Error('Ungültige Trainingsvariante.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(clean.dateISO) || isNaN(Date.parse(clean.dateISO)) || new Date(clean.dateISO+'T12:00:00Z').toISOString().slice(0,10)!==clean.dateISO) throw Error('Bitte gültiges Datum wählen.');
 clean.date=new Date(clean.dateISO+'T12:00:00').toLocaleDateString('de-DE');
 if(!numeric(clean.duration,1,120,true) || !numeric(clean.rpe,1,10,true)) throw Error('Bitte Gesamtdauer und Anstrengung (1–10) eintragen.');
 if(!Array.isArray(row.sets) || row.sets.length>16) throw Error('Ungültige Satzliste.');
 const seen=new Set();
 clean.sets=row.sets.map(s=>{
  if(!s || !w.ids.includes(s.exercise)) throw Error('Übung passt nicht zur Einheit.');
  const core=!!HYBRID_EXERCISES[s.exercise].unit;
  const key=s.exercise+'-'+s.set;
  if(seen.has(key) || !numeric(String(s.set),1,core?2:3,true)) throw Error('Ungültige oder doppelte Satznummer.');
  seen.add(key);
  for(const v of [s.reps,s.weight,s.rir]) if(v!=null && !['string','number'].includes(typeof v)) throw Error('Ungültiger Satzwert.');
  const reps=String(s.reps??''),weight=String(s.weight??''),rir=String(s.rir??'');
  if(!numeric(reps,1,core?300:100,true) || (!core && !numeric(weight,0,24)) || (rir!=='' && !numeric(rir,0,10,true))) throw Error('Satzwerte prüfen: kg/Hantel 0–24, positive ganze Wiederholungen, Reserve 0–10.');
  return {exercise:s.exercise,set:Number(s.set),weight:core?'':weight,reps,rir:core?'':rir};
 });
 if(w.kind==='strength' && w.ids.slice(0,4).some(id=>clean.sets.filter(s=>s.exercise===id).length<2)) throw Error('Mindestens 2 Sätze je Kraftübung erforderlich.');
 const coreIds=w.ids.filter(id=>HYBRID_EXERCISES[id].unit);
 if(coreIds.length) {
  const complete=coreIds.filter(id=>clean.sets.filter(s=>s.exercise===id).length===2).length;
  if(complete<(clean.mode==='short'?1:coreIds.length)) throw Error('Core ergänzen: Kurz eine Übung mit 2 Sätzen, Standard beide Übungen mit je 2 Sätzen.');
 }
 if(w.kind==='circuit' && (!numeric(clean.weight,0,24) || !numeric(clean.rounds,1,100,true) || !['10','12','15'].includes(clean.circuitMinutes) || Number(clean.duration)<Number(clean.circuitMinutes))) throw Error('Zirkel: Gewicht, vollständige Runden und passende Dauer eintragen.');
 if(w.kind==='run' && clean.distance!=='' && !numeric(clean.distance,0,50)) throw Error('Ungültige Laufdistanz.');
 clean.mins='';clean.secs='';
 return clean;
}
let hybridEditing = null;
const oldRenderPlan = renderPlan, oldRenderProgress = renderProgress, oldRenderHeader = renderHeader;
renderPlan = function() { if(appBlock==='block2') return oldRenderPlan(); renderHybridPlan(); };
renderProgress = function() { if(appBlock==='block2') return oldRenderProgress(); renderHybridProgress(); };
renderHeader = function() {
 document.getElementById('blockTitle').textContent = appBlock==='block2' ? '10 Wochen · bisheriger Block' : '8 Wochen · Kraft & Ausdauer';
 document.getElementById('blockSubtitle').textContent = appBlock==='block2' ? 'ShredFast · Archiv / bisheriger Plan' : '2 × Kraft · 1 × Zirkel · Core · Laufen optional';
 document.getElementById('totalTarget').textContent = appBlock==='block2' ? '/30' : '/24';
 if(appBlock==='block2') return oldRenderHeader();
 const done=logs.filter(l=>l.day!=='So').length, pct=Math.round(done/24*100);
 document.getElementById('totalDone').textContent=done;
 document.getElementById('progressFill').style.width=pct+'%';
 document.getElementById('progressPercent').textContent=pct+'%';
};

function targetSets(week,mode='standard') { return mode==='short' || week===1 || week===5 ? 2 : 3; }
function phaseHint(week) {
 if(week===1) return 'Einstieg: 2 Sätze je Kraftübung, etwa 3 Wiederholungen in Reserve. Zirkel kontrolliert, kein Rekordversuch.';
 if(week===5) return 'Entlastung: 2 Sätze, etwas leichter, 3–4 Wiederholungen in Reserve. Zirkel nur locker, bei Müdigkeit durch Gehen ersetzen.';
 return 'Aufbau: 3 Sätze je Kraftübung, meist 1–2 saubere Wiederholungen in Reserve. Alle Sätze am oberen Ende? Nächstes Mal kleinste Gewichtsstufe erhöhen.';
}
function renderHybridPlan() {
 const plans=HYBRID_PLAN.filter(p=>p.week===currentWeek);
 document.getElementById('content').innerHTML=`
 <div class="week-tabs">${Array.from({length:8},(_,i)=>`<button class="${currentWeek===i+1?'active':''}" onclick="window.setWeek(${i+1})">W${i+1}</button>`).join('')}</div>
 <div class="note-box"><strong>Woche ${currentWeek} · ${currentWeek===5?'Entlastung':'Kraft + Kondition'}</strong><br>${phaseHint(currentWeek)}<br><br><strong>Pro Krafteinheit:</strong> 3–4 Min aufwärmen, leichte Vorbereitungssätze. Übungen paarweise abwechseln: 30–45 s wechseln, nach dem Paar 75–90 s pausieren; bei Bedarf länger. Keine gehetzten Zirkel. Zwischen Sätzen derselben Übung ungefähr 2 Min oder mehr.<br><strong>20-Minuten-Version:</strong> 2 Sätze pro Kraftübung, 1 Core-Übung mit 2 Sätzen. Bei Zeitdruck weniger Sätze statt kürzerer Pausen.<br><strong>30–40 Minuten:</strong> geplante Kraftsätze + beide Core-Übungen je 2 Sätze.</div>
 ${plans.map(p=>{const w=HYBRID_WORKOUTS[p.workoutId],key=`W${p.week}-${p.day}`,log=logs.find(l=>l.key===key);return `<div class="hybrid-card">
 <div class="hybrid-heading"><div><strong>${p.day} · ${w.name}</strong><p>${p.optional?'Optional · 20–30 Min':w.kind==='strength'?'20 Min kurz / 30–40 Min Standard':'20–25 Min inkl. Core'}${log?' · ✓ '+escapeHTML(log.date):''}</p></div><button onclick="openHybrid('${key}')">${log?'Bearbeiten':'Loggen'}</button></div>
 <p>${w.pairs}${w.kind==='circuit'?' Ziel: etwa RPE 7–8/10, kurze Pausen sind erlaubt.':''}</p>
 ${w.kind==='strength'?`<ul>${w.ids.map((id,i)=>`<li>${HYBRID_EXERCISES[id].name}: ${i<4?targetSets(p.week):2} × ${HYBRID_EXERCISES[id].target}</li>`).join('')}</ul>`:''}
 ${w.kind==='circuit'?'<p>3 Min aufwärmen + 15 Min AMRAP + 4–6 Min Core: Reverse Crunch 2 × 10–15 und Seitstütz 2 × 20–40 s je Seite. Kurzversion: 12 Min AMRAP + eine Core-Übung. 12 und 15 Minuten getrennt vergleichen. In Woche 5 nur 10–12 Min locker.</p>':''}
 ${log?`<div class="note-box">${hybridSummary(log)}<br><button class="secondary" onclick="window.deleteLog('${key}')">Eintrag löschen</button></div>`:''}
 </div>`}).join('')}
 <div class="note-box"><strong>Core ≠ lokale Fettverbrennung.</strong> Bauchtraining stärkt die Muskulatur; sichtbare Definition hängt auch vom gesamten Körperfett, Ernährung und Licht ab. Kraft, Ausdauer und Erholung gemeinsam beurteilen.</div>`;
}

function hybridSummary(log) {
 const w=HYBRID_WORKOUTS[log.workoutId];
 let text=`${escapeHTML(log.duration)} Min · ${log.mode==='short'?'Kurz':'Standard'}`;
 if(w.kind==='strength') text+='<br>'+w.ids.slice(0,4).map(id=>{const sets=log.sets.filter(s=>s.exercise===id);return `${HYBRID_EXERCISES[id].name}: ${sets.map(s=>escapeHTML(s.weight)+' kg × '+escapeHTML(s.reps)).join(' / ')}`}).join('<br>');
 if(w.kind==='circuit') text+=` · AMRAP ${escapeHTML(log.circuitMinutes)} Min · ${escapeHTML(log.rounds)} Runden · ${escapeHTML(log.weight)} kg/Hantel`;
 if(w.kind==='run') text+=` · ${escapeHTML(log.distance || '–')} km · RPE ${escapeHTML(log.rpe)}/10`;
 const coreSets=log.sets.filter(s=>HYBRID_EXERCISES[s.exercise]?.unit);
 if(coreSets.length) text+='<br>Core: '+coreSets.map(s=>`${HYBRID_EXERCISES[s.exercise].name} ${escapeHTML(s.reps)} ${HYBRID_EXERCISES[s.exercise].unit}`).join(' · ');
 if(log.note) text+='<br>'+escapeHTML(log.note);
 return text;
}
function renderHybridProgress() {
 const ordered=[...logs].sort((a,b)=>HYBRID_PLAN.findIndex(p=>p.week===a.week&&p.day===a.day)-HYBRID_PLAN.findIndex(p=>p.week===b.week&&p.day===b.day));
 document.getElementById('content').innerHTML=`<div class="details-title">Hybrid-Block · ${logs.filter(l=>l.day!=='So').length}/24 Kerneinheiten · ${logs.filter(l=>l.day==='So').length} optionale Läufe</div>
 <div class="note-box">Steigerung prüfen: gleiche Übung, saubere Technik, Gewicht je Hantel und Wiederholungen je Satz. Vergleiche Zirkel nur bei gleicher Dauer, Last und Zählweise. Wochen 1 und 5 haben weniger Sätze.</div>
 ${ordered.map(l=>`<div class="hybrid-card"><strong>W${l.week} ${l.day} · ${HYBRID_WORKOUTS[l.workoutId].name}</strong><p>${escapeHTML(l.date)}</p>${hybridSummary(l)}<p><button onclick="openHybrid('${l.key}')">Bearbeiten</button></p></div>`).join('')||'<div class="empty-state">Noch keine Einheiten im neuen Block. Der bisherige Block ist über die Auswahl oben erreichbar.</div>'}`;
}

function openHybrid(key) {
 const p=HYBRID_PLAN.find(p=>key===`W${p.week}-${p.day}`);if(!p || appBlock!=='hybrid1')return;
 const w=HYBRID_WORKOUTS[p.workoutId],old=logs.find(l=>l.key===key);
 hybridEditing={...p,key};
 const mode=old?.mode||'standard';
 document.getElementById('hybridDialogTitle').textContent=`W${p.week} ${p.day} · ${w.name}`;
 document.getElementById('hybridFields').innerHTML=`
 <label>Datum<input id="hDate" type="date" required value="${old?.dateISO || new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10)}"></label>
 <label>Variante<select id="hMode"><option value="standard" ${mode==='standard'?'selected':''}>Standard · 30–40 Min Kraft / 15 Min Zirkel</option><option value="short" ${mode==='short'?'selected':''}>Kurz · ca. 20 Min / 12 Min Zirkel</option></select></label>
 <p>${w.pairs}</p>
 ${w.ids.map((id,i)=>{const ex=HYBRID_EXERCISES[id],core=!!ex.unit;return `<fieldset><legend>${ex.name} · ${ex.target}</legend><p>${ex.hint}</p>
 ${Array.from({length:core?2:3},(_,n)=>{const prior=old?.sets?.filter(s=>s.exercise===id)[n];return `<div class="set-row" data-exercise="${id}" data-set="${n+1}"><span>${n+1}.</span>${core?'':`<label>kg/Hantel<input type="number" step="0.5" min="0" max="24" data-field="weight" value="${escapeHTML(prior?.weight||'')}" inputmode="decimal"></label>`}<label>${core?ex.unit:'Wdh.'}<input type="number" min="1" max="${core?300:100}" data-field="reps" value="${escapeHTML(prior?.reps||'')}" inputmode="numeric"></label>${core?'':`<label>Reserve<input type="number" min="0" max="10" data-field="rir" value="${escapeHTML(prior?.rir||'')}" placeholder="0–3" inputmode="numeric"></label>`}</div>`}).join('')}</fieldset>`}).join('')}
 ${w.kind==='circuit'?`<label>AMRAP-Dauer (ohne Aufwärmen/Core)<select id="hCircuitMinutes">${[10,12,15].map(m=>`<option value="${m}" ${Number(old?.circuitMinutes||15)===m?'selected':''}>${m} Minuten</option>`).join('')}</select></label><label>Gewicht je Hantel (kg)<input id="hWeight" type="number" min="0" max="24" step="0.5" required value="${escapeHTML(old?.weight||'')}" inputmode="decimal"></label><label>Vollständige Runden<input id="hRounds" type="number" min="1" max="100" required value="${escapeHTML(old?.rounds||'')}" inputmode="numeric"></label><p>Gewicht so wählen, dass alle Übungen kontrolliert bleiben. Nicht die 18 kg aus dem anderen Zirkel automatisch übernehmen. Zusätzliche Wiederholungen in die Notiz.</p>`:''}
 <label>Gesamtdauer (Minuten)<input id="hDuration" type="number" min="1" max="120" required value="${escapeHTML(old?.duration||'')}" inputmode="numeric"></label>
 <label>Gesamtanstrengung RPE 1–10<input id="hRpe" type="number" min="1" max="10" required value="${escapeHTML(old?.rpe||'')}" inputmode="numeric"></label>
 ${w.kind==='run'?`<label>Distanz (km, optional)<input id="hDistance" type="number" min="0" max="50" step="0.01" value="${escapeHTML(old?.distance||'')}" inputmode="decimal"></label>`:''}
 <label>Notiz<textarea id="hNote" maxlength="2000">${escapeHTML(old?.note||'')}</textarea></label>
 <p>Pro Kraftübung mindestens 2 vollständige Sätze eintragen. Core: Standard beide Übungen je 2 Sätze, Kurz eine Übung mit 2 Sätzen. Gewicht immer je Hantel; einseitige Wiederholungen je Seite, schwächere Seite eintragen. Reserve = geschätzte weitere saubere Wiederholungen.</p>`;
 document.getElementById('hMode').addEventListener('change',event=>{
  if(w.kind==='circuit') document.getElementById('hCircuitMinutes').value=event.target.value==='short'?'12':p.week===5?'12':'15';
 });
 document.getElementById('hybridModal').hidden=false;
}
function closeHybrid() { document.getElementById('hybridModal').hidden=true;hybridEditing=null; }
document.getElementById('closeHybrid').addEventListener('click',closeHybrid);
document.getElementById('hybridForm').addEventListener('submit',event=>{
 event.preventDefault();if(!hybridEditing)return;
 try {
 const w=HYBRID_WORKOUTS[hybridEditing.workoutId],sets=[];
 document.querySelectorAll('#hybridFields .set-row').forEach(row=>{
  const read=f=>row.querySelector(`[data-field="${f}"]`)?.value||'';
  const reps=read('reps'),weight=read('weight'),rir=read('rir'),core=!!HYBRID_EXERCISES[row.dataset.exercise].unit;
  if(!reps && !weight && !rir)return;
  if(!reps || (!core && weight===''))throw Error('Bitte jeden begonnenen Satz vollständig ausfüllen.');
  sets.push({exercise:row.dataset.exercise,set:Number(row.dataset.set),weight:core?'':weight,reps,rir:core?'':rir});
 });
 const read=id=>document.getElementById(id)?.value||'';
 const dateISO=read('hDate');
 const entry={key:hybridEditing.key,week:hybridEditing.week,day:hybridEditing.day,workoutId:hybridEditing.workoutId,dateISO,date:new Date(dateISO+'T12:00:00').toLocaleDateString('de-DE'),mode:read('hMode'),duration:read('hDuration'),rpe:read('hRpe'),note:read('hNote'),sets,weight:read('hWeight'),rounds:read('hRounds'),circuitMinutes:read('hCircuitMinutes'),distance:read('hDistance'),mins:'',secs:''};
 if(w.kind==='strength' && w.ids.slice(0,4).some(id=>sets.filter(s=>s.exercise===id).length<2))throw Error('Mindestens 2 Sätze pro Kraftübung eintragen.');
 const prev=structuredClone(logs);logs=[...logs.filter(l=>l.key!==entry.key),entry];
 if(!storeTrainingChange()){logs=prev;return;}
 closeHybrid();render();
 }catch(error){alert(error.message);}
});
document.getElementById('blockSelect').value=appBlock;
document.getElementById('blockSelect').addEventListener('change',async event=>{
 if(event.target.value===appBlock)return;
 // A block switch invalidates in-flight requests just like an account switch.
 accountEpoch++;appBlock=event.target.value;currentWeek=1;closeModal();closeHybrid();
 try{localStorage.setItem('sf_active_block',appBlock)}catch(_){}
 loadDeviceState();syncMessage=storageFault?syncMessage:account?'Cloud wird geladen …':'Nur auf diesem Gerät gespeichert';
 render();updateCloudUI();await syncCloud();
});
