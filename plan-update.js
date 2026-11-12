// New templates have distinct IDs. Never rewrite historical workout IDs or sets.
Object.assign(HYBRID_EXERCISES,{
 rowboth:{name:'Beidarmiges Kurzhantelrudern',target:'8–12',hint:'Zwei Hanteln gleichzeitig rudern; Gewicht je Hantel. Knie leicht gebeugt, Hüfte nach hinten, Rumpf stabil. Richtung untere Rippen ziehen, ohne den Oberkörper hochzureißen. Gewicht unabhängig vom einarmigen Rudern wählen.',groups:['Rücken','Bizeps']},
 reversefly:{name:'Reverse Flys',target:'12–20',accessory:true,hint:'Mit leichten Hanteln vorgebeugt, Rumpf stabil. Arme bei leicht gebeugten Ellbogen kontrolliert seitlich öffnen. Kein Schwung; Gewicht je Hantel.',groups:['Hintere Schulter','Oberer Rücken']},
 lyingtriceps:{name:'Liegendes Trizepsstrecken am Boden',target:'10–15',accessory:true,hint:'Rückenlage, eine Hantel je Hand, Handflächen zueinander. Oberarme ungefähr senkrecht halten. Ellbogen beugen, Hanteln kontrolliert neben den Kopf absenken und wieder strecken. Leicht beginnen; Gewicht je Hantel.',groups:['Trizeps']}
});
HYBRID_WORKOUTS['strength-a'].name='Ganzkörper A · bisheriger Plan';
HYBRID_WORKOUTS['strength-b'].name='Ganzkörper B · bisheriger Plan';
HYBRID_WORKOUTS['strength-a-v2']={name:'Ganzkörper A',kind:'strength',revision:2,family:'a',main:['squat','floor','rdl','row'],ids:['squat','floor','rdl','row','lateral','reversefly','curl','triceps','reverse'],pairs:'Hauptübungen jeweils 3 Sätze, Schultern/Arme und Reverse Crunch jeweils 2. Beim einarmigen Rudern umfasst jeder Satz beide Seiten. Kurzvariante: Hauptübungen je 2 Sätze; nur tatsächlich absolvierte Zusätze erfassen.'};
HYBRID_WORKOUTS['strength-b-v2']={name:'Ganzkörper B',kind:'strength',revision:2,family:'b',main:['lunge','rowboth','pushup','rdl'],ids:['lunge','rowboth','pushup','rdl','press','hammer','lyingtriceps','drag'],pairs:'Hauptübungen jeweils 3 Sätze, Schulterdrücken/Arme und Dumbbell Drag jeweils 2. Ausfallschritte je Seite; Drag-Züge insgesamt zählen. Rudern und RDL nicht als Supersatz kombinieren. Kurzvariante: Hauptübungen je 2 Sätze; nur tatsächlich absolvierte Zusätze erfassen.'};
const strengthFamily=id=>HYBRID_WORKOUTS[id]?.family||(id==='strength-a'?'a':id==='strength-b'?'b':null);
const normalizeBeforeNewPlans=normalizeHybridEntry;
normalizeHybridEntry=function(row,plan){
 const clean=normalizeBeforeNewPlans(row,plan),w=HYBRID_WORKOUTS[clean.workoutId];
 if(w.revision===2&&clean.status==='completed'){
  const count=clean.mode==='short'?2:3;
  if(w.main.some(id=>clean.sets.filter(s=>s.exercise===id).length<count))throw Error(`Für diesen Krafttag je Hauptübung ${count} Sätze eintragen. Bei weniger Sätzen Kurzvariante oder „Verkürzt / abgebrochen“ wählen.`);
 }
 return clean;
};
