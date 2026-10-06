const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');require('../public/player-stats.js');
const html=fs.readFileSync(require('node:path').join(__dirname,'../match-tracker.html'),'utf8');
function setup(fail,dev=false){let callback,written;const status={textContent:''};const c=vm.createContext({DEV_MODE:dev,MatchTrackerStats:globalThis.MatchTrackerStats,trainingSessions:{},squad:[{id:1,name:'Max'},{id:2,name:'Mika'}],schedule:[{id:10,isHome:false,result:{home:2,away:5,events:[{team:'away',scorerId:1}]}}],activeMatchId:null,esc:x=>x,Date,openEditSheet:(title,body,save)=>callback=save,document:{querySelectorAll:()=>[{value:'1'},{value:'2'}],getElementById:id=>id==='participantStatus'?status:{classList:{remove(){}}}},firebase:{database:()=>({ref:path=>({set:async data=>{if(fail)throw Error('offline');written={path,data}}})})},withStorageTimeout:p=>p,renderKaderList(){},save(){},showToast(){}});vm.runInContext(html.slice(html.indexOf('function recalculatePlayerStats('),html.indexOf('function renderKaderList(')),c);c.editParticipants(10);return {c,save:()=>callback(),written:()=>written,status};}
test('appearance edit on completed match changes only participation and recalculates games',async()=>{const x=setup(false);await x.save();assert.equal(x.written().path,'matchParticipants/10');assert.deepEqual(Array.from(x.c.squad,p=>p.games),[1,1]);assert.equal(x.c.schedule[0].result.away,5);assert.equal(x.c.schedule[0].result.events.length,1);});
test('failed appearance save retains existing selections and shows an error',async()=>{const x=setup(true);await x.save();assert.equal(x.c.schedule[0].participantIds,undefined);assert.match(x.status.textContent,/Nicht gespeichert/);});
test('dev appearances remain local and never write to Firebase',async()=>{const x=setup(false,true);await x.save();assert.deepEqual(Array.from(x.c.schedule[0].participantIds),[1,2]);assert.equal(x.written(),undefined);});
test('archived fixtures and stale active matches do not add season goals or appearances',()=>{
 const {c}=setup(false);
 c.schedule.push({id:11,archived:true,isHome:true,participantIds:[1],result:{events:[{team:'home',scorerId:1}]}});
 c.activeMatchId=11;c.isHomeTeam=true;c.events=[{team:'home',scorerId:1}];
 c.recalculatePlayerStats();assert.equal(c.squad[0].goals,1);assert.equal(c.squad[0].games,0);
 c.activeMatchId=10;c.isHomeTeam=false;c.events=[{team:'away',scorerId:1},{team:'away',scorerId:1}];
 c.recalculatePlayerStats();assert.equal(c.squad[0].goals,2);
});

test('first saved selection receives a stable publication time',async()=>{
 const x=setup(false,true);await x.save();const stamp=x.c.schedule[0].participantsPublishedAt;
 assert.ok(stamp>0);await x.save();assert.equal(x.c.schedule[0].participantsPublishedAt,stamp);
});
