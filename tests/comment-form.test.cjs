const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const html=fs.readFileSync(process.env.TRACKER_HTML || path.join(__dirname,'../match-tracker.html'),'utf8');
const source=html.slice(html.indexOf('let _eventModalType ='),html.indexOf('// ─── FIREBASE CONFIG'));
function setup(){
 const fields={'em-player':{value:''},'em-player-field':{hidden:true},'em-text':{value:'Großchance!',focus(){}},'em-team':{value:'away',focus(){}},'em-photo':{files:[]},'em-status':{textContent:''}};
 const c=vm.createContext({activeMatchId:1,getOurTeamSide:()=> 'away',showToast(){},previewDevTickerOverlay(){},URLSearchParams,window:{location:{search:''}},Date,events:[],squad:[],elapsedSeconds:()=>60,renderEvents(){},save(){},document:{getElementById:id=>fields[id]??={classList:{remove(){}}}}});
 vm.runInContext(source,c);vm.runInContext("_eventModalType='kommentar'",c);return {c,fields};
}
test('text can be saved without a team',async()=>{
 const {c,fields}=setup();fields['em-team'].value='';await c.saveEventModal();
 assert.equal(c.events.length,1);assert.equal(c.events[0].team,'');assert.equal(c.events[0].text,'Großchance!');
});
test('text retains an explicitly selected team',async()=>{
 const {c}=setup();await c.saveEventModal();assert.equal(c.events[0].team,'away');
});
test('twenty editable templates select player placeholders and prevent accidental publication',async()=>{
 const {c,fields}=setup();assert.equal(vm.runInContext('COMMENT_TEMPLATES.length',c),20);
 let selection;fields['em-text'].setSelectionRange=(start,end)=>selection=[start,end];
 c.applyCommentTemplate('0');assert.match(fields['em-text'].value,/Großchance/);
 assert.equal(fields['em-text'].value.slice(...selection),'[Spieler]');
 await c.saveEventModal();assert.equal(c.events.length,0);
 fields['em-text'].value=fields['em-text'].value.replace('[Spieler]','Mika');
 await c.saveEventModal();assert.equal(c.events.length,1);
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

test('substitutions retain our team side and selected player photos',async()=>{
 const {c,fields}=setup();c.getOurTeamSide=()=> 'away';c.showToast=()=>{};c.squad=[{id:1,name:'Rein',photo:'one.png'},{id:2,name:'Raus',photo:'two.png'}];
 fields['em-rein']={value:'1'};fields['em-raus']={value:'2'};vm.runInContext("_eventModalType='wechsel'",c);
 await c.saveEventModal();assert.equal(c.events[0].team,'away');assert.equal(c.events[0].reinPhoto,'one.png');assert.equal(c.events[0].rausPhoto,'two.png');
});
test('substitutions reject unrelated matches, missing players and identical players',async()=>{
 for(const [side,rein,raus] of [[null,'1','2'],['home','1','1'],['away','99','2']]){
 const {c,fields}=setup();c.getOurTeamSide=()=>side;c.showToast=()=>{};c.squad=[{id:1,name:'A'},{id:2,name:'B'}];fields['em-rein']={value:rein};fields['em-raus']={value:raus};vm.runInContext("_eventModalType='wechsel'",c);await c.saveEventModal();assert.equal(c.events.length,0);
 }
});

test('roster dropdown fills and changes the template player while retaining text edits',()=>{
 const {c,fields}=setup();c.squad=[{id:1,name:'Mika'},{id:2,name:'Linus'}];
 fields['em-text'].setSelectionRange=()=>{};
 c.applyCommentTemplate('0');assert.equal(fields['em-player-field'].hidden,false);
 fields['em-player'].value='1';c.applyCommentPlayer();assert.equal(fields['em-text'].value,'Großchance! Mika verfehlt das Tor nur knapp.');
 fields['em-text'].value+=' Weiter so!';
 fields['em-player'].value='2';c.applyCommentPlayer();assert.equal(fields['em-text'].value,'Großchance! Linus verfehlt das Tor nur knapp. Weiter so!');
 c.applyCommentTemplate('1');assert.equal(fields['em-text'].value,'Starke Parade von Linus!');
 c.applyCommentTemplate('6');assert.equal(fields['em-player-field'].hidden,false);assert.equal(fields['em-text'].value,'Ecke! Jetzt wird es gefährlich.');
});

test('selected comment player is saved with portrait snapshots without requiring a team',async()=>{
 const {c,fields}=setup();c.squad=[{id:7,name:'Mika',photo:'front.png',sidePhoto:'side.png'}];
 fields['em-player'].value='7';fields['em-team'].value='';await c.saveEventModal();
 assert.equal(c.events[0].playerId,7);assert.equal(c.events[0].playerName,'Mika');
 assert.equal(c.events[0].playerPhoto,'front.png');assert.equal(c.events[0].playerSidePhoto,'side.png');assert.equal(c.events[0].team,'');
});

test('template groups include every template exactly once',()=>{
 const {c}=setup();c.esc=text=>text;
 const options=c.buildCommentTemplateOptions();
 for(const label of ['Offensiv','Defensiv','Torwart','Allgemein']) assert.ok(options.includes(`label="${label}"`));
 const indices=[...options.matchAll(/value="(\d+)"/g)].map(match=>Number(match[1]));
 assert.equal(indices.length,20);assert.equal(new Set(indices).size,20);
 assert.deepEqual(indices.sort((a,b)=>a-b),Array.from({length:20},(_,i)=>i));
});

test('opponent comments clear and disable roster selection and never store player data',async()=>{
 const {c,fields}=setup();c.squad=[{id:1,name:'Mika',photo:'front.png'}];
 fields['em-player'].value='1';fields['em-text'].setSelectionRange=()=>{};
 c.applyCommentTemplate('1');assert.equal(fields['em-text'].value,'Starke Parade von Mika!');
 fields['em-team'].value='home';c.updateCommentTeam();
 assert.equal(fields['em-player'].value,'');assert.equal(fields['em-player'].disabled,true);
 assert.equal(fields['em-player-field'].hidden,true);
 assert.equal(fields['em-text'].value,'Starke Parade von einem Gegenspieler!');
 c.applyCommentTemplate('2');assert.equal(fields['em-text'].value,'Ein Gegenspieler trifft den Pfosten! Das war knapp.');
 fields['em-player'].value='1';await c.saveEventModal();assert.equal(c.events[0].playerId,undefined);
 fields['em-team'].value='';c.updateCommentTeam();assert.equal(fields['em-player'].disabled,false);assert.equal(fields['em-player-field'].hidden,false);
});
