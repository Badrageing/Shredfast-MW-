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
