// Product layer: quick start, exercise history and focused training interaction.
const basePlan=renderHybridPlan,baseProgress=renderHybridProgress,baseOpen=openHybrid,baseDB=renderDB;
renderHybridPlan=function(){
 basePlan();const content=document.getElementById('content');
 const next=HYBRID_PLAN.find(p=>p.week===currentWeek&&!p.optional&&!logs.some(l=>l.key===`W${p.week}-${p.day}`&&completed(l)));
 const hero=document.createElement('section');hero.className='pro-hero';
 const id=next?(logs.find(l=>l.key===`W${next.week}-${next.day}`)?.workoutId||suggestedWorkout(next)):null;
 hero.innerHTML=`<div class="pro-eyebrow">Dein nächster Schritt · Woche ${currentWeek}</div><h2>${next?HYBRID_WORKOUTS[id].name:'Wochenziel erreicht'}</h2><p>${next?'Dein Plan steht. Starte die Einheit und erfasse jeden absolvierten Satz.':'Alle drei Kerneinheiten sind abgeschlossen. Nutze den Zusatztermin nur bei guter Erholung.'}</p>${next?`<button onclick="openHybrid('W${next.week}-${next.day}')">Training starten →</button>`:''}`;
 content.prepend(hero);
 const guidance=content.querySelector(':scope > .note-box');if(guidance){const details=document.createElement('details');details.className='pro-guidance';const summary=document.createElement('summary');summary.textContent='Trainingsregeln & Wochenfokus';details.append(summary);guidance.replaceWith(details);details.append(guidance);}
};
renderHybridProgress=function(){
 baseProgress();const content=document.getElementById('content'),stats=document.createElement('div');stats.className='pro-stats';
 const count=logs.length,minutes=logs.reduce((sum,l)=>sum+Number(l.duration||0),0),sets=logs.reduce((sum,l)=>sum+l.sets.length,0);
 stats.innerHTML=`<div class="pro-stat"><strong>${count}</strong><span>erfasste Einheiten</span></div><div class="pro-stat"><strong>${minutes}</strong><span>Trainingsminuten</span></div><div class="pro-stat"><strong>${sets}</strong><span>Kraft-/Core-Sätze</span></div>`;content.prepend(stats);
 const history=document.createElement('section');history.className='pro-hero';history.innerHTML='<div class="pro-eyebrow">Deine Entwicklung</div><h2>Übung für Übung</h2><label for="historyExercise">Übung auswählen</label><select class="pro-search" id="historyExercise"></select><div id="exerciseTimeline"></div>';
 stats.after(history);const select=history.querySelector('select');
 for(const [id,ex]of Object.entries(HYBRID_EXERCISES)){const option=document.createElement('option');option.value=id;option.textContent=ex.name;select.append(option);}
 select.addEventListener('change',()=>renderExerciseTimeline(select.value));renderExerciseTimeline(select.value);
};
function renderExerciseTimeline(id){
 const ex=HYBRID_EXERCISES[id],rows=logs.filter(l=>l.sets.some(s=>s.exercise===id)).sort((a,b)=>a.dateISO.localeCompare(b.dateISO));
 document.getElementById('exerciseTimeline').innerHTML=rows.length?`<p class="pro-help">Tatsächlich erfasste Sätze, chronologisch. Gewicht ${ex.single||ex.weighted?'der einzelnen Hantel':'je Hantel'}; Technik und Bewegungsumfang beim Vergleichen konstant halten.</p><table class="pro-history"><thead><tr><th>Datum</th><th>Gewicht × Leistung</th></tr></thead><tbody>${rows.map(l=>`<tr><td>${escapeHTML(l.date)}</td><td>${l.sets.filter(s=>s.exercise===id).map(s=>`${s.weight!==''&&!ex.bodyweight?escapeHTML(s.weight)+' kg × ':''}${escapeHTML(s.reps)} ${ex.unit||'Wdh.'}`).join('<br>')}</td></tr>`).join('')}</tbody></table>`:'<p class="pro-help">Noch keine Sätze für diese Übung. Nach dem ersten Training erscheint hier dein Verlauf.</p>';
}
openHybrid=function(key,chosenId){
 baseOpen(key,chosenId);if(!hybridEditing)return;
 document.querySelectorAll('#hybridFields fieldset').forEach(fieldset=>{
  const hint=fieldset.querySelector('p');if(hint){const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Technikhinweis';details.append(summary);hint.replaceWith(details);details.append(hint);}
 });
 document.querySelectorAll('#hybridFields .set-row').forEach(row=>{
  const button=document.createElement('button');button.type='button';button.className='set-check';button.textContent='✓';button.setAttribute('aria-label',`Satz ${row.dataset.set} prüfen und Pause starten`);button.setAttribute('aria-pressed','false');
  button.addEventListener('click',()=>{
   const reps=row.querySelector('[data-field=reps]'),weight=row.querySelector('[data-field=weight]');
   if(!reps.value||!reps.checkValidity()||(weight&&(!weight.value||!weight.checkValidity()))){reps.focus();document.getElementById('draftStatus').textContent='Bitte zuerst gültige Wiederholungen/Zeit und gegebenenfalls Gewicht eintragen.';return;}
   const done=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(done));row.classList.toggle('done',done);saveHybridDraft();if(done){restDeadline=Date.now()+90000;updateRestTimer();}
  });row.append(button);row.querySelectorAll('input').forEach(input=>input.addEventListener('input',()=>{button.setAttribute('aria-pressed','false');row.classList.remove('done');}));
 });
};
renderDB=function(){
 baseDB();const content=document.getElementById('content'),search=document.createElement('input');search.className='pro-search';search.type='search';search.placeholder='Workout suchen …';search.setAttribute('aria-label','Workouts durchsuchen');search.addEventListener('input',()=>{content.querySelectorAll('.db-item').forEach(item=>item.hidden=!item.textContent.toLocaleLowerCase('de').includes(search.value.toLocaleLowerCase('de')));});content.prepend(search);
};

