const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(process.env.TRACKER_HTML || path.join(__dirname,'../match-tracker.html'),'utf8');
const slice=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));

function setup(db={}) {
 const store=new Map(),elements=new Map();
 const copy=x=>x==null?null:JSON.parse(JSON.stringify(x));
 const api={ref(key){return {once:async()=>({val:()=>copy(db[key])}),set:async value=>{if(db.fail)throw Error('denied');db[key]=copy(value)}}}};
 const c=vm.createContext({console,URLSearchParams,window:{location:{search:''},addEventListener(){}},navigator:{onLine:true},setTimeout,clearTimeout,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k),key:i=>[...store.keys()][i],get length(){return store.size}},document:{getElementById(id){if(!elements.has(id))elements.set(id,{style:{},value:'Home vs. Away',textContent:'12.09.2026'});return elements.get(id)}},firebase:{database:Object.assign(()=>api,{ServerValue:{TIMESTAMP:123}})},firebaseReady:true,activeMatchId:1,homeScore:2,awayScore:5,isHomeTeam:false,events:[{id:4,minute:5,team:'away'}],squad:[{id:1,photo:'large-photo'}],schedule:[{id:1,opponent:'Home',isHome:false}],timerBase:null,timerOffset:300,homeLogo:'',awayLogo:'',homeColor:'',awayColor:'',elapsedSeconds:()=>300,getMatchTeams:()=>({home:'Home',away:'Away'}),getOurTeamName:()=> 'Away',showToast(){},applyTeamColors(){},updateScoreLabels(){},updateGoalButtons(){},updateScore(){},renderEvents(){},updateEndMatchBtn(){},updateTimerDisplay(){},startTimerLoop(){},stopTimerLoop(){},switchTab(){},resolveLogos(){},renderSpielplan(){},save(){},pauseTimer(){}});
 vm.runInContext(slice('// Durable match state:', '// ─── INIT ─')+slice('function syncToFirebase(', '// ─── FIREBASE GLOBAL SYNC')+slice('async function startMatchFromSchedule(', 'function updateEndMatchBtn()'),c);
 vm.runInContext('storageReady=true; syncWritePromise=Promise.resolve();',c);
 return {c,store,db,flush:()=>vm.runInContext('syncWritePromise',c),status:()=>elements.get('storageStatus')?.textContent};
}

test('direct sync captures the original match and current score',async()=>{const x=setup();x.c.syncToFirebase();x.c.activeMatchId=null;x.c.homeScore=0;x.c.events=[];await x.flush();assert.equal(x.db['matches/1'].homeScore,2);assert.equal(x.db['matches/1'].events.length,1);assert(!x.db['matches/null']);});
test('direct sync omits roster, revisions, pending jobs and history backups',async()=>{const x=setup();x.c.syncToFirebase();await x.flush();assert.equal(x.db['matches/1'].squad,undefined);assert.equal(x.db['matches/1'].revision,undefined);assert.equal(Object.keys(x.db).filter(k=>k.startsWith('matchHistory/')).length,0);assert.equal([...x.store.keys()].filter(k=>k.startsWith('mt_pending_')).length,0);});
test('direct sync overwrites an older live value without conflict machinery',async()=>{const x=setup({'matches/1':{homeScore:9,awayScore:9,revision:'old'}});x.c.syncToFirebase();await x.flush();assert.equal(x.db['matches/1'].homeScore,2);assert.equal(x.db['matches/1'].awayScore,5);assert.equal(x.db['matches/1'].revision,undefined);});
test('failed direct writes report a visible connection error',async()=>{const x=setup({fail:true});x.c.syncToFirebase();await x.flush();assert.match(x.status(),/nicht übertragen/);});
test('finalization writes the full result and events',async()=>{const x=setup();x.c.endCurrentMatch();await x.flush();assert.equal(x.db['matches/1'].awayScore,5);assert(x.db['matches/1'].matchFinished);assert.equal(x.db['matches/1'].events.length,1);assert.equal(x.c.activeMatchId,null);});
test('a stale open tab cannot mark a fixture with a saved result as live',async()=>{const x=setup();x.c.schedule[0].result={home:2,away:5};x.c.syncToFirebase();await x.flush();assert.equal(x.db['matches/1'].matchFinished,true);});
test('restarting an existing fixture resumes instead of resetting',async()=>{const x=setup({'matches/2':{homeTeam:'Home',awayTeam:'Away',homeScore:2,awayScore:5,events:[{id:4}],timerOffset:300}});x.c.activeMatchId=null;x.c.schedule.push({id:2,opponent:'Home'});await x.c.startMatchFromSchedule(2);assert.equal(x.c.awayScore,5);assert.equal(x.c.events.length,1);});
test('completed fixture cannot restart; another active match cannot be replaced',async()=>{const x=setup({'matches/2':{matchFinished:true,homeScore:2}});x.c.schedule.push({id:2});await x.c.startMatchFromSchedule(2);assert.equal(x.c.activeMatchId,1);x.c.activeMatchId=null;await x.c.startMatchFromSchedule(2);assert.equal(x.c.activeMatchId,null);});
test('offline start leaves state intact',async()=>{const x=setup();x.c.activeMatchId=null;x.c.navigator.onLine=false;await x.c.startMatchFromSchedule(1);assert.equal(x.c.awayScore,5);assert.equal(x.c.activeMatchId,null);});

async function boot(x) {
 x.c.loadTraining=async()=>{};x.c.checkAccess=()=>true;x.c.initFirebase=()=>true;
 x.c.loadGlobalFromFirebase=cb=>{x.boot=cb();};
 vm.runInContext(html.slice(html.lastIndexOf('(function() {'),html.lastIndexOf('</script>')),x.c);
 await x.boot;
}
test('reload adopts the saved server score without writing a zero baseline',async()=>{const data={homeTeam:'Home',awayTeam:'Away',homeScore:2,awayScore:5,events:[{id:1}]};const x=setup({matches:{1:data}});x.c.homeScore=0;x.c.awayScore=0;await boot(x);assert.equal(x.c.awayScore,5);assert.deepEqual(x.db.matches[1],data);assert(!x.db['matches/1']);});
test('obsolete backup outbox keys are discarded during startup',async()=>{const x=setup({matches:{}});x.store.set('mt_pending_1','{}');x.store.set('mt_revision_1','"old"');await boot(x);assert(!x.store.has('mt_pending_1'));assert(!x.store.has('mt_revision_1'));});
test('completed match is recovered into an empty schedule during reload',async()=>{const x=setup({matches:{1:{homeTeam:'Home',awayTeam:'Away',homeScore:2,awayScore:5,matchFinished:true,events:[{id:1}],isHomeTeam:false}}});x.c.schedule=[];await boot(x);assert.equal(x.c.schedule[0].result.away,5);assert.equal(x.c.activeMatchId,null);assert.equal(x.c.schedule[0].result.events.length,1);});
test('finish then start another fixture preserves the completed result and events',async()=>{const x=setup();x.c.resetTimer=()=>{};x.c.schedule.push({id:2,opponent:'Next',isHome:true});x.c.endCurrentMatch();await x.c.startMatchFromSchedule(2);await x.flush();assert.equal(x.c.activeMatchId,2);assert.equal(x.c.homeScore,0);assert.equal(x.c.events.length,0);assert.equal(x.db['matches/1'].awayScore,5);assert(x.db['matches/1'].matchFinished);assert.equal(x.c.schedule[0].result.away,5);});
