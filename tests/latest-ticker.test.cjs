const {test}=require('node:test');const assert=require('node:assert/strict');
require('../public/schedule-data.js');const {latestTicker}=globalThis.MatchTrackerSchedule;
const schedule={a:{id:1,opponent:'Alt',date:'2026-09-01',isHome:true},b:{id:2,opponent:'Neu',date:'2026-10-01',isHome:false},c:{id:3,opponent:'Offen',date:'2026-11-07'},d:{id:4,opponent:'Archiv',date:'2026-12-01',archived:true}};
test('latest ticker is the newest fixture that has match data',()=>{const matches={1:{matchFinished:true},2:{matchFinished:true}};assert.deepEqual(latestTicker(schedule,matches),{id:'2',opponent:'Neu',home:false,date:'2026-10-01',time:'',live:false});});
test('a running match beats newer finished ones; archived fixtures never count',()=>{const matches={1:{matchFinished:false},2:{matchFinished:true},4:{matchFinished:false}};assert.equal(latestTicker(schedule,matches).id,'1');assert.equal(latestTicker(schedule,matches).live,true);});
test('fixtures without match data are ignored and nothing yields null',()=>{assert.equal(latestTicker(schedule,{3:{matchFinished:true}}).id,'3');assert.equal(latestTicker(schedule,{}),null);assert.equal(latestTicker(null,null),null);});
