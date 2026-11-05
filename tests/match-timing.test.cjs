const {test}=require('node:test');
const assert=require('node:assert/strict');
const timing=require('../public/match-timing.js');
test('halftime warning, exact boundary and added-time clock',()=>{
 const s=timing.configure({count:2,minutes:25,breaks:[10]});
 assert.match(timing.describe(s,1440,{started:true}).text,/noch 1 Minute bis zur Halbzeit/);
 assert.equal(timing.describe(s,1500,{started:true}).clock,'25 +0');
 assert.equal(timing.describe(s,1572,{started:true}).clock,'25 +1');
 assert.equal(timing.describe(s,1772,{started:true}).clock,'25 +4');
 assert.equal(timing.describe(null,1572).clock,'26:12');
});
test('period transition excludes previous added time and measures pause with wall clock',()=>{
 const s=timing.endPeriod(timing.configure({count:2,minutes:25,breaks:[10]}),1572,1000);
 assert.equal(timing.describe(s,1572,{now:541000}).clock,'25:00');
 assert.match(timing.describe(s,1572,{now:541000}).text,/Pause · bereit/);
 assert.match(timing.describe(s,1572,{now:601000}).text,/Pause · bereit/);
 const next=timing.resume(s);
 assert.equal(timing.describe(next,1632,{started:true}).clock,'26:00');
 assert.equal(timing.describe(next,1632).minute,27);
 assert.match(timing.describe(next,3012,{started:true}).text,/noch 1 Minute bis zum Abpfiff/);
 assert.throws(()=>timing.endPeriod(next,3100,2000));
});
test('thirds and quarters, score and message vocabulary; inputs validated',()=>{
 for(const count of [1,2,3,4]){
  const s=timing.configure({count,minutes:10,breaks:Array(count-1).fill(3),message:'Testnachricht'});
  const d=timing.describe(s,540,{started:true,homeScore:2,awayScore:1});
  assert.match(d.text,/Ergebnis: 2:1/);assert.match(d.text,/Testnachricht/);
  assert.match(d.text,new RegExp(timing.vocabulary.periods[count]));
 }
 assert.throws(()=>timing.configure({count:5,minutes:10}));
 assert.throws(()=>timing.configure({count:2,minutes:0}));
 assert.throws(()=>timing.configure({count:3,minutes:10,breaks:[5]}));
 assert.throws(()=>timing.configure({count:2,minutes:10,breaks:[-1]}));
});
test('duration-only API and visual format plans derive period durations',()=>{
 const defaultGame=timing.configure(50);
 assert.equal(defaultGame.count,2);
 assert.equal(defaultGame.minutes,25);
 for(const count of [1,2,3,4]){
  const state=timing.configure({duration:60,count});
  assert.equal(state.minutes,60/count);
  assert.equal(state.breaks.length,count-1);
  assert.match(timing.plan({duration:60,count}).summary,/60 Minuten Spielzeit/);
 }
 assert.throws(()=>timing.configure({duration:50,count:3}));
 assert.throws(()=>timing.configure({duration:0,count:2}));
});
