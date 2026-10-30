const vm = require('node:vm');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const nodes=new Map(), storage=new Map(); let events=[], failure=false;
function node(id){if(!nodes.has(id))nodes.set(id,{id,textContent:'',innerHTML:'',value:'',style:{},hidden:false,classList:{add(){},remove(){}},addEventListener(type,fn){this[type]=fn}});return nodes.get(id)}
const ctx=vm.createContext({console,structuredClone,crypto:{randomUUID},setTimeout,clearTimeout,setInterval:()=>{},
 navigator:{onLine:true},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
 document:{getElementById:node,querySelectorAll:()=>[],addEventListener(){}},
 alert(){},confirm:()=>true,window:{addEventListener(){},supabase:{createClient:()=>({auth:{onAuthStateChange(){},getSession:async()=>({data:{session:null}})},from:()=>({
 upsert:async rows=>{if(failure)return{error:Error('offline')};for(const r of rows)if(!events.some(e=>e.id===r.id))events.push({...r,created_at:new Date().toISOString()});return{error:null}},
 select(){let user,block;const q={eq:(k,v)=>{if(k==='user_id')user=v;if(k==='block_id')block=v;return q},order:()=>q,range:async(a,b)=>failure?{error:Error('offline')}:{data:events.filter(e=>e.user_id===user && e.block_id===block).slice(a,b+1)}};return q}
 })})}}});
