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
  assert.equal(grigorios.detailPhoto,'uploads/kader/detail/grigorios-20261006.mp4');
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
  const pan=JSON.parse(read('public/data/kader.json')).find(player=>player.name==='Pan');
  assert.equal(pan.detailPhoto,'uploads/kader/detail/1774612473166_viggle.mp4');
  assert.equal(fs.existsSync(path.join(__dirname,'../public',pan.detailPhoto)),true);
  const emil=JSON.parse(read('public/data/kader.json')).find(player=>player.name==='Emil');
  assert.equal(emil.detailPhoto,'uploads/kader/detail/1774617555637_viggle.mp4');
  assert.equal(fs.existsSync(path.join(__dirname,'../public',emil.detailPhoto)),true);
  const till=JSON.parse(read('public/data/kader.json')).find(player=>player.name==='Till');
  assert.equal(till.detailPhoto,'uploads/kader/detail/1774612465173_viggle.mp4');
  assert.equal(fs.existsSync(path.join(__dirname,'../public',till.detailPhoto)),true);
  const tom=JSON.parse(read('public/data/kader.json')).find(player=>player.name==='Tom');
  assert.equal(tom.detailPhoto,'uploads/kader/detail/3573174242563_viggle.mp4');
  assert.equal(fs.existsSync(path.join(__dirname,'../public',tom.detailPhoto)),true);
  const leo=JSON.parse(read('public/data/kader.json')).find(player=>player.name==='Leo');
  assert.equal(leo.detailPhoto,'uploads/kader/detail/1774617538359_viggle.mp4');
  assert.equal(fs.existsSync(path.join(__dirname,'../public',leo.detailPhoto)),true);
  const paul=JSON.parse(read('public/data/kader.json')).find(player=>player.name==='Paul');
  assert.equal(paul.detailPhoto,'uploads/kader/detail/1774617570999_viggle.mp4');
  assert.equal(fs.existsSync(path.join(__dirname,'../public',paul.detailPhoto)),true);
});

