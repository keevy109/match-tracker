const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const tracker=fs.readFileSync(path.join(__dirname,'../match-tracker.html'),'utf8');
const admin=fs.readFileSync(path.join(__dirname,'../admin.html'),'utf8');

test('ticker exposes master data as read-only and has no training editor',()=>{
  assert.match(tracker,/id="matchTitle"[^>]*readonly/);
  assert.doesNotMatch(tracker,/onclick="switchTab\('(teams|training)'\)"/);
  assert.doesNotMatch(tracker,/onsubmit="event\.preventDefault\(\); addScheduleMatch\(\)"/);
  assert.doesNotMatch(tracker,/training\.js/);
  const saveGlobal=tracker.slice(tracker.indexOf('function saveGlobal()'),tracker.indexOf('async function loadGlobalFromFirebase'));
  assert.doesNotMatch(saveGlobal,/firebase\.database|\.update\(|\.transaction\(/);
});

test('admin owns the training editor and does not expose result entry',()=>{
  assert.match(admin,/data-tab="training"/);
  assert.match(admin,/id="trainingList"/);
  const adminScript=fs.readFileSync(path.join(__dirname,'../src/scripts/admin.js'),'utf8');
  const renderSchedule=adminScript.slice(adminScript.indexOf('function renderSpielplan()'),adminScript.indexOf('// ── Training'));
  assert.doesNotMatch(renderSchedule,/openResultForm|setNextMatch/);
});

test('tracker always renders and starts fixtures with canonical admin club names',()=>{
  const renderSchedule=tracker.slice(tracker.indexOf('function renderSpielplan()'),tracker.indexOf('// ── CONFIRM'));
  const startMatch=tracker.slice(tracker.indexOf('async function startMatchFromSchedule'),tracker.indexOf('function editScheduleMatch'));
  assert.match(renderSchedule,/getCanonicalTeamName\(m\.opponent\)/);
  assert.match(startMatch,/getCanonicalTeamName\(match\.opponent\)/);
});
