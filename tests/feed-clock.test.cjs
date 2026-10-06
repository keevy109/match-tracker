const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('match-tracker.html','utf8');
const source=html.slice(html.indexOf('function updateFeedMatchTime('),html.indexOf('function updateDevTickerClock('));
test('feed clock follows elapsed time, pauses and terminal match states',()=>{
 const clock={};
 const c=vm.createContext({document:{getElementById:()=>clock},Date:{now:()=>160000}});
 vm.runInContext(source,c);
 c.updateFeedMatchTime({timerBase:100000,timerOffset:125});
 assert.equal(clock.textContent,'LIVE · 3:05');
 c.updateFeedMatchTime({timerBase:null,timerOffset:185});
 assert.equal(clock.textContent,'PAUSE · 3:05');
 c.updateFeedMatchTime({timerBase:null,timerOffset:0});
 assert.equal(clock.textContent,'LIVE · 0:00');
 c.updateFeedMatchTime({matchFinished:true});assert.equal(clock.textContent,'ENDE');
 c.updateFeedMatchTime({abandoned:true});assert.equal(clock.textContent,'ABBRUCH');
});