test('roster portraits keep their top spacing and sit flush on the row bottom',()=>{
  const css=fs.readFileSync(path.join(__dirname,'../src/styles/kader.css'),'utf8');
  assert.match(css,/\.kl-header,\s*#kaderRows \.kl-row\s*\{[^}]*gap:\s*12px/s);
  assert.match(css,/#kaderRows \.kl-avatar\s*\{[^}]*height:\s*46px[^}]*margin-bottom:\s*-10px/s);
  assert.match(css,/#kaderRows \.kl-avatar img\s*\{[^}]*object-fit:\s*contain[^}]*object-position:\s*center bottom/s);
});

test('supplied transparent roster portraits are assigned by player name',()=>{
  const roster=JSON.parse(fs.readFileSync(path.join(__dirname,'../public/data/kader.json'),'utf8'));
  const names=['Aleciano','Emil','Grigorios','Jonah','Leo','Max','Pan','Paul','Till','Tom'];
  for(const name of names){
    const player=roster.find(item=>item.name===name);
    const expected=name==='Grigorios'
      ? 'uploads/kader/portraits/grigorios-20261006.png'
      : `uploads/kader/portraits/${name.toLowerCase()}.png`;
    assert.equal(player?.photo,expected);
    assert.equal(fs.existsSync(path.join(__dirname,'../public',expected)),true);
  }
});

test('public ticker loads current roster portraits as its source of truth',()=>{
  const tracker=fs.readFileSync(path.join(__dirname,'../match-tracker.html'),'utf8');
  assert.match(tracker,/ref\('app\/squad'\)\.on\('value'/);
  assert.match(tracker,/const photo = player\?\.photo \|\| event\[prefix \+ 'Photo'\]/);
  assert.match(tracker,/const photo = isGoal \? scorerMember\?\.photo \|\| event\.scorerPhoto/);
});

test('tracker roster views use the current player portraits',()=>{
  const tracker=fs.readFileSync(path.join(__dirname,'../match-tracker.html'),'utf8');
  assert.match(tracker,/function renderKaderList\(\)[\s\S]*?class="player-avatar" src="\$\{esc\(p\.photo\)\}"/);
  assert.match(tracker,/function renderSetupSquadPreview\(\)[\s\S]*?class="player-avatar" src="\$\{esc\(p\.photo\)\}"/);
  assert.match(tracker,/function editParticipants\(id\)[\s\S]*?class="player-avatar" src="\$\{esc\(p\.photo\)\}"/);
  assert.match(tracker,/\.player-avatar \{[^}]*object-fit:\s*contain[^}]*object-position:\s*center bottom/s);
});

test('website links to the isolated tracker test mode',()=>{
  const ticker=fs.readFileSync(path.join(__dirname,'../src/sections/ticker.frag'),'utf8');
  assert.match(ticker,/href="match-tracker\.html\?dev=1"[^>]*>Tracker testen</);
});

test('dev tracker previews goals and other events with the spectator overlay',()=>{
  const tracker=fs.readFileSync(path.join(__dirname,'../match-tracker.html'),'utf8');
  assert.match(tracker,/function previewDevTickerOverlay\(event\)[\s\S]*?DEV_MODE[\s\S]*?enqueueTickerOverlay\(event, matchSnapshot\(\)\)/);
  assert.match(tracker,/function addGoal\([\s\S]*?previewDevTickerOverlay\(event\)/);
  assert.match(tracker,/async function saveEventModal\([\s\S]*?previewDevTickerOverlay\(ev\)/);
});

test('transparent overlay portraits extend above their smaller avatar circles',()=>{
  const tracker=fs.readFileSync(path.join(__dirname,'../match-tracker.html'),'utf8');
  assert.match(tracker,/\.goal-overlay-card\.has-photo::before\s*\{[^}]*width:\s*132px[^}]*border-radius:\s*50%/);
  assert.match(tracker,/\.goal-overlay-player-photo\s*\{[^}]*object-fit:\s*contain[^}]*transform:\s*translate\(-50%,\s*-100%\)/);
  assert.match(tracker,/\.goal-overlay-player-photo\s*\{[^}]*mask-image:[^;]*ellipse 64px 78px[^;]*circle 66px/);
  assert.match(tracker,/\.substitution-avatar\s*\{[^}]*overflow:\s*visible/);
  assert.match(tracker,/\.substitution-avatar::before\s*\{[^}]*width:\s*78%[^}]*border-radius:\s*50%/);
  assert.match(tracker,/\.substitution-avatar img\s*\{[^}]*mask-image:[^;]*ellipse 36px 44px[^;]*circle 38px/);
});

test('dev mode switches locally between entry and spectator views',()=>{
  const tracker=fs.readFileSync(path.join(__dirname,'../match-tracker.html'),'utf8');
  assert.match(tracker,/id="devViewAdmin"[^>]*onclick="setDevView\('admin'\)"[^>]*>Eintragen</);
  assert.match(tracker,/id="devViewTicker"[^>]*onclick="setDevView\('ticker'\)"[^>]*>Zuschauer</);
  assert.match(tracker,/function setDevView\(mode\)[\s\S]*?classList\.toggle\('ticker-mode', spectator\)/);
  assert.match(tracker,/function refreshDevSpectatorView\(\)[\s\S]*?matchSnapshot\(\)[\s\S]*?updateTickerUI\(data, null\)/);
  assert.match(tracker,/Lokale Testansicht · nichts wird veröffentlicht/);
  assert.match(tracker,/function resetDevMode\(\)[\s\S]*?storageReady = false;[\s\S]*?localStorage\.removeItem\(STATE_KEY\);[\s\S]*?window\.location\.reload\(\)/);
});

test('spectator ticker uses only the feed layout in live and dev mode',()=>{
  const tracker=fs.readFileSync(path.join(__dirname,'../match-tracker.html'),'utf8');
  assert.doesNotMatch(tracker,/tickerLayout|setTickerLayout|ticker-layout-toggle|matchtracker_ticker_layout|ticker-feed|ticker-timeline/);
  assert.match(tracker,/class="feed-result-header"[^>]*>[\s\S]*?id="feedScoreHome"[\s\S]*?id="feedScoreAway"/);
  assert.match(tracker,/body:is\(\.ticker-mode, \.dev-mode, \.entry-mode\) \.scoreboard \{ display: none; \}/);
  assert.match(tracker,/body:is\(\.ticker-mode, \.dev-mode, \.entry-mode\) \.events-section \{ width: 100%; padding: 0;/);
  assert.match(tracker,/body:is\(\.ticker-mode, \.dev-mode, \.entry-mode\) \.event-item\[data-type="tor"\]/);
  assert.match(tracker,/align-items: flex-start; justify-content: space-between;/);
  assert.match(tracker,/body:is\(\.ticker-mode, \.dev-mode, \.entry-mode\) \.event-item\[data-type="tor"\] \.event-tag \{ display: none; \}/);
  assert.match(tracker,/body:is\(\.ticker-mode, \.dev-mode, \.entry-mode\) \.event-item \.event-icon \{ display: none; \}/);
  assert.match(tracker,/font-size: 18px; font-weight: 800;/);
  assert.match(tracker,/font-size: 52px; line-height: 1; font-weight: 800;/);
  assert.match(tracker,/body:is\(\.ticker-mode, \.dev-mode, \.entry-mode\) \.event-score-previous \{ opacity: 0\.4; \}/);
  assert.match(tracker,/\.event-season-goals \{ display: block; margin-top: 3px; font-size: 13px; font-weight: 300; \}/);
  assert.match(tracker,/width: 100%; min-height: 260px;/);
  assert.match(tracker,/\.event-item\[data-type="wechsel"\] \{ min-height: 260px; \}/);
  assert.match(tracker,/position: absolute; right: 0; bottom: -4px;/);
  assert.match(tracker,/width: 240px; height: 240px;/);
  assert.doesNotMatch(tracker,/event-player-video/);
  assert.match(tracker,/item\.dataset\.team = .*e\.team === 'away' \? 'away' : 'home'/);
  assert.match(tracker,/item\.dataset\.type = e\.typ \|\| 'tor'/);
});

test('dev entry uses feed styles while spectator controls stay hidden',()=>{
  assert.match(tracker,/body:is\(\.ticker-mode, \.dev-mode, \.entry-mode\) \.event-item\[data-type="tor"\]/);
  assert.doesNotMatch(tracker,/body\.dev-mode\.dev-spectator-mode\.ticker-mode \.(goal-section|event-btns-row|timer-row)/);
  assert.match(tracker,/if \(devViewMode === 'admin'\) renderEvents\(\)/);
});
