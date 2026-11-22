// Read only the active account's cached records; preserve their original storage.
function cachedArchiveCircuits(){
 try{
  const raw=JSON.parse(localStorage.getItem(account?'sf_cloud_v1_'+account.id:STORAGE_KEY)||'null'),rows=account?raw?.logs:raw;
  if(!Array.isArray(rows))return [];
  return rows.flatMap(l=>{
   if(!l||!WORKOUTS.some(w=>w.id===l.workoutId))return [];
   const match=String(l.date||'').match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);if(!match)return [];
   const iso=`${match[3]}-${match[2].padStart(2,'0')}-${match[1].padStart(2,'0')}`;
   const stamp=new Date(iso+'T12:00:00Z');if(!Number.isFinite(stamp.getTime())||stamp.toISOString().slice(0,10)!==iso)return [];
   const field=k=>['string','number'].includes(typeof l[k])?String(l[k]):'';
   const minutes=field('mins'),seconds=field('secs'),total=Number(minutes)*60+Number(seconds),elapsed=(minutes!==''||seconds!=='')&&Number.isInteger(total)&&total>0&&Number(minutes)>=0&&Number(seconds)>=0&&Number(seconds)<60?String(total):'';
   return [{key:'archive-'+l.key,workoutId:LIBRARY_ALIASES[l.workoutId]||'library-'+l.workoutId,date:field('date'),dateISO:iso,weight:field('weight'),rounds:field('rounds'),reps:'',elapsedSeconds:elapsed,circuitMinutes:'',duration:'',status:'completed',_archive:true}];
  });
 }catch(_){return [];}
}
function lastCircuit(id,{before=localDate(new Date()),exclude=''}={}){
 return [...logs,...cachedArchiveCircuits()].filter(l=>l.workoutId===id&&l.key!==exclude&&l.dateISO<=before).sort(newestTraining)[0]||null;
}
function circuitResultText(l){
 if(!l)return 'Noch kein Ergebnis für diesen Zirkel im geladenen Trainingsverlauf.';
 const w=HYBRID_WORKOUTS[l.workoutId],parts=[l.date||l.dateISO,l._archive?'Archiv':completed(l)?'abgeschlossen':'verkürzt'];
 if(l.weight!=null&&l.weight!=='')parts.push(`${l.weight} ${l._archive?'kg (wie erfasst)':'kg/Hantel'}`);
 if(l.circuitMinutes)parts.push(`${l.circuitMinutes} Min ${w.metric==='rounds'?'AMRAP':w.budgetOnly?'Zeitbudget':'Limit'}`);
 if(l.rounds!=null&&l.rounds!=='')parts.push(`${l.rounds} ${w.metric==='ladder'?'Stufen':'Runden'}${l.extraReps?' + '+l.extraReps+' Wdh.':''}`);
 if(l.reps!=null&&l.reps!=='')parts.push(`${l.reps} Wdh.`);
 if(l.elapsedSeconds!=null&&l.elapsedSeconds!==''){const seconds=Number(l.elapsedSeconds);parts.push(`benötigt ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} Min`);}
 else if(w.metric!=='rounds'&&w.metric!=='ladder')parts.push('benötigte Zeit nicht erfasst');
 if(l.duration)parts.push(`gesamt ${l.duration} Min`);
 return parts.join(' · ');
}
function circuitWeight(id,options={}){
 const last=lastCircuit(id,options),before=options.before||localDate(new Date());
 if(!last||last.weight===''||!Number.isFinite(Number(last.weight))||Number(last.weight)<0||Number(last.weight)>24)return {value:null,text:'Noch keine belastbare kg-Empfehlung. Leicht einsteigen und die schwierigste Übung als Maßstab nehmen.'};
 if(last._archive)return {value:null,text:`Im Archiv zuletzt ${last.weight} kg erfasst. Als Orientierung nutzen und die passende Last je Hantel bestätigen; Dauer und Belastung sind dort nicht vollständig bekannt.`};
 const kg=last.weight,age=Math.round((Date.parse(before+'T12:00:00Z')-Date.parse(last.dateISO+'T12:00:00Z'))/86400000);
 if(before===localDate(new Date())&&['tired','rest'].includes(todayForm()))return {value:null,text:`Heute leichter trainieren oder pausieren. Die zuletzt erfassten ${kg} kg sind keine Steigerungsempfehlung.`};
 if(!completed(last)||Number(last.rpe||0)>=9)return {value:null,text:`Zuletzt ${kg} kg bei ${!completed(last)?'verkürzter Einheit':'hoher Anstrengung'}. Nächstes Mal leichter wählen und den Grund der Belastung berücksichtigen.`};
 if(age>28)return {value:null,text:`Zuletzt ${kg} kg, aber länger als vier Wochen her. Leichter wieder einsteigen; die passende Stufe selbst wählen.`};
 return {value:String(kg),text:`Vorschlag: ${kg} kg/Hantel beibehalten. Gleiche Dauer und Zählweise für einen Vergleich nutzen. Nur bei sauberer Ausführung; Runden allein rechtfertigen keine Laststeigerung.`};
}
const coachPlan=renderHybridPlan;
renderHybridPlan=function(){
 coachPlan();
 document.querySelectorAll('.circuit-library .session-line').forEach(row=>{
  const id=row.dataset.workout,last=lastCircuit(id),weight=circuitWeight(id),p=document.createElement('p');p.className='circuit-last';p.textContent=last?`Zuletzt: ${circuitResultText(last)}`:'Noch nicht erfasst';row.querySelector('div').append(p);
  if(last){const advice=document.createElement('p');advice.className='circuit-last';advice.textContent=weight.value!==null?`Gewichtsvorschlag: ${weight.value} kg/Hantel`:'Gewicht vor dem Start prüfen';row.querySelector('div').append(advice);}
 });
 const hero=document.querySelector('.next-training');
 const latest=[...logs].filter(l=>l.dateISO<=localDate(new Date())).sort(newestTraining)[0];
 if(latest){const p=document.createElement('p');p.className='circuit-last';p.textContent=`Zuletzt erfasst: ${HYBRID_WORKOUTS[latest.workoutId].name} · ${latest.date}${completed(latest)?'':' · verkürzt'}`;hero.append(p);}
 const rec=nextTraining();if(rec.id&&HYBRID_WORKOUTS[rec.id]?.kind==='circuit'){
  const p=document.createElement('p');p.className='circuit-last';p.textContent=circuitWeight(rec.id).text;hero.append(p);
 }
};
const coachOpen=openHybrid;
openHybrid=function(key,id){
 const hadDraft=readDraft(key);coachOpen(key,id);if(!hybridEditing)return;
 const w=HYBRID_WORKOUTS[hybridEditing.workoutId];if(w.kind!=='circuit')return;
 const workoutId=hybridEditing.workoutId,editing=logs.some(l=>l.key===key),weightField=document.getElementById('hWeight'),date=document.getElementById('hDate');
 const report=document.createElement('section');report.className='workout-guide circuit-last-report';report.id='circuitLastReport';document.querySelector('.workout-guide').after(report);
 let suggested=false;
 const refresh=()=>{
  const options={before:date.value,exclude:key},last=lastCircuit(workoutId,options),advice=circuitWeight(workoutId,options);
  report.innerHTML=`<h3>Letztes Ergebnis</h3><p>${escapeHTML(circuitResultText(last))}</p><h3>Gewichtsvorschlag</h3><p>${escapeHTML(advice.text)}</p><p>Vergangene Ergebnisse sind Referenzwerte. Runden, Wiederholungen und benötigte Zeit bleiben für diese Einheit leer, bis du sie selbst einträgst.</p>`;
  if(suggested){weightField.value=advice.value??'';saveHybridDraft();}
  return {last,advice};
 };
 const {last,advice}=refresh();
 if(!editing&&!hadDraft&&weightField.value===''&&advice.value!==null){weightField.value=advice.value;suggested=true;}
 if(!editing&&!hadDraft&&last?.circuitMinutes)document.getElementById('hCircuitMinutes').value=last.circuitMinutes;
 weightField.addEventListener('input',()=>{suggested=false;});date.addEventListener('change',refresh);
};
