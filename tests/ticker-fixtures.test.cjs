const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const fixtures=require('../public/ticker-fixtures.js');
test('fixture inputs remain isolated and minimal is truly minimal',()=>{
 assert.deepEqual(fixtures.get('fallback'),{});
 assert.deepEqual(Object.keys(fixtures.get('min')).sort(),['awayScore','awayTeam','homeScore','homeTeam']);
 const max=fixtures.get('max');max.events.pop();assert.equal(fixtures.get('max').events.length,12);
 assert.throws(()=>fixtures.get('unknown'));assert.equal(fixtures.get('finished').matchFinished,true);assert.equal(fixtures.get('abandoned').abandoned,true);
});
test('maximum has valid timed automation and selected roster',()=>{
 const max=fixtures.get('max'),timing=require('../public/match-timing.js');
 assert.equal(timing.describe(max.matchTiming,max.timerOffset,{...max,started:true,running:true}).messages.length,1);
 assert.ok(max.participantIds.every(id=>max.squad.some(p=>p.id===id)));
});
test('fixture startup returns before Firebase initialization',()=>{
 const html=fs.readFileSync('match-tracker.html','utf8');
 const branch=html.slice(html.indexOf("if (DEV_MODE && params.has('fixture'))"),html.indexOf('    initTickerMode(tickerId);'));
 assert.match(branch,/return;\s*}\s*if \(tickerId\)/);assert.doesNotMatch(branch,/localStorage|initFirebase\(/);
});
