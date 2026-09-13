const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const html=fs.readFileSync(process.env.TRACKER_HTML || path.join(__dirname,'../match-tracker.html'),'utf8');
const source=html.slice(html.indexOf('function validateSpForm()'),html.indexOf('function deleteScheduleMatch('));
function setup(opponent){const fields={spGegner:{value:opponent},spVenue:{value:'away'},spDate:{value:'2026-09-20'},spTime:{value:'11:00'},btnAddMatch:{disabled:true}};let saves=0;
const c=vm.createContext({URLSearchParams,window:{location:{search:''}},Date,teams:[{id:1,name:'Unser FC',isOurTeam:true},{id:2,name:'Gegner FC'}],getOurTeamName:()=> 'Unser FC',schedule:[],document:{getElementById:id=>fields[id]},showToast(){},renderSpielplan(){},save(){saves++;}});vm.runInContext(source,c);return {c,fields,saves:()=>saves};}
test('known opponent, venue, date and time are saved directly in tracker',()=>{const {c,fields,saves}=setup('Gegner FC');c.addScheduleMatch();assert.equal(c.schedule[0].opponentId,2);assert.equal(c.schedule[0].isHome,false);assert.equal(c.schedule[0].date,'2026-09-20');assert.equal(c.schedule[0].time,'11:00');assert.equal(saves(),1);assert.equal(fields.spGegner.value,'');assert.equal(fields.btnAddMatch.disabled,true);});
test('new opponent can be entered without adding a team or using admin',()=>{const {c}=setup('Neuer Gegner');c.addScheduleMatch();assert.equal(c.schedule[0].opponent,'Neuer Gegner');assert.equal(c.schedule[0].opponentId,null);});
test('empty and own-team opponents do not create matches',()=>{for(const name of ['  ','Unser FC']){const {c}=setup(name);c.addScheduleMatch();assert.equal(c.schedule.length,0);}});
test('home games and undated matches are supported',()=>{const {c,fields}=setup('Gegner');fields.spVenue.value='home';fields.spDate.value='';fields.spTime.value='';c.addScheduleMatch();assert.equal(c.schedule[0].isHome,true);assert.equal(c.schedule[0].date,null);});
test('public ticker cannot add schedule entries',()=>{const {c}=setup('Gegner');c.window.location.search='?ticker=123';c.addScheduleMatch();assert.equal(c.schedule.length,0);});
test('a newly added fixture can immediately be started from the tracker',async()=>{
const {c,fields}=setup('Gegner FC');fields.matchTitle={value:''};
for(const name of ['resetTimer','resolveLogos','updateScoreLabels','updateGoalButtons','updateScore','renderEvents','updateEndMatchBtn','switchTab']) c[name]=()=>{};
c.localStorage={setItem(){}};c.storageReady=true;c.matchTransition=false;c.matchConflict=false;c.activeMatchId=null;c.firebaseReady=true;c.navigator={onLine:true};c.matchRevisions={};c.firebase={database:()=>({ref:()=>({})})};c.readStoredValue=async()=>({val:()=>null});c.storageStatus=()=>{};fields.matchDate={textContent:''};
vm.runInContext(html.slice(html.indexOf('async function startMatchFromSchedule('),html.indexOf('function endCurrentMatch(')),c);
c.addScheduleMatch();await c.startMatchFromSchedule(c.schedule[0].id);assert.equal(c.activeMatchId,c.schedule[0].id);assert.equal(fields.matchTitle.value,'Gegner FC vs. Unser FC');assert.equal(c.isHomeTeam,false);
});
