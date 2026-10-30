// DOM integration checks. Install linkedom@0.18.12 in a test-only environment.
const {parseHTML,HTMLSelectElement}=require(process.env.SHREDFAST_TEST_DOM || 'linkedom');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
// LinkeDOM does not implement the browser's writable select.value property.
Object.defineProperty(HTMLSelectElement.prototype,'value',{get(){const options=[...this.querySelectorAll('option')];return (options.find(o=>o.hasAttribute('selected'))||options[0])?.getAttribute('value')||'';},set(value){this.querySelectorAll('option').forEach(o=>{if(o.getAttribute('value')===String(value))o.setAttribute('selected','');else o.removeAttribute('selected');});},configurable:true});
const html=fs.readFileSync(__dirname+'/index.html','utf8'),{window}=parseHTML(html),document=window.document,storage=new Map(),alerts=[];
window.supabase={createClient:()=>({auth:{onAuthStateChange(){},getSession:async()=>({data:{session:null}})},from:()=>({select(){const q={eq:()=>q,order:()=>q,range:async()=>({data:[]})};return q;}})})};
const ctx=vm.createContext({window,document,console,structuredClone,Date,crypto:{randomUUID},navigator:{onLine:true},setInterval:()=>{},setTimeout,clearTimeout,
 localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},alert:value=>alerts.push(value),confirm:()=>true});
const run=s=>vm.runInContext(s,ctx),el=id=>document.getElementById(id);
function fill(id,value){assert(el(id),'Missing input '+id);el(id).value=String(value);el(id).dispatchEvent(new window.Event('input',{bubbles:true}));}
function change(id,value){el(id).value=value;el(id).dispatchEvent(new window.Event('change',{bubbles:true}));}
function submit(){el('hybridForm').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));}
run(html.match(/<script>\s*\/\/ ─── DATA[\s\S]*?<\/script>/)[0].replace(/^<script>|<\/script>$/g,''));
run(fs.readFileSync(__dirname+'/training.js','utf8'));run(fs.readFileSync(__dirname+'/cloud.js','utf8'));run(fs.readFileSync(__dirname+'/pro.js','utf8'));
(async()=>{
 run('init()');await run('initCloud()');
 assert(el('content').textContent.includes('AMRAP15 Press Up'));assert(el('content').textContent.includes('Dein nächster Schritt'));
 run("openHybrid('W1-Mo')");
 assert(el('hybridFields').textContent.includes('Bizeps-Curls'));assert(el('hybridFields').textContent.includes('Plank Dumbbell Drag'));
 for(const ex of ['squat','floor','rdl','row'])for(const n of [1,2]){fill(`s-${ex}-${n}-weight`,15);fill(`s-${ex}-${n}-reps`,10);}
 fill('s-squat-1-weight',16);el('hybridFields').querySelector('.copy-weight[data-exercise="squat"]').click();
 assert.equal(el('s-squat-3-weight').value,'16'); // Blank rep rows must not create phantom sets.
 for(const n of [1,2]){fill(`s-drag-${n}-weight`,6);fill(`s-drag-${n}-reps`,8);fill(`s-curl-${n}-weight`,10);fill(`s-curl-${n}-reps`,12);}
 document.querySelectorAll('input').forEach(input=>{if(!input.checkValidity)input.checkValidity=()=>true});document.querySelector('.set-check').click();assert(document.querySelector('.set-row.done'));assert(el('restStatus').textContent.includes('90'));fill('hDuration',35);fill('hNote','<img src=x onerror=alert(1)>');
 run('closeHybrid()');run("openHybrid('W1-Mo')");assert.equal(el('s-drag-1-weight').value,'6','draft restores drag weight');
 submit();assert.deepEqual(alerts,[]);assert.equal(run('logs.length'),1);assert.equal(run('logs[0].sets.length'),12);assert.equal(run("logs[0].sets.find(s=>s.exercise==='drag').weight"),'6');
 run("currentTab='progress';render()");assert(el('historyExercise'));assert(el('exerciseTimeline').textContent.includes('16 kg'));run("currentTab='plan';render()");assert(!document.querySelector('img'),'note escaped');assert.equal(storage.has('sf_draft_v9_local_hybrid1_W1-Mo'),false,'saved draft cleared');
 run("openHybrid('W1-Mi')");fill('s-row-1-weight',17);fill('s-row-1-reps',10);fill('hDuration',12);change('hStatus','partial');submit();
 assert.equal(run('logs.length'),2);assert.equal(el('totalDone').textContent,'1','partial not counted complete');
 run("openHybrid('W2-Fr')");assert.equal(el('hWorkout').value,'circuit-burpee');fill('hWeight',12);fill('hRounds',5);fill('hDuration',24);submit();
 assert.equal(run("logs.find(l=>l.key==='W2-Fr').rounds"),'5');
 run("openHybrid('W3-Fr')");assert.equal(el('hWorkout').value,'circuit-150');assert(!el('hRounds'));fill('hWeight',15);fill('hReps',140);fill('hDuration',24);submit();
 assert.equal(run("logs.find(l=>l.key==='W3-Fr').reps"),'140');
 run("openHybrid('W1-So')");change('hWorkout','easy-run');assert(el('hDistance'));fill('hDuration',25);fill('hDistance',3);submit();
 assert.equal(run("logs.find(l=>l.day==='So').workoutId"),'easy-run');assert.equal(el('totalDone').textContent,'3','optional run excluded from required target');
 run("openHybrid('W2-So')");change('hWorkout','strength-b');assert(el('s-hammer-1-reps'),'optional B has arms');assert(el('s-pushup-1-reps'),'optional B has chest');
 fill('s-hammer-1-weight',8);fill('s-hammer-1-reps',12);run('closeHybrid()');run("openHybrid('W2-So')");assert.equal(el('s-hammer-1-reps').value,'12','chosen optional workout draft restored');
 el('startRest').click();assert(el('restStatus').textContent.includes('90'));el('stopRest').click();assert.equal(el('restStatus').textContent,'Pausentimer');
 await run("switchAccount({id:'11111111-1111-4111-8111-111111111111',email:'test@example.com'})");
 assert(storage.has('sf_draft_v9_local_hybrid1_W2-So'));assert(!storage.has('sf_draft_v9_11111111-1111-4111-8111-111111111111_hybrid1_W2-So'),'draft not leaked across account');
 console.log('PASS: DOM forms; rotation; arms/chest/core fields; actual sets only; weighted drag; draft recovery; completed/partial counts; reps/time circuit; optional run/strength selection; timer; draft account isolation.');
})().catch(e=>{console.error(e,alerts);process.exitCode=1});
