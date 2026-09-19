const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const html=fs.readFileSync(path.join(__dirname,'../match-tracker.html'),'utf8');
const code=html.slice(html.indexOf('function editPlayer('),html.indexOf('// ─── EDIT: SPIELPLAN-EINTRAG'));

test('season goals can be edited in the roster and persist as an adjustment',()=>{
 let saveEdit;
 const fields={
  'es-pname':{value:'Max'},
  'es-pnum':{value:'15'},
  'es-pgoals':{value:'5'},
  'es-pphoto':{files:[]},
  editSheet:{classList:{remove(){}}}
 };
 const c=vm.createContext({
  squad:[{id:1,name:'Max',num:15,goals:3,goalAdjustment:1}],
  esc:value=>value,
  openEditSheet:(title,body,onSave)=>{assert.match(body,/id="es-pgoals" type="number"/);assert.doesNotMatch(body,/es-pgoals" readonly/);saveEdit=onSave;},
  document:{getElementById:id=>fields[id]},
  renderKaderList(){},save(){},resizeLogo(){},removePlayer(){}
 });
 vm.runInContext(code,c);
 c.editPlayer(1);
 saveEdit();
 assert.equal(c.squad[0].goals,5);
 assert.equal(c.squad[0].goalAdjustment,3);
});
