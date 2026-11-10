const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('match-tracker.html','utf8');
const c=vm.createContext({Date});
vm.runInContext(html.slice(html.indexOf('function kickoffLabel('),html.indexOf('function updateFeedMatchTime(')),c);
const today=new Date('2026-11-10T09:00:00');

test('kickoff label says HEUTE and MORGEN when they apply',()=>{
  assert.equal(c.kickoffLabel({date:'2026-11-10',time:'17:30'},today),'HEUTE · 17:30');
  assert.equal(c.kickoffLabel({date:'2026-11-11',time:'17:30'},today),'MORGEN · 17:30');
  assert.equal(c.kickoffLabel({date:'2026-11-10'},today),'HEUTE');
  assert.equal(c.kickoffLabel({date:'2027-01-01',time:'11:00'},new Date('2026-12-31T22:00:00')),'MORGEN · 11:00');
});

test('kickoff label falls back to dd.mm. for other days',()=>{
  assert.equal(c.kickoffLabel({date:'2026-11-14',time:'11:00:00'},today),'14.11. · 11:00');
  assert.equal(c.kickoffLabel({date:'2026-12-05'},today),'05.12.');
  assert.equal(c.kickoffLabel({time:'9:30'},today),'ANSTOSS · 9:30');
});

test('teaser clock never shows LIVE',()=>{
  const clock={textContent:'',classList:{remove(cls){this.removed=cls;},toggle(){}}};
  const ctx=vm.createContext({Date,document:{getElementById:id=>id==='feedMatchTime'?clock:null}});
  vm.runInContext(html.slice(html.indexOf('function kickoffLabel('),html.indexOf('function updateDevTickerClock(')),ctx);
  ctx.updateFeedMatchTime({teaser:true,fixture:{date:'2099-01-03',time:'09:15'}});
  assert.equal(clock.textContent,'03.01. · 09:15');
  assert.equal(clock.classList.removed,'is-live');
});
