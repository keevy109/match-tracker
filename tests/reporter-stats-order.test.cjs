const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('match-tracker.html', 'utf8');
const section = (start, end) => html.slice(html.indexOf(start), html.indexOf(end, html.indexOf(start)));

test('rendering the reporter roster cannot replace fresh season totals with stale local events', () => {
  const c = vm.createContext({
    squad:[{id:1,name:'Mats',goals:7},{id:2,name:'Jonah',goals:10}],
    schedule:[], activeMatchId:20, isHomeTeam:true, trainingSessions:{},
    events:[{id:200,team:'home',scorerId:1}],
    document:{getElementById:() => null},
    MatchTrackerLiveRecords:{20:{events:[{id:200,team:'home',scorerId:1},{id:300,team:'home',scorerId:2}]}},
    MatchTrackerSeasonGoals:{200:7,300:10},
  });
  vm.runInContext(fs.readFileSync('public/player-stats.js','utf8'), c);
  vm.runInContext(section('function recalculatePlayerStats()', 'function lineupMembers(') +
    section('function renderKaderList()', 'function updatePlayerPhoto('), c);
  c.renderKaderList();
  assert.deepEqual(Array.from(c.squad, p => p.goals), [7,10]);
  assert.equal(c.MatchTrackerSeasonGoals[300],10);
});

test('reporter startup redraws goal cards after restoring the match and recalculating totals', async () => {
  let rendered, completed;
  const c = vm.createContext({
    URLSearchParams, window:{location:{search:''}}, DEV_MODE:false,
    checkAccess:() => true, initFirebase(){},
    firebase:{database:() => ({ref:path => ({path,on(){}})})},
    MatchTrackerLiveRoster:{subscribe(){}},
    loadGlobalFromFirebase:cb => {completed=cb();},
    localStorage:{length:0}, activeMatchId:20, schedule:[],
    readStoredValue:async ref => ({val:() => ref.path === 'matches' ? {20:{events:[]}} : {}}),
    applyMatchSnapshot(){}, loadTrainingForStats:async()=>{},
    recalculatePlayerStats(){c.MatchTrackerSeasonGoals={200:7,300:10};},
    renderKaderList(){}, renderPickerPlayers(){}, renderSpielplan(){},
    renderEvents(){rendered={...c.MatchTrackerSeasonGoals};},
    document:{getElementById:()=>({style:{}})},
    matchSnapshot:()=>({}), updateTickerUI(){}, storageStatus(){},
  });
  vm.runInContext(html.slice(html.lastIndexOf('(function() {'),html.lastIndexOf('</script>')),c);
  await completed;
  assert.deepEqual(rendered,{200:7,300:10});
});
