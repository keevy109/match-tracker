const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = vm.createContext({});
vm.runInContext(fs.readFileSync('public/schedule-data.js', 'utf8'), context);
const normalize = context.MatchTrackerSchedule.normalize;
const visibleMatches = context.MatchTrackerSchedule.visibleMatches;
const mergeAdminSchedule = context.MatchTrackerSchedule.mergeAdminSchedule;

test('tracked schedule exposes a completed match to the public website', () => {
  const schedule = {10: {id: 10, date: '2026-09-19', opponent: 'TG Burg', isHome: true, result: {home: 7, away: 3}}};
  const matches = {10: {matchFinished: true, homeScore: 7, awayScore: 3}};
  const [match] = normalize(schedule, matches, '2026-09-19');
  assert.equal(match.home, true);
  assert.equal(match.result, '7:3');
  assert.equal(match.status, 'past');
});

test('archived test matches stay hidden and an upcoming match becomes next', () => {
  const schedule = {
    1: {id: 1, date: '2026-09-19', archived: true, opponent: 'Test'},
    2: {id: 2, date: '2026-09-20', time: '12:00', isHome: false, opponent: 'B'},
    3: {id: 3, date: '2026-09-21', time: '10:00', isHome: true, opponent: 'C'},
  };
  const result = normalize(schedule, {}, '2026-09-19');
  assert.equal(result.length, 2);
  assert.equal(result[0].home, false);
  assert.equal(result[0].status, 'next');
  assert.equal(result[1].status, 'future');
});

test('a running tracker score is not shown as a completed result', () => {
  const schedule = {1: {id: 1, date: '2026-09-19', result: null}};
  const matches = {1: {matchFinished: false, homeScore: 2, awayScore: 1}};
  const [match] = normalize(schedule, matches, '2026-09-19');
  assert.equal(match.result, null);
  assert.equal(match.status, 'next');
});

test('an abandoned match is completed without publishing its score as a result', () => {
  const schedule = {1: {id: 1, date: '2026-09-26', opponent: 'Solingen', isHome: false}};
  const matches = {1: {matchFinished: true, abandoned: true, homeScore: 8, awayScore: 3}};
  const [match] = normalize(schedule, matches, '2026-09-27');
  assert.equal(match.result, null);
  assert.equal(match.abandoned, true);
  assert.equal(match.status, 'abandoned');
});

test('a fixture result is ignored when the authoritative match record is still live', () => {
  const schedule = {1: {id: 1, date: '2026-09-19', result: {home: 7, away: 3}}};
  const matches = {1: {matchFinished: false, homeScore: 7, awayScore: 3}};
  const [match] = normalize(schedule, matches, '2026-09-19');
  assert.equal(match.result, null);
  assert.equal(match.status, 'next');
  assert.equal(visibleMatches(matches, schedule)['1'].matchFinished, false);
});

test('archived tracker runs are excluded from website statistics', () => {
  const matches = {
    real: {matchFinished: true, homeScore: 7, awayScore: 3},
    test: {matchFinished: true, homeScore: 3, awayScore: 1},
    orphan: {matchFinished: true, homeScore: 2, awayScore: 2},
  };
  const schedule = {
    real: {id: 'real'},
    test: {id: 'test', archived: true},
  };
  assert.deepEqual(
    Object.keys(visibleMatches(matches, schedule)).sort(),
    ['real'],
  );
});

test('admin schedule editing keeps results out of fixtures and archives only removed games', () => {
  const current = {
    1: {id: 1, opponent: 'Alt', isHome: true, result: {home: 7, away: 3, events: [{id: 9}]}, participantIds:[4,5]},
    2: {id: 2, opponent: 'Entfernen', isHome: false},
    3: {id: 3, opponent: 'Alter Test', archived: true},
  };
  const updates = mergeAdminSchedule(current, [
    {id: 1, opponent: 'Neu', home: true, date: '2026-09-19', time: '12:30', result: '8:3'},
    {id: 4, opponent: 'Nächstes Spiel', home: false, date: '2026-09-26', time: '12:00', result: null},
  ]);
  assert.equal(updates['1'].opponent, 'Neu');
  assert.equal(updates['1'].result, undefined);
  assert.equal(updates['1'].participantIds, undefined);
  assert.equal(updates['2'].archived, true);
  assert.equal(updates['3'], undefined);
  assert.equal(updates['4'].isHome, false);
});

test('reporter receives newly added HSV fixture and keeps abandoned games closed',()=>{
 const source={hsv:{id:12,opponent:'HSV Langenfeld',date:'2026-10-07',type:'Testspiel'},wald:{id:13,opponent:'Solingen-Wald',date:'2026-09-26'}};
 const matches={12:{matchFinished:true,homeScore:20,awayScore:0},13:{matchFinished:true,abandoned:true,homeScore:8,awayScore:3}};
 const result=context.MatchTrackerSchedule.reporterSchedule(source,matches,[]);
 assert.equal(result.length,2);assert.equal(result[0].result.home,20);assert.equal(result[0].type,'Testspiel');
 assert.equal(result[1].abandoned,true);assert.equal(result[1].result.home,8);
 assert.equal(source.hsv.result,undefined);
});
test('reporter sorts next fixtures chronologically before all past and completed matches',()=>{
 const items=[{id:1,date:'2026-09-26',abandoned:true},{id:2,date:'2026-12-05'},{id:3,date:'2026-11-21',type:'Testspiel'}, {id:4,date:'2026-11-07'}, {id:5,date:'2026-10-07',result:{}}, {id:6,date:'2026-09-01'}, {id:7,date:'2026-10-01',archived:true}];
 const before=JSON.stringify(items);
 assert.deepEqual(Array.from(context.MatchTrackerSchedule.sortReporter(items,'2026-10-10',null),m=>m.id),[4,3,2,6,1,5]);
 assert.equal(JSON.stringify(items),before);
});
