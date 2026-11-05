const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('match-tracker.html','utf8'),source=html.slice(html.indexOf('window.TrackerScoreboard ='),html.indexOf('// Restore saved state'));
test('touch commands delegate and spectator/unready sessions cannot mutate',()=>{
 const calls=[];const c=vm.createContext({window:{},storageReady:true,matchTransition:false,activeMatchId:1,PAGE_PARAMS:new URLSearchParams(),events:[{id:3,typ:'kommentar'},{id:2,team:'home'},{id:1,typ:'tor',team:'away'}],addGoal:(...v)=>calls.push(v),deleteEvent:id=>calls.push(id)});
 vm.runInContext(source,c);c.window.TrackerScoreboard.goal('home');assert.deepEqual(calls[0],['home',false,null]);c.window.TrackerScoreboard.undo();assert.equal(calls[1],2);
 c.PAGE_PARAMS.set('ticker','1');c.window.TrackerScoreboard.goal('away');c.window.TrackerScoreboard.undo();assert.equal(calls.length,2);
 c.PAGE_PARAMS.delete('ticker');c.storageReady=false;c.window.TrackerScoreboard.goal('away');assert.equal(calls.length,2);
});
