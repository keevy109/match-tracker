const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const texts=require('../public/match-texts.js');
test('settings persist independently of matches, with isolated dev storage and copied snapshots',()=>{
 const store=new Map();const context={DEV_MODE:true,MatchTexts:texts,localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)}};
 vm.createContext(context);vm.runInContext(fs.readFileSync('public/match-text-editor.js','utf8'),context);
 const first=context.loadAutomationSettings();first.locale='en';store.set('matchtracker_dev_automation_v1',JSON.stringify(first));
 const snapshot=context.loadAutomationSettings();assert.equal(snapshot.locale,'en');first.locale='de';store.set('matchtracker_dev_automation_v1',JSON.stringify(first));assert.equal(snapshot.locale,'en');assert.equal(context.loadAutomationSettings().locale,'de');context.DEV_MODE=false;assert.equal(context.loadAutomationSettings().locale,'de');assert.equal(store.has('matchtracker_automation_v1'),false);
});
