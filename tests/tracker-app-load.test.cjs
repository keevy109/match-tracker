const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('match-tracker.html', 'utf8');
const source = html.slice(html.indexOf('async function loadGlobalFromFirebase('), html.indexOf('// ─── TICKER MODE'));

function setup(data) {
  const reads = [];
  const c = vm.createContext({
    firebaseReady: true, DEV_MODE: false, squad: [], coaches: [], schedule: [], teams: [], STATE_KEY: 'state',
    localStorage: {getItem: () => null, setItem() {}},
    MatchTrackerTeams: {find: () => null}, getOurTeamName: () => 'SSV',
    firebase: {database: () => ({ref: path => ({path})})},
    readStoredValue: async ref => { reads.push(ref.path); const key = ref.path.split('/')[1]; return {val: () => data?.[key] ?? null}; },
    renderKaderList() {}, renderSpielplan() {}, renderTeamsList() {}, updateSpielplanGegnerSelect() {}, refreshReporterBranding() {},
    storageStatus(message) { c.status = message; }, globalLoaded: false,
  });
  vm.runInContext(source + '\nthis.load = loadGlobalFromFirebase;', c);
  return {c, reads};
}

test('reporter start reads only the app parts it needs, never app/news', async () => {
  const {c, reads} = setup({squad: [{id: 1, name: 'Max'}], trainer: [{id: 9}], schedule: {a: {id: 'a', opponent: 'X'}}, teams: [], news: [{image: 'riesig'}]});
  await new Promise(resolve => c.load(resolve));
  assert.deepEqual(reads.sort(), ['app/matchResetId', 'app/schedule', 'app/squad', 'app/teams', 'app/trainer']);
  assert.equal(c.squad.length, 1);
  assert.equal(c.coaches.length, 1);
  assert.equal(c.schedule[0].id, 'a');
  assert.equal(c.teams[0].isOurTeam, true);
  assert.equal(c.status, undefined);
});

test('an empty app keeps local data like before', async () => {
  const {c} = setup(null);
  c.squad = [{id: 5}];
  await new Promise(resolve => c.load(resolve));
  assert.deepEqual(c.squad.map(p => p.id), [5]);
});
