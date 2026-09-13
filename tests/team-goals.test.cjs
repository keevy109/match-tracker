const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../match-tracker.html'),'utf8');
const code=html.slice(html.indexOf('const DEFAULT_OUR_TEAM'),html.indexOf('// ─── TAB NAVIGATION'))+
html.slice(html.indexOf('function getMatchTeams()'),html.indexOf('function exportText()'))+
html.slice(html.indexOf('function updateGoalButtons()'),html.indexOf('function deleteEvent('));
function setup(title){
 const nodes={};let pickerCount=0;
 function element(){return {value:'',textContent:'',dataset:{},style:{},classList:{add(){},remove(){}},querySelector(sel){return this[sel]??=(element());},parentElement:{insertBefore(){}}};}
 const c=vm.createContext({activeMatchId:1,showToast(){},teams:[{id:3,name:'Unser FC',isOurTeam:true},{id:4,name:'Gegner'}],squad:[{id:1,name:'Spieler',goals:0}],isHomeTeam:true,homeScore:0,awayScore:0,events:[],
 document:{getElementById:id=>nodes[id]??=element()},elapsedSeconds:()=>0,updateScore(){},renderEvents(){},save(){},Date});
 c.document.getElementById('matchTitle').value=title;
 vm.runInContext(code,c);c.renderPickerPlayers=()=>pickerCount++;
 vm.runInContext('updateGoalButtons()',c);
 return {c,nodes,pickers:()=>pickerCount};
}
for(const [title,side] of [['Unser FC vs. Gegner','home'],['Gegner vs. Unser FC','away']]){
 test(`${side}: only our marked team gets the scorer picker`,()=>{
  const {c,pickers}=setup(title);
  vm.runInContext('handleTheirGoal()',c);assert.equal(pickers(),0);assert.equal(c.events[0].scorerId,null);
  vm.runInContext('handleOurGoal(); pickAndScore(squad[0])',c);
  assert.equal(pickers(),1);assert.equal(c.events[0].team,side);assert.equal(c.events[0].scorerId,1);assert.equal(c.squad[0].goals,1);
 });
}
test('stale home flag is corrected from the marked team in an away fixture',()=>{
 const {c,nodes}=setup('Gegner vs. Unser FC');assert.equal(c.isHomeTeam,false);assert.equal(nodes.btnGoalOurs.dataset.goalSide,'away');
});
for(const title of ['Gegner vs. Anderer Verein','Unser FC vs. Unser FC']){
 test(`${title}: unrelated or ambiguous fixture never exposes the squad`,()=>{
 const {c,pickers}=setup(title);vm.runInContext('handleOurGoal(); handleTheirGoal()',c);assert.equal(pickers(),0);assert.equal(c.events.every(e=>e.scorerId===null),true);
 });
}
test('defensive guard rejects own player for an opponent goal',()=>{
 const {c}=setup('Unser FC vs. Gegner');vm.runInContext("addGoal('away',false,squad[0])",c);assert.equal(c.events[0].scorerId,null);assert.equal(c.squad[0].goals,0);
});
test('own goal credits opponents without increasing player season goals',()=>{
 const {c}=setup('Gegner vs. Unser FC');vm.runInContext('handleOurGoal(); pickOwnGoal()',c);assert.equal(c.events[0].team,'home');assert.equal(c.events[0].isOwnGoal,true);assert.equal(c.squad[0].goals,0);
});
test('team names tolerate case and surrounding whitespace',()=>{
 const {c}=setup('  unser fc  vs. Gegner');assert.equal(vm.runInContext('getOurTeamSide()',c),'home');
});
