const {test}=require('node:test'); const assert=require('node:assert/strict');
const fs=require('node:fs'), vm=require('node:vm');
test('loader waits for every source and decoded crests before revealing the ticker',async()=>{
 const classes=new Set(),fields={span:{},button:{hidden:true}},timers=[];let removed=false,decoded;
 const image={getAttribute:()=>'/crest.png',decode:()=>new Promise(resolve=>{decoded=resolve;})};
 const overlay={setAttribute(){},querySelector:s=>fields[s],remove(){removed=true;}};
 const c=vm.createContext({setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout(){},location:{reload(){}},document:{createElement:()=>overlay,querySelectorAll:()=>[image],body:{appendChild(){},classList:{add:s=>classes.add(s),remove:s=>classes.delete(s)}}}});
 vm.runInContext(fs.readFileSync('public/ticker-loader.js','utf8'),c);
 const loading=c.MatchTrackerLoader.start(['match','teams']);await loading.ready('match');
 assert(classes.has('ticker-loading'));assert(!removed);
 const ready=loading.ready('teams');assert(!removed);decoded();await ready;
 assert(removed);assert(classes.has('ticker-loaded'));assert(!classes.has('ticker-loading'));
});
test('loader exposes retry on timeout instead of silently revealing incomplete data',()=>{
 const fields={span:{},button:{hidden:true}},timers=[];
 const c=vm.createContext({setTimeout:fn=>timers.push(fn),clearTimeout(){},location:{reload(){}},document:{createElement:()=>({setAttribute(){},querySelector:s=>fields[s]}),body:{appendChild(){},classList:{add(){}}}}});
 vm.runInContext(fs.readFileSync('public/ticker-loader.js','utf8'),c);c.MatchTrackerLoader.start(['match']);timers[0]();
 assert.equal(fields.button.hidden,false);assert.match(fields.span.textContent,/Verbindung/);
});
