// Focused presentation; existing persistence and training logic stay authoritative.
const minimalHeader=renderHeader;
renderHeader=function(){minimalHeader();document.getElementById('blockTitle').textContent=appBlock==='hybrid1'?'Training':'Trainingsarchiv';document.getElementById('blockSubtitle').textContent='SHREDFAST';document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===currentTab));};
function minimalWeeks(){return `<div class="week-tabs" aria-label="Planwoche">${Array.from({length:8},(_,i)=>`<button class="${currentWeek===i+1?'active':''}" onclick="window.setWeek(${i+1})">W${i+1}</button>`).join('')}</div>`;}
renderHybridPlan=function(){
 const plans=HYBRID_PLAN.filter(p=>p.week===currentWeek);
 document.getElementById('content').innerHTML=`${minimalWeeks()}<div class="minimal-title"><h2>Woche ${currentWeek}</h2><span>2 × Kraft · 1 × Zirkel</span></div>${plans.map(p=>{
 const key=`W${p.week}-${p.day}`,log=logs.find(l=>l.key===key),id=log?.workoutId||suggestedWorkout(p),w=HYBRID_WORKOUTS[id];
 return `<article class="session-line"><div><span class="session-type">${p.optional?'Optional':w.kind==='strength'?'Kraft':'Zirkel'}${log?' · '+(completed(log)?'Erledigt':'Verkürzt'):''}</span><h3>${p.optional&&!log?'Kraft oder Lauf':w.name}</h3><p>${log?escapeHTML(log.date)+' · '+escapeHTML(log.duration)+' Min':w.kind==='strength'?'3 Sätze groß · 2 Sätze klein':escapeHTML(String(w.defaultMinutes||'20–30'))+' Min'}</p></div><button onclick="openHybrid('${key}')">${log?'Öffnen':'Start'}</button></article>`;
 }).join('')}<details class="minimal-details"><summary>Planhinweise</summary><p>${phaseHint(currentWeek)}</p><p>Standard: große Muskelgruppen 3 Sätze, Schultern, Arme und Core 2. Bei 20 Minuten die Kurzvariante wählen. Tatsächlich absolvierte Sätze erfassen; Pausen nicht wegkürzen.</p></details>`;
};
renderHybridProgress=function(){
 const week=logs.filter(l=>l.week===currentWeek),strength=week.filter(l=>HYBRID_WORKOUTS[l.workoutId]?.kind==='strength'&&completed(l)).length,circuit=week.filter(l=>HYBRID_WORKOUTS[l.workoutId]?.kind==='circuit'&&completed(l)).length,core=week.reduce((n,l)=>n+l.sets.filter(s=>HYBRID_EXERCISES[s.exercise]?.unit).length,0);
 const ids=[...new Set(logs.filter(l=>HYBRID_WORKOUTS[l.workoutId]?.kind==='strength').flatMap(l=>l.sets.map(s=>s.exercise)))];
 const statuses={increase:'Steigern',check:'Reserve prüfen',hold:'Beibehalten',limit:'24 kg erreicht',empty:'Noch offen'};
 document.getElementById('content').innerHTML=`${minimalWeeks()}<div class="minimal-title"><h2>Dashboard</h2><span>Planwoche ${currentWeek}</span></div><div class="pro-stats"><div class="pro-stat"><strong>${strength}/2</strong><span>Krafttage</span></div><div class="pro-stat"><strong>${circuit}/1</strong><span>Zirkel</span></div><div class="pro-stat"><strong>${core}</strong><span>Core-Sätze</span></div></div><h3 class="section-label">Fortschritt</h3>${ids.map(id=>{const p=exerciseProgress(id);return `<details class="progress-line"><summary><span>${HYBRID_EXERCISES[id].name}<small>${escapeHTML(p.trend)}</small></span><b class="${p.state}">${currentWeek===5?'Entlastung':statuses[p.state]}</b></summary><p>${currentWeek===5?'Diese Woche leichter trainieren.':escapeHTML(p.text)}</p></details>`;}).join('')||'<p class="empty-copy">Nach deinem ersten Krafttraining siehst du hier deinen Fortschritt und die nächste Gewichtsempfehlung.</p>'}
 <details class="minimal-details"><summary>Übungsverlauf</summary><label for="historyExercise">Übung</label><select id="historyExercise" class="pro-search">${Object.entries(HYBRID_EXERCISES).map(([id,ex])=>`<option value="${id}">${ex.name}</option>`).join('')}</select><div id="exerciseTimeline"></div></details>
 <h3 class="section-label">Trainingsverlauf</h3>${[...logs].sort((a,b)=>b.dateISO.localeCompare(a.dateISO)).map(l=>`<details class="minimal-details"><summary>${escapeHTML(l.date)} · ${HYBRID_WORKOUTS[l.workoutId].name}</summary><p>${trainingSummary(l)}</p><button onclick="openHybrid('${l.key}')">Bearbeiten</button> <button class="secondary" onclick="window.deleteLog('${l.key}')">Löschen</button></details>`).join('')||'<p class="empty-copy">Noch keine Einheiten erfasst.</p>'}`;
 const select=document.getElementById('historyExercise');select.onchange=()=>renderExerciseTimeline(select.value);renderExerciseTimeline(select.value);
};
const minimalOpen=openHybrid;
openHybrid=function(key,chosenId){
 minimalOpen(key,chosenId);if(!hybridEditing)return;
 const fields=document.getElementById('hybridFields'),w=HYBRID_WORKOUTS[hybridEditing.workoutId];
 document.getElementById('hybridDialogTitle').textContent=w.name;
 const options=document.createElement('details');options.className='minimal-details';options.innerHTML='<summary>Datum & Trainingsoptionen</summary>';fields.prepend(options);
 for(const id of ['hWorkout','hDate','hMode','hStatus'])options.append(document.getElementById(id).closest('label'));
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
