// Focused presentation; existing persistence and training logic stay authoritative.
const minimalHeader=renderHeader;
renderHeader=function(){minimalHeader();document.getElementById('blockTitle').textContent=appBlock==='hybrid1'?'Training':'Trainingsarchiv';document.getElementById('blockSubtitle').textContent='SHREDFAST';document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===currentTab));};
const minimalOpen=openHybrid;
openHybrid=function(key,chosenId){
 minimalOpen(key,chosenId);if(!hybridEditing)return;
 const fields=document.getElementById('hybridFields'),w=HYBRID_WORKOUTS[hybridEditing.workoutId];
 document.getElementById('hybridDialogTitle').textContent=w.name;
 const options=document.createElement('details');options.className='minimal-details';options.innerHTML='<summary>Datum & Trainingsoptionen</summary>';fields.prepend(options);
 for(const id of ['hWorkout','hMode','hStatus'])options.append(document.getElementById(id).closest('label'));
 fields.querySelectorAll(':scope > p').forEach(p=>{p.className='form-help';options.append(p);});
 const extra=document.createElement('details');extra.className='minimal-details';extra.innerHTML='<summary>Notiz & Anstrengung</summary>';fields.append(extra);
 for(const id of ['hRpe','hNote'])extra.append(document.getElementById(id).closest('label'));
 fields.querySelectorAll('fieldset').forEach((fieldset,i)=>{
  const id=fieldset.querySelector('.set-row').dataset.exercise,ex=HYBRID_EXERCISES[id];
  const details=document.createElement('details');details.className='exercise-fold';details.open=i===0&&w.kind==='strength';
  const summary=document.createElement('summary');details.append(summary);fieldset.replaceWith(details);details.append(fieldset);
  const update=()=>{const count=[...fieldset.querySelectorAll('[data-field=reps]')].filter(input=>input.value!=='').length;summary.innerHTML=`<span>${ex.name}<small>${exercisePrescription(id)}</small></span><b>${count}/${plannedSets(id)}</b>`;};update();fieldset.addEventListener('input',update);
  fieldset.querySelector('legend').hidden=true;
  const advice=fieldset.querySelector('.progress-advice');if(advice){const more=document.createElement('details');more.innerHTML='<summary>Gewichtsempfehlung</summary>';advice.replaceWith(more);more.append(advice);}
  fieldset.querySelector('.copy-weight')?.remove();
  fieldset.querySelectorAll('.repeat-set').forEach((button,index)=>{button.textContent='↳';button.title=index?'Vorherigen Satz übernehmen':'Letzten Satz übernehmen';});
 });
};
// Secondary utilities remain reachable, outside the everyday tracking flow.
const settings=document.querySelector('.backup-panel');settings.querySelector('summary').textContent='Einstellungen & Daten';settings.append(document.querySelector('.block-picker'));
const libraryButton=document.querySelector('[data-tab=db]');libraryButton.textContent='Workout-Bibliothek';settings.append(libraryButton);
document.getElementById('content').after(settings);
document.querySelector('[data-tab=progress]').textContent='Dashboard';
// Reveal invalid fields before the browser attempts to focus them.
document.getElementById('hybridForm').addEventListener('invalid',event=>{
 let parent=event.target.parentElement;
 while(parent&&parent.id!=='hybridForm'){if(parent.tagName==='DETAILS')parent.open=true;if(parent.hidden)parent.hidden=false;parent=parent.parentElement;}
},true);