// Progress compares equal set counts and loads. Never infer muscle gain from logging.
const plannedSets=id=>HYBRID_EXERCISES[id].unit||HYBRID_EXERCISES[id].accessory||id==='press'?2:3;
function exerciseProgress(id,excludeKey='',beforeDate='9999-12-31'){
 const ex=HYBRID_EXERCISES[id],n=plannedSets(id),upper=Number(ex.target.match(/–(\d+)/)?.[1]);
 const sessions=logs.filter(l=>l.key!==excludeKey&&l.dateISO<=beforeDate&&HYBRID_WORKOUTS[l.workoutId]?.kind==='strength')
  .map(l=>({log:l,sets:l.sets.filter(s=>s.exercise===id).sort((a,b)=>a.set-b.set)})).filter(x=>x.sets.length)
  .sort((a,b)=>b.log.dateISO.localeCompare(a.log.dateISO)||planPosition(b.log)-planPosition(a.log));
 const latest=sessions[0],previous=sessions.find((x,i)=>i>0&&x.log.dateISO<latest.log.dateISO);
 if(!latest)return {state:'empty',text:'Nach deinem ersten Training erscheint hier die Empfehlung.',trend:'Noch keine Daten'};
 const uniform=x=>x.sets.every(s=>Number(s.weight)===Number(x.sets[0].weight));
 const full=x=>x&&x.sets.length===n&&uniform(x);
 const top=x=>full(x)&&x.sets.every(s=>Number(s.reps)>=upper);
 const weight=Number(latest.sets[0].weight),sum=x=>x.sets.reduce((a,s)=>a+Number(s.reps),0);
 let trend='Noch kein vergleichbarer Verlauf';
 if(previous&&full(latest)&&full(previous)){
  const oldWeight=Number(previous.sets[0].weight),delta=sum(latest)-sum(previous);
  if(weight===oldWeight)trend=delta>0?`+${delta} ${ex.unit?'Einheiten':'Wdh.'} bei gleicher Last (${n} Sätze)`:delta<0?`${delta} ${ex.unit?'Einheiten':'Wdh.'} bei gleicher Last (${n} Sätze)`:'Leistung gehalten';
  else trend=weight>oldWeight?`Last +${+(weight-oldWeight).toFixed(2)} kg; Wiederholungen separat vergleichen`:'Last reduziert; Wiederholungen separat vergleichen';
 }
 if(ex.unit||ex.bodyweight)return {state:'hold',trend,text:`Ziel: ${n} × ${ex.target}. Erst kontrolliert Wiederholungen/Zeit steigern.`};
 if(!full(latest))return {state:'hold',trend,text:`Für die Empfehlung ${n} Sätze mit gleichem Gewicht erfassen. Kurztraining bleibt gültig.`};
 if(!top(latest)||!top(previous)||Number(previous.sets[0].weight)!==weight)return {state:'hold',trend,text:`${weight} kg beibehalten. Ziel: ${n} × ${upper} in zwei Einheiten an verschiedenen Tagen.`};
 const reserve=latest.sets[latest.sets.length-1].rir;
 if(reserve===''||Number(reserve)<1||latest.sets.some(s=>s.rir!==''&&Number(s.rir)<1))return {state:'check',trend,text:'Obergrenze zweimal erreicht. Bei sauberer Technik und mindestens 1 Wiederholung Reserve im letzten Satz ist die kleinste Gewichtsstufe sinnvoll. Reserve noch prüfen.'};
 return weight>=24?{state:'limit',trend,text:'24-kg-Grenze erreicht. Keine weitere Laststeigerung; schwierigere Variante beim nächsten Planwechsel wählen.'}:{state:'increase',trend,text:`Steigerung bereit: nächstes Mal kleinste verfügbare Stufe über ${weight} kg (max. 24 kg/Hantel), wenn Technik und Bewegungsumfang gleich bleiben. Danach am unteren Wiederholungsziel starten.`};
}
function progressDashboard(){
 const panel=document.createElement('section');panel.className='pro-hero';panel.id='progressDashboard';
 const week=logs.filter(l=>l.week===currentWeek),strength=week.filter(l=>HYBRID_WORKOUTS[l.workoutId]?.kind==='strength'&&completed(l)).length,circuit=week.filter(l=>HYBRID_WORKOUTS[l.workoutId]?.kind==='circuit'&&completed(l)).length,core=week.reduce((n,l)=>n+l.sets.filter(s=>HYBRID_EXERCISES[s.exercise]?.unit).length,0);
 const ids=[...new Set(logs.filter(l=>HYBRID_WORKOUTS[l.workoutId]?.kind==='strength').flatMap(l=>l.sets.map(s=>s.exercise)))];
 panel.innerHTML=`<div class="pro-eyebrow">Dein Dashboard · Planwoche ${currentWeek}</div><div class="pro-stats"><div class="pro-stat"><strong>${strength}/2</strong><span>Krafttage abgeschlossen</span></div><div class="pro-stat"><strong>${circuit}/1</strong><span>Zirkel abgeschlossen</span></div><div class="pro-stat"><strong>${core}</strong><span>Core-Sätze erfasst</span></div></div><h2>Fortschritt & nächste Last</h2><p class="pro-help">Je Übung: zwei letzte Einheiten an verschiedenen Tagen. Verglichen werden gleiche Satzanzahl und Last. Empfehlungen sind Vorschläge; Woche 5 bleibt Entlastung.</p>${ids.map(id=>{const p=exerciseProgress(id);return `<div class="progress-advice ${p.state}"><strong>${HYBRID_EXERCISES[id].name}</strong><p>${escapeHTML(p.trend)}</p><p>${escapeHTML(p.text)}</p></div>`;}).join('')||'<p>Noch keine Kraftsätze im neuen Block. Deine alten Zirkel bleiben im Archiv; daraus lassen sich keine verlässlichen Gewichte für einzelne Kraftübungen ableiten.</p>'}<details><summary>Apple Watch · noch nicht verbunden</summary><p>Diese Web-App liest keine Apple-Health-Daten. Eine native iPhone-Anbindung mit HealthKit-Freigabe ist dafür nötig. Schlaf, Ruhepuls und Belastung könnten später Erholungshinweise ergänzen; Gewichtssteigerungen bleiben an Satzleistung, Technik und Reserve gekoppelt.</p></details>`;
 return panel;
}
const progressV10=renderHybridProgress;
renderHybridProgress=function(){progressV10();document.getElementById('content').prepend(progressDashboard());};
const planV10=renderHybridPlan;
renderHybridPlan=function(){planV10();const panel=progressDashboard();panel.querySelectorAll('.progress-advice').forEach((card,i)=>{if(i>=3)card.hidden=true;});const more=document.createElement('button');more.textContent='Alle Fortschritte ansehen';more.onclick=()=>{currentTab='progress';render();};panel.append(more);document.getElementById('content').append(panel);};
const openV10=openHybrid;
openHybrid=function(key,chosenId){
 openV10(key,chosenId);if(!hybridEditing)return;
 document.querySelectorAll('#hybridFields fieldset').forEach(fieldset=>{
  const row=fieldset.querySelector('.set-row');if(!row)return;const id=row.dataset.exercise;
  const recommendation=document.createElement('p');recommendation.className='progress-advice';recommendation.textContent=hybridEditing.week===5?'Entlastungswoche: leichter trainieren, keine automatische Laststeigerung.':exerciseProgress(id,key,document.getElementById('hDate').value).text;fieldset.querySelector('legend').after(recommendation);
  const reserveToggle=document.createElement('button');reserveToggle.type='button';reserveToggle.className='secondary';reserveToggle.textContent='Reserve einblenden (für Steigerung)';
  const reserves=[...fieldset.querySelectorAll('[data-field=rir]')];reserves.forEach(input=>{input.closest('label').hidden=input.value==='';});
  if(reserves.length){reserveToggle.onclick=()=>{reserves.forEach(input=>input.closest('label').hidden=false);reserveToggle.hidden=true;};fieldset.append(reserveToggle);}
  fieldset.querySelectorAll('.set-row').forEach((r,i)=>{
   const weight=r.querySelector('[data-field=weight]');const last=previousExercise(id,key);
   if(weight&&!weight.value&&last){weight.value=last.weight;weight.title='Letztes Gewicht als Vorschlag – bei Bedarf ändern';}
   const copy=document.createElement('button');copy.type='button';copy.className='secondary repeat-set';copy.textContent=i?'Wie Satz davor':'Letzten Satz übernehmen';copy.setAttribute('aria-label',`${HYBRID_EXERCISES[id].name}: ${copy.textContent}`);
   copy.onclick=()=>{
    const prev=i?r.previousElementSibling:null;
    const source=i?{weight:prev?.querySelector('[data-field=weight]')?.value,reps:prev?.querySelector('[data-field=reps]')?.value}:last;
    if(!source?.reps)return;
    for(const field of ['weight','reps']){const input=r.querySelector(`[data-field=${field}]`);if(input){input.value=source[field]??'';input.dispatchEvent(new window.Event('input',{bubbles:true}));}}
    saveHybridDraft();
   };r.append(copy);
  });
 });
};
