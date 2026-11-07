const {test}=require('node:test');const assert=require('node:assert/strict');
function setup(answer,stored){
  const store={};if(stored)store.mt_auth=stored;
  const prompts=[];
  const root={sessionStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},prompt:q=>{prompts.push(q);return answer;},document:{body:{innerHTML:''}}};
  const fs=require('node:fs');const vm=require('node:vm');
  vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../public/access-guard.js'),'utf8'),vm.createContext(Object.assign(root,{globalThis:root})));
  return {access:root.MatchTrackerAccess,store,prompts,body:root.document.body};
}
test('correct PIN unlocks and is remembered for the session',()=>{const {access,store,prompts}=setup('1909');assert.equal(access.check(),true);assert.equal(store.mt_auth,'1');assert.equal(prompts.length,1);assert.equal(access.check(),true);assert.equal(prompts.length,1);});
test('wrong or cancelled PIN keeps the page locked and deny() blanks it',()=>{for(const answer of ['0000',null,'']){const {access,store,body}=setup(answer);assert.equal(access.check(),false);assert.equal(store.mt_auth,undefined);access.deny();assert.match(body.innerHTML,/Zugang verweigert/);}});
test('an unlocked session never prompts again',()=>{const {access,prompts}=setup('0000','1');assert.equal(access.check(),true);assert.equal(prompts.length,0);});