const localDate=date=>new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,10);
const freeDraftIndex=()=>`sf_free_drafts_v1_${account?.id||'local'}`;
function workoutDrafts(){
 try{return JSON.parse(localStorage.getItem(freeDraftIndex())||'[]').filter(x=>isFreeSessionKey(x.key)&&readDraft(x.key)&&!logs.some(l=>l.key===x.key)).map(x=>({...x,id:readDraft(x.key).workoutId})).filter(x=>HYBRID_WORKOUTS[x.id]);}catch(_){return [];}
}
function startWorkout(id){
 if(!HYBRID_WORKOUTS[id]||HYBRID_WORKOUTS[id].kind==='choice')return;
 const drafts=workoutDrafts(),existing=drafts.find(x=>x.id===id),key=existing?.key||'F-'+crypto.randomUUID();
 openHybrid(key,existing?undefined:id);saveHybridDraft();
 try{localStorage.setItem(freeDraftIndex(),JSON.stringify([...drafts.filter(x=>x.id!==id),{key,id}]));}catch(_){}
}
renderHybridPlan=function(){
 const today=localDate(new Date()),last=[...logs].filter(l=>l.dateISO<=today&&completed(l)&&HYBRID_WORKOUTS[l.workoutId]?.kind==='strength').sort(newestTraining)[0];
 const next=last?.workoutId==='strength-a'?'strength-b':'strength-a',drafts=workoutDrafts();
 document.getElementById('content').innerHTML=`<div class="minimal-title"><h2>Was trainierst du heute?</h2></div><p class="empty-copy">${last?`Zuletzt ${HYBRID_WORKOUTS[last.workoutId].name} · ${escapeHTML(last.date)}`:'Freie Auswahl. Trainiere A und B im Wechsel.'}</p>`+Object.entries(HYBRID_WORKOUTS).filter(([id,w])=>w.kind!=='choice').map(([id,w])=>`<article class="session-line"><div><span class="session-type">${id===next?'Als Nächstes empfohlen':w.kind==='strength'?'Kraft':w.kind==='circuit'?'ShredFast':'Ausdauer'}</span><h3>${w.name}</h3><p>${w.kind==='strength'?'3 Sätze groß · 2 Sätze klein':w.kind==='circuit'?`${w.defaultMinutes} Min · Anleitung im Workout`:'20–30 Min locker'}</p></div><button onclick="startWorkout('${id}')">${drafts.some(x=>x.id===id)?'Fortsetzen':'Start'}</button></article>`).join('');
};
renderHybridProgress=function(){
 const today=new Date(),start=new Date(today);start.setDate(start.getDate()-6);
 const from=localDate(start),to=localDate(today),recent=logs.filter(l=>l.dateISO>=from&&l.dateISO<=to);
 const strength=recent.filter(l=>HYBRID_WORKOUTS[l.workoutId]?.kind==='strength'&&completed(l)).length,circuit=recent.filter(l=>HYBRID_WORKOUTS[l.workoutId]?.kind==='circuit'&&completed(l)).length,core=recent.reduce((n,l)=>n+l.sets.filter(s=>HYBRID_EXERCISES[s.exercise]?.unit).length,0);
 const ids=[...new Set(logs.filter(l=>l.dateISO<=to&&HYBRID_WORKOUTS[l.workoutId]?.kind==='strength').flatMap(l=>l.sets.map(s=>s.exercise)))];
 const statuses={increase:'Steigern',check:'Reserve prüfen',hold:'Beibehalten',limit:'24 kg erreicht',empty:'Noch offen'};
 document.getElementById('content').innerHTML=`<div class="minimal-title"><h2>Dashboard</h2><span>Letzte 7 Tage</span></div><div class="pro-stats"><div class="pro-stat"><strong>${strength}/2</strong><span>Krafttage · Ziel 2–3</span></div><div class="pro-stat"><strong>${circuit}/1</strong><span>Zirkel</span></div><div class="pro-stat"><strong>${core}</strong><span>Core-Sätze</span></div></div><h3 class="section-label">Fortschritt</h3>${ids.map(id=>{const p=exerciseProgress(id,'',to);return `<details class="progress-line"><summary><span>${HYBRID_EXERCISES[id].name}<small>${escapeHTML(p.trend)}</small></span><b class="${p.state}">${statuses[p.state]}</b></summary><p>${escapeHTML(p.text)}</p></details>`;}).join('')||'<p class="empty-copy">Nach deinem ersten Krafttraining siehst du hier Fortschritt und Gewichtsempfehlungen.</p>'}
 <details class="minimal-details"><summary>Übungsverlauf</summary><label for="historyExercise">Übung</label><select id="historyExercise" class="pro-search">${Object.entries(HYBRID_EXERCISES).map(([id,ex])=>`<option value="${id}">${ex.name}</option>`).join('')}</select><div id="exerciseTimeline"></div></details>
 <h3 class="section-label">Alle Trainings</h3>${[...logs].sort(newestTraining).map(l=>`<details class="minimal-details"><summary>${escapeHTML(l.date)} · ${HYBRID_WORKOUTS[l.workoutId].name}</summary><p>${trainingSummary(l)}</p><button onclick="openHybrid('${l.key}')">Bearbeiten</button> <button class="secondary" onclick="window.deleteLog('${l.key}')">Löschen</button></details>`).join('')||'<p class="empty-copy">Noch keine Einheiten erfasst.</p>'}`;
 const select=document.getElementById('historyExercise');select.onchange=()=>renderExerciseTimeline(select.value);renderExerciseTimeline(select.value);
};
const CIRCUIT_STEPS={
 'circuit-press':['10 Liegestütze','10 Deadlifts','10 Schulterdrücken','10 Rudern (einarmig: 5 je Seite)'],
 'circuit-burpee':['10 Burpees','10 Kniebeugen','10 Rudern (einarmig: 5 je Seite)','10 Schulterdrücken','20 Knee-to-Elbow'],
 'circuit-150':['30 Thruster','30 Deadlifts','30 Renegade Row + Press','30 abwechselndes Rudern','30 Reverse Lunges'],
 'circuit-cap20':['30 Deadlifts','30 High Pulls','30 Thruster','30 Clean + Press','30 Burpees','30 Knee-to-Elbow','30 Russian Twists']
};
const freeOpen=openHybrid;
openHybrid=function(key,id){
 freeOpen(key,id);if(!hybridEditing)return;
 const fields=document.getElementById('hybridFields'),w=HYBRID_WORKOUTS[hybridEditing.workoutId],guide=document.createElement('section');guide.className='workout-guide';
 guide.innerHTML=w.kind==='circuit'?`<h3>${w.metric==='rounds'?'So viele Runden wie möglich':'Reihenfolge abarbeiten'}</h3><p>${w.defaultMinutes} Minuten ${w.metric==='rounds'?'AMRAP':'Zeitlimit'} · Gewicht passend zur schwierigsten Übung.</p><ol>${CIRCUIT_STEPS[hybridEditing.workoutId].map(step=>`<li>${step}</li>`).join('')}</ol><p>${w.metric==='rounds'?'Nach der letzten Übung wieder von vorne. Volle Runden und zusätzliche Wiederholungen erfassen.':'Bei Zeitlimit stoppen. Erreichte Wiederholungen und optional die benötigte Zeit eintragen.'} Einarmige Übungen und Kombinationen immer gleich zählen. Core danach ist freiwillig.</p>`:`<p>${escapeHTML(w.pairs)}</p>`;
 fields.prepend(guide);
 if(isFreeSessionKey(key)&&!logs.some(l=>l.key===key)){
  const discard=document.createElement('button');discard.type='button';discard.className='secondary discard-draft';discard.textContent='Entwurf verwerfen';discard.onclick=()=>{
   if(!confirm('Diesen ungespeicherten Entwurf verwerfen?'))return;
   try{localStorage.removeItem(draftKey(key));}catch(_){return alert('Entwurf konnte nicht entfernt werden.');}
   hybridEditing=null;closeHybrid();render();
  };fields.append(discard);
 }
};
