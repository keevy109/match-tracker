const {test}=require('node:test'); const assert=require('node:assert/strict');
const fs=require('node:fs'), vm=require('node:vm'), path=require('node:path');
const html=fs.readFileSync(process.env.TRACKER_HTML || path.join(__dirname,'../match-tracker.html'),'utf8');
const source=html.slice(html.indexOf('function isCommentPhoto('),html.indexOf('function buildPlayerOptions('))+html.slice(html.indexOf('function createTickerEventDetector()'),html.indexOf('function updateTickerUI('));
function context() {
  const nodes = {}, timers = [];
  const c = vm.createContext({
    squad: [],
    setTimeout: fn => { timers.push(fn); return timers.length; },
    clearTimeout() {},
    document: {
      getElementById: id => nodes[id] ??= {
        textContent: '', src: '', style: {},
        classList: { add() {}, remove() {}, toggle() {} },
      },
    },
  });
  vm.runInContext(source, c);
  return { c, nodes, timers };
}
test('new goals, substitutions and comments trigger without needing a score change',()=>{
 const {c}=context(); const detect=vm.runInContext('createTickerEventDetector()',c);
 assert.equal(detect([{id:1}]).length,0);
 assert.equal(detect([{id:1},{id:2,typ:'wechsel'}])[0].typ,'wechsel');
 assert.equal(detect({a:{id:1},b:{id:2,typ:'wechsel'},c:{id:3,typ:'kommentar'}})[0].typ,'kommentar');
 assert.equal(detect([{id:1},{id:2},{id:3},{id:4}])[0].id,4);
});
test('reload baseline, edits, repeated snapshots and deletions do not replay events',()=>{
 const {c}=context();const detect=vm.runInContext('createTickerEventDetector()',c);
 assert.equal(detect([{id:1,typ:'kommentar',text:'alt'}]).length,0);
 assert.equal(detect([{id:1,typ:'kommentar',text:'neu'}]).length,0);
 assert.equal(detect([]).length,0);assert.equal(detect([{id:1}]).length,0);
});
test('substitution displays both players and comment is literal text',()=>{
 const {c,nodes}=context();c.showGoalOverlay({id:2,typ:'wechsel',reinName:'Anna',rausName:'Ben',minute:7},{});
 assert.equal(nodes.goalOverlayTitle.textContent,'Wechsel');assert.match(nodes.goalOverlayScorer.textContent,/Rein: Anna\n↓ Raus: Ben/);
 c.showGoalOverlay({id:3,typ:'kommentar',text:'<b>Test</b>'},{});
 assert.equal(nodes.goalOverlayTitle.textContent,'Text');assert.equal(nodes.goalOverlayScorer.textContent,'<b>Test</b>');assert.equal(nodes.goalOverlayScore.textContent,'');
 c.showGoalOverlay({id:4,team:'home',snapshot:'1:0'},{homeTeam:'Heim'});
 assert.equal(nodes.goalOverlayTitle.textContent,'Tor für');assert.equal(nodes.goalOverlayScore.textContent,'1:0');assert.equal(nodes.goalOverlayEmoji.style.display,'none');
});
test('multiple events are displayed in sequence instead of replacing each other',()=>{
 const {c,nodes,timers}=context();c.enqueueTickerOverlay({id:1,typ:'kommentar',text:'Erster'},{});c.enqueueTickerOverlay({id:2,typ:'kommentar',text:'Zweiter'},{});
 assert.equal(nodes.goalOverlayScorer.textContent,'Erster');timers.shift()();timers.shift()();assert.equal(nodes.goalOverlayScorer.textContent,'Zweiter');
});

test('team comment shows the selected team and optional image, then clears the image',()=>{
 const {c,nodes}=context();const classes=new Set();
 c.document.getElementById('goalOverlayCard').classList={add: x=>classes.add(x),remove: (...xs)=>xs.forEach(x=>classes.delete(x)),toggle(){}};
 const photo='data:image/webp;base64,aGVsbG8=';
 c.showGoalOverlay({id:10,typ:'kommentar',team:'away',text:'Großchance!',photo},{homeTeam:'Heim',awayTeam:'Gast'});
 assert.equal(nodes.goalOverlayTeam.textContent,'Gast');assert.equal(classes.has('away-glow'),true);
 assert.equal(nodes.goalOverlayEventPhoto.src,photo);assert.equal(nodes.goalOverlayEventPhoto.style.display,'block');
 c.showGoalOverlay({id:11,typ:'kommentar',team:'home',text:'Weiter!'},{homeTeam:'Heim',awayTeam:'Gast'});
 assert.equal(nodes.goalOverlayTeam.textContent,'Heim');assert.equal(classes.has('away-glow'),false);assert.equal(nodes.goalOverlayEventPhoto.style.display,'none');
});

for (const team of ['home','away']) test(`substitution uses ${team} color and both player photos`,()=>{
 const {c,nodes}=context();const classes=new Set();
 c.document.getElementById('goalOverlayCard').classList={add:x=>classes.add(x),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),toggle(){}};
 c.showGoalOverlay({id:1,typ:'wechsel',team,reinName:'Mika',rausName:'Till',reinPhoto:'in.png',rausPhoto:'out.png'}, {homeTeam:'Heim',awayTeam:'Gast'});
 assert.equal(classes.has('away-glow'),team==='away');assert.equal(nodes.goalOverlayTeam.textContent,team==='home'?'Heim':'Gast');
 assert.equal(nodes.subInName.textContent,'Mika');assert.equal(nodes.subOutName.textContent,'Till');assert.equal(nodes.subInPhoto.src,'in.png');assert.equal(nodes.subOutPhoto.src,'out.png');assert.equal(nodes.substitutionPlayers.style.display,'grid');
 c.showGoalOverlay({typ:'kommentar',text:'Weiter!',team},{});assert.equal(nodes.substitutionPlayers.style.display,'none');assert.equal(nodes.goalOverlayScorer.style.display,'');
});
test('older substitutions obtain team side and photos from the match snapshot',()=>{
 const {c,nodes}=context();c.showGoalOverlay({typ:'wechsel',reinId:1,rausId:2},{isHomeTeam:false,awayTeam:'Unser Team',squad:{a:{id:1,name:'Rein',photo:'one.png'},b:{id:2,name:'Raus'}}});
 assert.equal(nodes.goalOverlayTeam.textContent,'Unser Team');assert.equal(nodes.subInPhoto.src,'one.png');assert.equal(nodes.subOutFallback.style.display,'');
 nodes.subInPhoto.onerror();assert.equal(nodes.subInPhoto.style.display,'none');assert.equal(nodes.subInFallback.style.display,'');
});
