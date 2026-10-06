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
 const card={dataset:{},querySelector:selector=>selector==='.lineup-track'?track:viewport};
 render(card,[{id:1,name:'Mika'}],[1]);
 listeners.pointerdown();assert.equal(intro,false);assert.equal(viewport.scrollLeft,120);
 intro=true;listeners.animationend();assert.equal(intro,false);assert.equal(viewport.scrollLeft,0);
});
