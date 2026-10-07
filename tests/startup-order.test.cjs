const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('match-tracker.html','utf8');
test('saved dev events render only after animation state and Firebase config are initialized',()=>{
 const init=html.indexOf('(function init() {');
 for(const declaration of ['const pendingFeedGoals =','const pendingFeedSubs =','const FIREBASE_CONFIG =']) {
   assert.ok(html.indexOf(declaration)<init,`${declaration} must precede restore`);
 }
 const declarations=html.match(/const pendingFeed(?:Goals|Subs) = new Set\(\);/g).join('\n');
 const render=html.slice(html.indexOf('function clearFeedEvents('),html.indexOf('// ─── EXPORT'));
 const list={querySelector:()=>null,innerHTML:'',items:[],appendChild(item){this.items.push(item);}};
 const c=vm.createContext({DEV_MODE:true,schedule:[],activeMatchId:1,events:[{id:42,typ:'tor',team:'home'}],squad:[],homeLogo:'',awayLogo:'',timerStarted:false,timerBase:null,timerOffset:0,
  eventCssClass:()=> 'home',getOurTeamSide:()=> 'home',buildEventItemHtml:()=> 'saved goal',
  document:{getElementById:id=>id==='eventsList'?list:{value:'Heim vs Gast'},createElement:()=>({dataset:{},classList:{add(){}}})}});
 const matchState=html.slice(html.indexOf('function hasMatchStarted('),html.indexOf('function eventIcon('));
 vm.runInContext(declarations+'\n'+matchState+'\n'+render+'\nrenderEvents();',c);
 assert.equal(list.items.length,1);assert.equal(list.items[0].dataset.eventId,'42');
});
