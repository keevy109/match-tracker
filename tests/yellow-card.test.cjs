const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('match-tracker.html','utf8');
const source=html.slice(html.indexOf('let _eventModalType'),html.indexOf('// ─── FIREBASE CONFIG'));
function setup(side='home'){
 const fields={'yc-type':{value:'gelbe-karte'},'yc-minute':{value:'12'},'yc-reason':{value:'Foulspiel'},'yc-player':{value:'7'},'yc-name':{value:'Nr. 9'}};
 let saves=0;
 const c=vm.createContext({MatchTiming:require('../public/match-timing.js'),matchTiming:null,homeScore:2,awayScore:1,activeMatchId:123,timerStarted:true,timerBase:null,getOurTeamSide:()=> 'home',showToast(){},previewDevTickerOverlay(){},URLSearchParams,window:{location:{search:''},TrackerFeatures:{cardsEnabled:()=>true}},Date,events:[],squad:[{id:7,name:'Alex',photo:'alex.png'}],elapsedSeconds:()=>720,renderEvents(){},save(){saves++},document:{getElementById:id=>fields[id]??={classList:{remove(){}}}}});
 vm.runInContext(source,c);vm.runInContext("_eventModalType='gelbe-karte';yellowCardTeam='"+side+"'",c);return {c,fields,saves:()=>saves};
}
test('yellow card stores roster snapshot without changing score',async()=>{const {c,saves}=setup();await c.saveEventModal();assert.equal(c.events[0].playerId,7);assert.equal(c.events[0].minute,12);assert.equal(c.events[0].reason,'Foulspiel');assert.equal(c.homeScore,2);assert.equal(c.awayScore,1);assert.equal(saves(),1);});
test('opponent card never attaches our roster; invalid minute is rejected',async()=>{const {c,fields,saves}=setup('away');fields['yc-minute'].value='-1';await c.saveEventModal();assert.equal(saves(),0);fields['yc-minute'].value='0';await c.saveEventModal();assert.equal(c.events[0].playerId,undefined);assert.equal(c.events[0].playerName,'Nr. 9');assert.equal(c.events[0].minute,null);});
test('spectators cannot create cards',async()=>{const {c,saves}=setup();c.window.location.search='?ticker=123';await c.saveEventModal();assert.equal(saves(),0);});

test('all card types persist without affecting the result; unknown types are rejected',async()=>{
 for(const type of ['gelbe-karte','gelb-rote-karte','rote-karte','invalid']){
  const {c,fields,saves}=setup();fields['yc-type'].value=type;await c.saveEventModal();
  assert.equal(saves(),type==='invalid'?0:1);
  if(type!=='invalid')assert.equal(c.events[0].typ,type);
  assert.equal(c.homeScore,2);assert.equal(c.awayScore,1);
 }
});

test('disabled cards cannot be saved from an already open dialog',async()=>{
 const {c,saves}=setup();c.window.TrackerFeatures.cardsEnabled=()=>false;await c.saveEventModal();assert.equal(saves(),0);assert.equal(c.events.length,0);
});

test('injury uses player snapshot and does not require card entitlement or change score',async()=>{const {c,saves}=setup();vm.runInContext("_eventModalType='verletzung'",c);c.window.TrackerFeatures.cardsEnabled=()=>false;await c.saveEventModal();assert.equal(saves(),1);assert.equal(c.events[0].typ,'verletzung');assert.equal(c.events[0].playerId,7);assert.equal(c.homeScore,2);assert.equal(c.awayScore,1);});
