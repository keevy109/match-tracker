const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const html=fs.readFileSync(process.env.TRACKER_HTML || path.join(__dirname,'../match-tracker.html'),'utf8');
const source=html.slice(html.indexOf('let _eventModalType ='),html.indexOf('// ─── FIREBASE CONFIG'));
function setup(){
 const fields={'em-text':{value:'Großchance!',focus(){}},'em-team':{value:'away',focus(){}},'em-photo':{files:[]},'em-status':{textContent:''}};
 const c=vm.createContext({URLSearchParams,window:{location:{search:''}},Date,events:[],squad:[],elapsedSeconds:()=>60,renderEvents(){},save(){},document:{getElementById:id=>fields[id]??={classList:{remove(){}}}}});
 vm.runInContext(source,c);vm.runInContext("_eventModalType='kommentar'",c);return {c,fields};
}
test('text requires an explicit team and is saved with it',async()=>{
 const {c,fields}=setup();fields['em-team'].value='';await c.saveEventModal();assert.equal(c.events.length,0);
 fields['em-team'].value='away';await c.saveEventModal();assert.equal(c.events[0].team,'away');assert.equal(c.events[0].text,'Großchance!');assert.equal(c.events[0].photo,'');
});
test('optional photo is prepared and stored with the comment',async()=>{
 const {c,fields}=setup();fields['em-photo'].files=[{}];c.prepareCommentPhoto=async()=> 'data:image/webp;base64,aGVsbG8=';
 await c.saveEventModal();assert.equal(c.events[0].photo,'data:image/webp;base64,aGVsbG8=');
});
test('canceling during image preparation does not publish the comment',async()=>{
 const {c,fields}=setup();let finish;fields['em-photo'].files=[{}];c.prepareCommentPhoto=()=>new Promise(resolve=>finish=resolve);
 const pending=c.saveEventModal();c.closeEventModal();finish('data:image/png;base64,aGVsbG8=');await pending;assert.equal(c.events.length,0);
});
test('image errors leave the form open without storing partial content',async()=>{
 const {c,fields}=setup();fields['em-photo'].files=[{}];c.prepareCommentPhoto=async()=>{throw new Error('Bildfehler');};
 await c.saveEventModal();assert.equal(c.events.length,0);assert.equal(fields['em-status'].textContent,'Bildfehler');
});
test('invalid image formats and excessive file sizes are rejected before reading',async()=>{
 const {c}=setup();await assert.rejects(c.prepareCommentPhoto({type:'text/html',size:1}),/JPEG/);await assert.rejects(c.prepareCommentPhoto({type:'image/png',size:11000000}),/10 MB/);
});
