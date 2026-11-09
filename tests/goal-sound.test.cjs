const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('public/goal-sound.js','utf8');
function setup() {
  let plays=0, visible=true, fail=false, state; const mutedAtPlay=[];
  const c=vm.createContext({});vm.runInContext(source,c);
  const audio={pause(){},currentTime:0,addEventListener(){},play(){plays++;mutedAtPlay.push(this.muted===true);return fail?Promise.reject(Error('blocked')):Promise.resolve();}};
  const controller=c.MatchTrackerGoalSound.create({audio,now:()=>100000,visible:()=>visible,changed:s=>{state=s;}});
  const data={isHomeTeam:false,awayTeam:'SSV Berghausen',homeTeam:'TuSpo Richrath',events:[]};
  return {controller,data,audio,mutedAtPlay,get plays(){return plays;},get state(){return state;},hide(){visible=false;},fail(){fail=true;}};
}
test('activation unlocks audio; initial history, opponents, comments and edits stay silent',async()=>{
  const x=setup();await x.controller.setEnabled(true);await Promise.resolve();assert.equal(x.plays,1);
  x.data.events=[{id:99991,team:'away'}];x.controller.observe('one',x.data);assert.equal(x.plays,1);
  x.data.events.push({id:99992,team:'home'},{id:99993,team:'away',typ:'kommentar'});
  x.controller.observe('one',x.data);assert.equal(x.plays,1);
  x.data.events.push({id:99994,team:'away'});x.controller.observe('one',x.data);assert.equal(x.plays,2);
  x.controller.observe('one',x.data);x.data.events=[];x.controller.observe('one',x.data);
  x.data.events=[{id:99994,team:'away',scorer:'korrigiert'}];x.controller.observe('one',x.data);assert.equal(x.plays,2);
});
test('off, hidden tabs, old reconnect events and other clubs never replay later',async()=>{
  const x=setup();x.controller.observe('one',x.data);
  x.data.events=[{id:99991,team:'away'}];x.controller.observe('one',x.data);
  await x.controller.setEnabled(true);x.controller.observe('one',x.data);assert.equal(x.plays,1);
  x.data.events.push({id:1000,team:'away'});x.controller.observe('one',x.data);assert.equal(x.plays,1);
  x.data.awayTeam='Anderer Verein';x.controller.goal('one',{id:99992,team:'away'},x.data);assert.equal(x.plays,1);
  x.data.awayTeam='SSV Berghausen';x.hide();x.controller.goal('one',{id:99993,team:'away'},x.data);assert.equal(x.plays,1);
});
test('reporter plays confirmed goals once, home side and opponent own goals count correctly',async()=>{
  const x=setup();await x.controller.setEnabled(true);x.data.isHomeTeam=true;x.data.homeTeam='SSV Berghausen';
  x.controller.goal('one',{id:99991,team:'home',isOwnGoal:true},x.data);assert.equal(x.plays,2);
  x.controller.goal('one',{id:99991,team:'home'},x.data);assert.equal(x.plays,2);
  x.controller.goal('one',{id:99992,team:'away',isOwnGoal:true},x.data);assert.equal(x.plays,2);
  x.controller.observe('two',{...x.data,events:[{id:99993,team:'home'}]});assert.equal(x.plays,2);
});
test('blocked silent activation disables sound and exposes recovery',async()=>{
  const x=setup();x.fail();await x.controller.setEnabled(true);await new Promise(resolve=>setImmediate(resolve));
  assert.equal(x.state.enabled,false);assert.match(x.state.error,/erneut einschalten/);
  const y=setup();await y.controller.setEnabled(true);assert.equal(y.state.enabled,true);assert.equal(y.state.playing,false);
  await y.controller.setEnabled(false);assert.equal(y.state.enabled,false);
});
test('tracker wires audio after successful persistence and inside live snapshot subscription',()=>{
  const html=fs.readFileSync('match-tracker.html','utf8');
  assert.match(html,/saved === true && String\(activeMatchId\)/);
  assert.match(html,/syncWritePromise !== previousWrite/);
  assert.match(html,/controller\?\.observe\(matchId, data\)/);
  assert.ok(fs.statSync('public/audio/tor-fuer-uns.mp3').size>0);
});

test('consent unlocks silently; only future goals play audibly; switching off stops playback',async()=>{
  const x=setup();await x.controller.setEnabled(true);
  assert.deepEqual(x.mutedAtPlay,[true]);assert.equal(x.audio.muted,false);assert.equal(x.state.playing,false);
  x.controller.goal('one',{id:99999,team:'away'},x.data);await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(x.mutedAtPlay,[true,false]);assert.equal(x.state.playing,true);
  await x.controller.setEnabled(false);assert.equal(x.state.playing,false);assert.equal(x.state.enabled,false);
});
