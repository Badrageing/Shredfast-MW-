// All 27 existing library workouts. Keep the four existing IDs so logs remain comparable.
const LIBRARY_ALIASES={'n-07':'circuit-press','n-06':'circuit-burpee','b1-01':'circuit-150','b1-07':'circuit-cap20'};
const LIBRARY_IDS=WORKOUTS.map(source=>{
 const id=LIBRARY_ALIASES[source.id]||'library-'+source.id;
 if(!HYBRID_WORKOUTS[id]){
  const amrap=source.format==='AMRAP',ladder=source.format==='Ladder';
  const named=source.name.match(/(?:AMRAP\s*|^)(15|16|20|30)\b/),minutes=named?Number(named[1]):30;
  HYBRID_WORKOUTS[id]={name:source.name,kind:'circuit',metric:amrap?'rounds':ladder?'ladder':'time',defaultMinutes:minutes,ids:[],libraryId:source.id,steps:[...source.exercises],pairs:source.exercises.join(' → '),budgetOnly:!amrap};
 }else {HYBRID_WORKOUTS[id].libraryId=source.id;}
 return id;
});
function libraryResultFields(w,same){
 const value=field=>escapeHTML(same?.[field]??'');
 return (w.metric==='ladder'?`<label>Vollständig absolvierte Stufen<input id="hRounds" type="number" min="0" max="10" required value="${value('rounds')}"></label><p>Eine Stufe = alle Übungen mit der jeweiligen Wiederholungszahl. Maximal Stufe 10 im Original.</p>`:'')+`<label>Benötigte Zeit in Sekunden${w.metric==='time'?' (bei abgeschlossenem Workout)':' (optional)'}<input id="hElapsedSeconds" type="number" min="1" max="2400" value="${value('elapsedSeconds')}" placeholder="z. B. 930 = 15:30"></label><label>Erreichte Wiederholungen (optional)<input id="hReps" type="number" min="0" max="10000" value="${value('reps')}"></label><p>Das Zeitbudget ist frei gewählt. Wenn du vorher aufhörst: „Verkürzt / abgebrochen“ wählen und deine tatsächlich erreichte Leistung eintragen.</p>`;
}
function circuitProgress(id,beforeDate){
 const w=HYBRID_WORKOUTS[id],rows=logs.filter(l=>l.workoutId===id&&completed(l)&&l.dateISO<=beforeDate).sort(newestTraining),latest=rows[0];
 if(!latest)return 'Noch kein Ergebnis im aktuellen Trainingsverlauf.';
 const previous=rows.find((l,i)=>i>0&&l.dateISO<latest.dateISO&&Number(l.weight)===Number(latest.weight)&&Number(l.circuitMinutes)===Number(latest.circuitMinutes));
 const prefix=`Zuletzt ${latest.date}: ${latest.weight} kg · ${latest.circuitMinutes} Min.`;
 if(!previous)return prefix+' Für einen Vergleich dieselbe Last, Dauer und Zählweise wiederholen.';
 if(w.metric==='rounds'||w.metric==='ladder'){const delta=Number(latest.rounds)-Number(previous.rounds);return `${prefix} ${delta>0?'+':''}${delta} ${w.metric==='ladder'?'Stufen':'Runden'} gegenüber der letzten vergleichbaren Einheit; Zusatzwiederholungen separat betrachten.`;}
 if(w.metric==='reps'&&Number(latest.reps)!==Number(previous.reps)){const delta=Number(latest.reps)-Number(previous.reps);return `${prefix} ${delta>0?'+':''}${delta} Wiederholungen gegenüber der letzten vergleichbaren Einheit.`;}
 if(latest.elapsedSeconds&&previous.elapsedSeconds){const delta=Number(latest.elapsedSeconds)-Number(previous.elapsedSeconds);return `${prefix} ${Math.abs(delta)} Sekunden ${delta<0?'schneller':delta>0?'langsamer':'Unterschied'} bei gleicher erfasster Aufgabe.`;}
 return prefix+' Vergleiche Ausführung und vollständige Ergebnisse im Verlauf.';
}
