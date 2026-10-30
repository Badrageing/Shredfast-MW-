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
 select(){let user;const q={eq:(k,v)=>{if(k==='user_id')user=v;return q},order:()=>q,range:async(a,b)=>failure?{error:Error('offline')}:{data:events.filter(e=>e.user_id===user).slice(a,b+1)}};return q}
 })})}}});
const run = code=>vm.runInContext(code,ctx);
const html=fs.readFileSync(__dirname+'/index.html','utf8');
run(html.match(/<script>\s*\/\/ ─── DATA[\s\S]*?<\/script>/)[0].replace(/^<script>|<\/script>$/g,''));
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
 // Simulate a storage write failure. Saving must not claim success.
 const old=ctx.localStorage.setItem;ctx.localStorage.setItem=()=>{throw Error('quota')};
 run("logs[0].rounds='99'");assert.equal(run('storeTrainingChange()'),false);ctx.localStorage.setItem=old;
 console.log('PASS: legacy isolation and import; offline queue survives reload; sync retry; original date; tombstone deletion; escaped notes; account isolation; malformed backups; quota failure.');
})().catch(e=>{console.error(e);process.exitCode=1});
