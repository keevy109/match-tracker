const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('live roster refresh and historic corrections update portraits and goal ordinals without match writes', () => {
  const c = vm.createContext({console});
  for (const file of ['player-stats', 'schedule-data', 'live-roster']) vm.runInContext(fs.readFileSync(`public/${file}.js`, 'utf8'), c);
  const listeners = {};
  const database = {ref(path) { return {on(type, fn) {listeners[path] = fn;}, off() {delete listeners[path];}}; }};
  let latest;
  const stop = c.MatchTrackerLiveRoster.subscribe(database, (players, records, numbers) => {latest = {players, records, numbers};});
  const send = (path, value) => listeners[path]({val:() => value});
  send('app/squad', [{id:1, photo:'new.png', goals:99, goalAdjustment:2, training:75}]);
  assert.equal(latest.players[0].photo, 'new.png');
  assert.equal(latest.records, null); // Do not present incomplete history as zero.
  send('app/schedule', [{id:10}, {id:20}, {id:30, archived:true}]);
  const paused = {matchFinished:false, timerBase:null, timerOffset:900, homeScore:2, awayScore:0,
    events:[{id:300, team:'home', scorerId:1, seasonGoals:1}, {id:200, team:'home', scorerId:1, seasonGoals:1}]};
  const before = JSON.stringify(paused);
  const matches = {10:{isHomeTeam:false, events:[{id:100, team:'away', scorerId:1}]}, 20:paused,
    30:{events:[{id:50, team:'home', scorerId:1}]}};
  send('matches', matches);
  assert.equal(latest.players[0].goals, 5);
  assert.equal(latest.players[0].training, 75);
  assert.equal(latest.numbers[200], 4);
  assert.equal(latest.numbers[300], 5);
  assert.equal(JSON.stringify(paused), before);
  send('app/squad', [{id:1, photo:'newer.png', goalAdjustment:2}]);
  assert.equal(latest.players[0].photo, 'newer.png');
  matches[10].events = [];
  send('matches', matches);
  assert.equal(latest.numbers[200], 3);
  assert.equal(latest.players[0].goals, 4);
  assert.equal(JSON.stringify(paused), before);
  stop(); assert.equal(Object.keys(listeners).length, 0);
});