const run = code=>vm.runInContext(code,ctx);
const html=fs.readFileSync(__dirname+'/index.html','utf8');
run(html.match(/<script>\s*\/\/ ─── DATA[\s\S]*?<\/script>/)[0].replace(/^<script>|<\/script>$/g,''));
run(fs.readFileSync(__dirname+'/training.js','utf8'));
run("appBlock='block2'");
run(fs.readFileSync(__dirname+'/cloud.js','utf8'));
async function idle(){for(let i=0;i<100;i++){if(!run('syncRunning'))return;await new Promise(r=>setTimeout(r,5))}throw Error('sync never finished')}
(async()=>{
 const original=[{key:'W1-Mo',week:1,day:'Mo',workoutId:'n-07',date:'7.9.2026',weight:'15',rounds:'6',mins:'',secs:'',note:'<img src=x onerror=alert(1)>'}];
 storage.set('sf_v6_logs',JSON.stringify(original));run('init()');await run('initCloud()');
 assert.equal(run('logs.length'),1);
 await run("switchAccount({id:'11111111-1111-4111-8111-111111111111',email:'test@example.com'})");
 assert.equal(run('logs.length'),0,'legacy not assigned silently');
 await nodes.get('legacyImport').click();await idle();assert.equal(events.length,1);assert.equal(run('pending.length'),0);
 assert.equal(JSON.parse(storage.get('sf_v6_logs'))[0].rounds,'6','legacy stays unchanged');
 failure=true;run("openLog('W1-Mo',1,'Mo','n-07','rounds')");node('inputRounds').value='7';run('saveLog()');await idle();
 assert.equal(run('pending.length'),1);assert.equal(JSON.parse(storage.get('sf_cloud_v1_11111111-1111-4111-8111-111111111111')).pending.length,1);
 run('loadDeviceState()');assert.equal(run('logs[0].rounds'),'7','pending survives reload');
 failure=false;await run('syncCloud()');assert.equal(events.length,2);assert.equal(run('pending.length'),0);assert.equal(run('logs[0].date'),'7.9.2026');
 run("deleteLog('W1-Mo')");await idle();assert.equal(run('logs.length'),0);await run('syncCloud()');assert.equal(run('logs.length'),0,'delete stays deleted');
 await nodes.get('legacyImport').click();await idle();run("currentTab='plan';render()");assert(!node('content').innerHTML.includes('<img'),'escaped notes');
 const n=events.length;await run('syncCloud()');assert.equal(events.length,n,'sync retries do not duplicate changes');
 await run("switchAccount({id:'22222222-2222-4222-8222-222222222222',email:'other@example.com'})");assert.equal(run('logs.length'),0,'accounts isolated');
 await run("switchAccount({id:'11111111-1111-4111-8111-111111111111',email:'test@example.com'})");assert.equal(run('logs.length'),1);
 await run('switchAccount(null)');assert.equal(run('logs.length'),1);assert.equal(run('logs[0].rounds'),'6');
 assert.throws(()=>run("normalizeLogs([{key:'bad'}])"));assert.throws(()=>run('normalizeLogs([...logs,...logs])'));
 // Hybrid has independent caches, event stream, validation and optional run counts.
 await nodes.get('blockSelect').change({target:{value:'hybrid1'}});
 assert.equal(run('logs.length'),0);
 await run("switchAccount({id:'11111111-1111-4111-8111-111111111111',email:'test@example.com'})");
 assert.equal(run('logs.length'),0,'archive cloud rows not mixed into hybrid');
 run(`globalThis.hybridA={key:'W1-Mo',week:1,day:'Mo',workoutId:'strength-a',dateISO:'2026-11-02',mode:'short',duration:'20',rpe:'7',sets:[...['squat','floor','rdl','row'].flatMap(exercise=>[1,2].map(set=>({exercise,set,weight:'15',reps:'10',rir:'2'}))),...[1,2].map(set=>({exercise:'deadbug',set,weight:'',reps:'8',rir:''}))]}`);
 run('logs=[hybridA]');assert.equal(run('storeTrainingChange()'),true);await idle();
 assert.equal(run('logs[0].sets.length'),10);assert.equal(node('totalDone').textContent,1);
 assert.throws(()=>run('normalizeLogs([{...hybridA,sets:[]}])'),'empty strength session rejected');
 assert.throws(()=>run("normalizeLogs([{...hybridA,dateISO:'2026-02-31'}])"),'invalid calendar date rejected');
 assert.throws(()=>run("normalizeLogs([{...hybridA,sets:hybridA.sets.map(s=>({...s,weight:'25'}))}])"),'equipment limit enforced');
 run("logs.push({key:'W1-So',week:1,day:'So',workoutId:'easy-run',dateISO:'2026-11-08',mode:'standard',duration:'25',rpe:'4',distance:'3',sets:[]})");
 assert.equal(run('storeTrainingChange()'),true);await idle();
 assert.equal(node('totalDone').textContent,1,'optional run not counted as required strength/circuit');
 assert.equal(run('logs.length'),2);
 const archiveCount=events.filter(e=>e.block_id==='block2').length;
 await nodes.get('blockSelect').change({target:{value:'block2'}});
 assert.equal(run('logs.length'),1);assert.equal(run('logs[0].rounds'),'6');
 await nodes.get('blockSelect').change({target:{value:'hybrid1'}});
 assert.equal(run('logs.length'),2);assert.equal(events.filter(e=>e.block_id==='block2').length,archiveCount,'archive unchanged');
 failure=true;run("logs[0].sets[0].reps='11';storeTrainingChange()");await idle();
 await nodes.get('blockSelect').change({target:{value:'block2'}});
 await nodes.get('blockSelect').change({target:{value:'hybrid1'}});
 assert.equal(run('pending.length'),1,'offline pending survives block switch');
 failure=false;await run('syncCloud()');assert.equal(run('pending.length'),0);assert.equal(run('logs[0].sets[0].reps'),'11');
 await nodes.get('blockSelect').change({target:{value:'block2'}});
 // Existing v8 Friday selections remain valid even when the new rotation differs.
 await nodes.get('blockSelect').change({target:{value:'hybrid1'}});
 assert.equal(run("normalizeLogs([{key:'W2-Fr',week:2,day:'Fr',workoutId:'circuit-press',dateISO:'2026-11-13',mode:'standard',duration:'20',rpe:'7',weight:'15',rounds:'5',circuitMinutes:'15',sets:[]}])[0].workoutId"),'circuit-press');
 assert.equal(run("normalizeLogs([{key:'W1-Mi',week:1,day:'Mi',workoutId:'strength-b',dateISO:'2026-11-04',mode:'short',duration:'20',rpe:'7',sets:['lunge','row','rdl','press'].flatMap(exercise=>[1,2].map(set=>({exercise,set,weight:'15',reps:'10',rir:'2'})))}])[0].sets.length"),8,'v8 strength B retained');
 assert.throws(()=>run("normalizeLogs([{schemaVersion:9,key:'W1-Mi',week:1,day:'Mi',workoutId:'strength-b',dateISO:'2026-11-04',mode:'short',duration:'20',sets:['lunge','row','rdl','press'].flatMap(exercise=>[1,2].map(set=>({exercise,set,weight:'15',reps:'10',rir:'2'})))}])"),'v9 complete B requires chest main lift');
 assert.equal(run("normalizeLogs([{schemaVersion:9,key:'W4-So',week:4,day:'So',workoutId:'strength-a',status:'partial',dateISO:'2026-11-29',mode:'short',duration:'10',sets:[{exercise:'curl',set:1,weight:'10',reps:'12',rir:''}]}])[0].status"),'partial','optional actual strength and partial recording');
 assert.throws(()=>run("normalizeLogs([{key:'W1-Mo',week:1,day:'Mo',workoutId:'easy-run',dateISO:'2026-11-02',mode:'short',duration:'20',sets:[]}])"),'wrong slot rejected');
 await nodes.get('blockSelect').change({target:{value:'block2'}});
 // Simulate a storage write failure. Saving must not claim success.
 const old=ctx.localStorage.setItem;ctx.localStorage.setItem=()=>{throw Error('quota')};
 run("logs[0].rounds='99'");assert.equal(run('storeTrainingChange()'),false);ctx.localStorage.setItem=old;
 console.log('PASS: legacy isolation and import; offline queue survives reload; sync retry; original date; tombstone deletion; escaped notes; account isolation; malformed backups; quota failure; hybrid per-set validation; block isolation; optional runs; offline block switching.');
})().catch(e=>{console.error(e);process.exitCode=1});
