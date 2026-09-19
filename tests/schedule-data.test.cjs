const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = vm.createContext({});
vm.runInContext(fs.readFileSync('public/schedule-data.js', 'utf8'), context);
const normalize = context.MatchTrackerSchedule.normalize;
const visibleMatches = context.MatchTrackerSchedule.visibleMatches;

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
  const schedule = {1: {id: 1, date: '2026-09-19', result: {home: 2, away: 1}}};
  const matches = {1: {matchFinished: false, homeScore: 2, awayScore: 1}};
  const [match] = normalize(schedule, matches, '2026-09-19');
  assert.equal(match.result, null);
  assert.equal(match.status, 'next');
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
    ['orphan', 'real'],
  );
});
