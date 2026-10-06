const {test}=require('node:test');const assert=require('node:assert/strict');
require('../public/lineup-card.js');
const {selectedPlayers,render}=globalThis.MatchTrackerLineup;
test('lineup contains selected players once, ordered by normalized position',()=>{
 const players=[{id:1,name:'Sturm',position:'ST'},{id:2,name:'Abwehr',position:'AB'},{id:3,name:'Tor',position:'TW'},{id:4,name:'Mitte',position:'MF'},{id:5,name:'Offen'},{id:6,name:'Nicht dabei',position:'TW'}];
 assert.deepEqual(selectedPlayers(players,['1',2,3,4,5,2]).map(p=>p.id),[3,2,4,1,5]);
});
test('lineup preserves animation on unchanged updates and clears removed selections',()=>{
 const node={addEventListener(){}};
 const card={dataset:{},hidden:true,innerHTML:'',querySelector:()=>node};let writes=0;
 Object.defineProperty(card,'innerHTML',{get(){return this.html;},set(value){writes++;this.html=value;}});
 const players=[{id:1,name:'<Mika>',photo:'front.png',position:'ST'}];
 render(card,players,[1]);assert.equal(card.hidden,false);assert.match(card.html,/&lt;Mika&gt;/);assert.match(card.html,/front.png/);
 const before=writes;render(card,players,[1]);assert.equal(writes,before);
 render(card,players,[]);assert.equal(card.hidden,true);assert.equal(card.html,'');
});

test('intro runs once then enables scrolling, and touch can interrupt it',()=>{
 const listeners={};let intro=true;
 const viewport={scrollLeft:0,getBoundingClientRect:()=>({left:0}),addEventListener:(name,fn)=>listeners[name]=fn};
 const track={getBoundingClientRect:()=>({left:-120}),classList:{contains:()=>intro,remove:()=>intro=false},addEventListener:(name,fn)=>listeners[name]=fn};
 const navigation={hidden:true};const buttons={};
 const card={dataset:{},querySelector:selector=>selector==='.lineup-track'?track:selector==='.lineup-viewport'?viewport:selector==='.lineup-navigation'?navigation:{addEventListener:(name,fn)=>buttons[selector]=fn}};
 render(card,[{id:1,name:'Mika'}],[1]);
 assert.equal(navigation.hidden,true);assert.doesNotMatch(card.innerHTML,/<small>/);
 listeners.pointerdown();assert.equal(navigation.hidden,false);assert.equal(intro,false);assert.equal(viewport.scrollLeft,120);
 intro=true;listeners.animationend();assert.equal(intro,false);assert.equal(viewport.scrollLeft,0);
 let move;viewport.clientWidth=400;viewport.scrollBy=value=>move=value.left;
 buttons['.lineup-next']();assert.equal(move,320);buttons['.lineup-prev']();assert.equal(move,-320);
});

test('published lineup is placed chronologically among events, never before selection',()=>{
 const {mount}=globalThis.MatchTrackerLineup;
 const list={children:[],querySelector:()=>null,insertBefore(card,before){this.children=this.children.filter(item=>item!==card);const at=before?this.children.indexOf(before):this.children.length;this.children.splice(at,0,card);}};
 globalThis.document={createElement:()=>({dataset:{},setAttribute(){},querySelector:()=>({addEventListener(){}}),remove(){list.children=list.children.filter(item=>item!==this);}})};
 const players=[{id:1,name:'Mika'}];
 list.children=[{dataset:{eventId:'300'}},{dataset:{eventId:'100'}}];
 mount(list,players,[],200,1);assert.equal(list.children.length,2);
 mount(list,players,[1],null,1);assert.equal(list.children.length,2);
 mount(list,players,[1],200,1);assert.deepEqual(list.children.map(x=>x.dataset.eventId),['300','200','100']);
 list.children.unshift({dataset:{eventId:'400'}});
 mount(list,players,[1],200,1);assert.deepEqual(list.children.map(x=>x.dataset.eventId),['400','300','200','100']);
 mount(list,players,[],200,1);assert.equal(list.children.length,3);
 delete globalThis.document;
});

test('selected coaches follow all players including players without a position',()=>{
 const members=[{id:'coach:1',name:'Alex',isCoach:true,position:'TW'},{id:1,name:'Spieler'},{id:2,name:'Torwart',position:'TW'},{id:'coach:2',name:'Nicht ausgewählt',isCoach:true}];
 assert.deepEqual(selectedPlayers(members,['coach:1',1,2]).map(p=>p.id),[2,1,'coach:1']);
});
