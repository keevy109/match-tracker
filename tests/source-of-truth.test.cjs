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

test('new crest is limited to team contexts while branding keeps the white logo',()=>{
  const read=relative=>fs.readFileSync(path.join(__dirname,'..',relative),'utf8');
  assert.match(read('src/sections/nav.frag'),/ssvlogo_white\.png/);
  assert.match(read('src/sections/splash.frag'),/ssvlogo_white\.png/);
  assert.match(read('src/sections/kader.frag'),/ssvlogo_white\.png/);
  assert.match(read('src/sections/matchday-modal.frag'),/ssvlogo\.png/);
  assert.match(read('src/scripts/spielplan.js'),/ssvlogo\.png/);
  assert.match(tracker,/const OUR_TEAM_LOGO = '\.\/ssvlogo\.png'/);
});

test('abandoned fixtures retain image export with an explicit intermediate-score label',()=>{
  assert.match(tracker,/statusLabel: m\.abandoned \? 'ABBRUCH · ZWISCHENSTAND'/);
  assert.match(tracker,/shareCanvas\(canvas, m\.abandoned \? 'spielabbruch\.png'/);
  const renderSchedule=tracker.slice(tracker.indexOf('function renderSpielplan()'),tracker.indexOf('// ── CONFIRM'));
  assert.match(renderSchedule,/if \(m\.abandoned\)[\s\S]*?exportImageForMatch/);
});

test('player detail cards support videos and use the supplied player clips',()=>{
  const read=relative=>fs.readFileSync(path.join(__dirname,'..',relative),'utf8');
  const fragment=read('src/sections/kader.frag');
  const script=read('src/scripts/kader.js');
  assert.match(fragment,/<video id="kdVideo"[^>]*muted[^>]*playsinline/);
  assert.doesNotMatch(fragment,/<video id="kdVideo"[^>]*loop/);
  assert.match(script,/function isVideoSource\(src\)/);
  assert.match(script,/function rewindAndReplay\(video\)[\s\S]*?startAt - \(now - startedAt\) \/ 1000/);
  assert.match(script,/kaderDetail[^\n]*addEventListener\('click',[\s\S]*?rewindAndReplay\(video\)/);
  const grigorios=JSON.parse(read('public/data/kader.json')).find(player=>player.name==='Grigorios');
  assert.equal(grigorios.detailPhoto,'uploads/kader/detail/1783855173705_uywz5o8pbzc.mp4');
  assert.equal(fs.existsSync(path.join(__dirname,'../public',grigorios.detailPhoto)),true);
  const jonah=JSON.parse(read('public/data/kader.json')).find(player=>player.name==='Jonah');
  assert.equal(jonah.detailPhoto,'uploads/kader/detail/1774612459953_viggle.mp4');
  assert.equal(fs.existsSync(path.join(__dirname,'../public',jonah.detailPhoto)),true);
  const max=JSON.parse(read('public/data/kader.json')).find(player=>player.name==='Max');
  assert.equal(max.detailPhoto,'uploads/kader/detail/1783802799906_viggle.mp4');
  assert.equal(fs.existsSync(path.join(__dirname,'../public',max.detailPhoto)),true);
  const aleciano=JSON.parse(read('public/data/kader.json')).find(player=>player.name==='Aleciano');
  assert.equal(aleciano.detailPhoto,'uploads/kader/detail/3573174372953_viggle.mp4');
  assert.equal(fs.existsSync(path.join(__dirname,'../public',aleciano.detailPhoto)),true);
});
