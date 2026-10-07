const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const html=fs.readFileSync(process.env.TRACKER_HTML || path.join(__dirname,'../match-tracker.html'),'utf8');
const c=vm.createContext({esc:s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'),isCommentPhoto:()=>false});
vm.runInContext(html.slice(html.indexOf('function eventCssClass('),html.indexOf('function renderEvents()')),c);
const context={ownSide:'away',squad:{a:{id:1,name:'Anna',photo:'anna.png'},b:{id:2,name:'Ben',photo:'ben.png'}}};
test('current roster portrait overrides a stored event snapshot',()=>{for(const trainer of [true,false]){const result=c.buildEventItemHtml({id:1,team:'away',scorer:'Anna',scorerId:1,scorerPhoto:'snapshot.png'},'Gast','Wir',trainer,context);assert.match(result,/src="anna.png"/);assert.doesNotMatch(result,/snapshot\.png/);}});
test('stored event portrait remains a fallback when the player is absent',()=>{const result=c.buildEventItemHtml({id:1,team:'away',scorer:'Clara',scorerId:3,scorerPhoto:'snapshot.png'},'Gast','Wir',false,context);assert.match(result,/src="snapshot.png"/);});
test('older events use photos from the roster',()=>{assert.match(c.buildEventItemHtml({id:1,team:'away',scorer:'Anna',scorerId:1},'Gast','Wir',false,context),/src="anna.png"/);});
test('opponent goals never receive our roster photos',()=>{assert.doesNotMatch(c.buildEventItemHtml({id:1,team:'home',scorerId:1,scorerPhoto:'wrong.png'},'Gast','Wir',false,context),/event-player-photo/);});
test('substitutions show outgoing red and incoming green portraits',()=>{const result=c.buildEventItemHtml({id:1,typ:'wechsel',rausId:2,rausName:'Ben',reinId:1,reinName:'Anna'},'Gast','Wir',false,context);assert.match(result,/event-player-out/);assert.match(result,/src="ben.png"/);assert.match(result,/event-player-in/);assert.match(result,/src="anna.png"/);});
test('missing photos use a placeholder and image attributes are escaped',()=>{assert.match(c.buildEventItemHtml({id:1,team:'away',scorer:'Unbekannt'},'Gast','Wir',false,context),/event-player-placeholder/);assert.match(c.eventPlayerPortrait({scorerPhoto:'a"b.png',scorer:'A'},'scorer',[]),/a&quot;b.png/);});
test('goal score fades the value that already existed before the goal',()=>{const away=c.buildEventItemHtml({id:20,team:'away',snapshot:'2:3'},'Gast','Wir',false,context);assert.match(away,/event-score-value event-score-previous">2<\/span><span class="event-score-separator">:<\/span><span class="event-score-value">3/);const home=c.buildEventItemHtml({id:21,team:'home',snapshot:'3:3'},'Gast','Wir',false,context);assert.match(home,/event-score-value">3<\/span><span class="event-score-separator">:<\/span><span class="event-score-value event-score-previous">3/);});
test('own scorer shows the stored season-goal ordinal below the name',()=>{const result=c.buildEventItemHtml({id:22,team:'away',scorer:'Anna',scorerId:1,seasonGoals:3,snapshot:'0:1'},'Gast','Wir',false,context);assert.match(result,/event-scorer-name">Anna/);assert.match(result,/event-season-goals">3\. Saisontor/);});

test('photo-only comments render only the image and optional trainer delete control',()=>{
 c.isCommentPhoto=value=>value==='data:image/webp;base64,aGVsbG8=';
 const event={id:30,typ:'kommentar',text:'  ',photo:'data:image/webp;base64,aGVsbG8=',team:'away',playerId:1};
 assert.match(c.eventCssClass(event),/image-only/);assert.doesNotMatch(c.eventCssClass(event),/has-comment-player/);
 const spectator=c.buildEventItemHtml(event,'Gast','Wir',false,context);
 assert.match(spectator,/^<img class="event-comment-photo"/);assert.doesNotMatch(spectator,/event-min|event-info|event-scorer|event-tag|event-delete/);
 assert.match(c.buildEventItemHtml(event,'Gast','Wir',true,context),/event-delete/);
 for(const minute of [null,1,45,90]) {
  for(const trainer of [true,false]) assert.doesNotMatch(c.buildEventItemHtml({...event,minute},'Gast','Wir',trainer,context),/event-min|event-minute/);
 }
 assert.doesNotMatch(c.eventCssClass({...event,text:'Text'}),/image-only/);
 assert.doesNotMatch(c.eventCssClass({...event,photo:'invalid'}),/image-only/);
 c.isCommentPhoto=()=>false;
});

test('cards omit an unset minute while keeping the minute of started events',()=>{
 for(const typ of ['tor','kommentar','wechsel']) {
  const event={id:40,typ,text:'Vor dem Spiel',minute:null};
  assert.doesNotMatch(c.buildEventItemHtml(event,'Heim','Gast',false),/event-minute|0'|null'/);
  assert.match(c.buildEventItemHtml({...event,minute:1},'Heim','Gast',false),/event-minute">1'/);
 }
});
