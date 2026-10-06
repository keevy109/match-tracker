const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('match-tracker.html','utf8');
const source=html.slice(html.indexOf('function startTimer()'),html.indexOf("document.addEventListener('visibilitychange'"));
test('single timer button starts, pauses and resumes without resetting elapsed time',()=>{
 const button={setAttribute(){}};let now=1000;
 const c=vm.createContext({timerBase:null,timerOffset:0,activeMatchId:1,Date:{now:()=>now},startTimerLoop(){},stopTimerLoop(){},save(){},showToast(){},updateFeedMatchTime(){},document:{getElementById:()=>button}});
 c.elapsedSeconds=()=>c.timerOffset+(c.timerBase===null?0:Math.floor((now-c.timerBase)/1000));
 vm.runInContext(source,c);c.toggleTimer();assert.equal(button.textContent,'⏸ Pause');
 now=61000;c.toggleTimer();assert.equal(c.timerOffset,60);assert.equal(button.textContent,'▶ Start');
 now=91000;c.toggleTimer();assert.equal(c.timerOffset,60);assert.equal(button.textContent,'⏸ Pause');
 c.updateTimerDisplay();assert.equal(button.textContent,'⏸ Pause');
});
