const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('match-tracker.html','utf8');
const source=html.slice(html.indexOf('function startTimer()'),html.indexOf("document.addEventListener('visibilitychange'"));
test('single timer button starts, pauses and resumes without resetting elapsed time',()=>{
 const button={setAttribute(){}};let now=1000;
 const c=vm.createContext({MatchTiming:require('../public/match-timing.js'),matchTiming:require('../public/match-timing.js').configure({count:2,minutes:25,breaks:[10]}),restoreTimingForm(){},homeScore:0,awayScore:0,timerStarted:false,timerBase:null,timerOffset:0,activeMatchId:1,Date:{now:()=>now},startTimerLoop(){},stopTimerLoop(){},save(){},showToast(){},updateFeedMatchTime(){},document:{getElementById:()=>button}});
 c.elapsedSeconds=()=>c.timerOffset+(c.timerBase===null?0:Math.floor((now-c.timerBase)/1000));
 vm.runInContext(source,c);c.toggleTimer();assert.equal(button.textContent,'⏸ Pause');
 now=61000;c.toggleTimer();assert.equal(c.timerOffset,60);assert.equal(button.textContent,'▶ Start');
 now=91000;c.toggleTimer();assert.equal(c.timerOffset,60);assert.equal(button.textContent,'⏸ Pause');
 c.updateTimerDisplay();assert.equal(button.textContent,'⏸ Pause');
});

test('starting then immediately pausing retains the started flag until reset',()=>{
 const c=vm.createContext({MatchTiming:require('../public/match-timing.js'),matchTiming:require('../public/match-timing.js').configure({count:2,minutes:25,breaks:[10]}),restoreTimingForm(){},homeScore:0,awayScore:0,timerStarted:false,timerBase:null,timerOffset:0,activeMatchId:1,Date:{now:()=>1000},elapsedSeconds:()=>0,startTimerLoop(){},stopTimerLoop(){},save(){},showToast(){},updateFeedMatchTime(){},document:{getElementById:()=>({setAttribute(){}})}});
 vm.runInContext(source,c);c.startTimer();c.pauseTimer();assert.equal(c.timerStarted,true);assert.equal(c.timerOffset,0);
 c.resetTimer();assert.equal(c.timerStarted,false);
});

test('first start requires timing configuration and does not start silently',()=>{
 let message='';const c=vm.createContext({MatchTiming:require('../public/match-timing.js'),matchTiming:null,timerStarted:false,timerBase:null,timerOffset:0,activeMatchId:1,showToast:m=>message=m,document:{getElementById:()=>({hidden:true,scrollIntoView(){}})}});
 vm.runInContext(source,c);c.startTimer();assert.equal(c.timerBase,null);assert.equal(c.timerStarted,false);assert.match(message,/Spielzeit/);
});
