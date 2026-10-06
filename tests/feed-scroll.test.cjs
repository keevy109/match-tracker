const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('match-tracker.html','utf8');
const source=html.slice(html.indexOf('function updateFeedScrollState()'),html.indexOf('function updateTickerUI('));
test('header collapses for page or feed scrolling and expands again at the top',()=>{
 const feed={scrollTop:0},tab={scrollTop:0},root={scrollTop:0};let collapsed;
 const c=vm.createContext({window:{scrollY:0},document:{scrollingElement:root,querySelector:()=>feed,getElementById:()=>tab,body:{classList:{toggle:(name,value)=>{assert.equal(name,'feed-scrolled');collapsed=value;}}}}});
 vm.runInContext(source,c);
 c.updateFeedScrollState();assert.equal(collapsed,false);
 for(const target of [feed,tab,root]) {target.scrollTop=30;c.updateFeedScrollState();assert.equal(collapsed,true);target.scrollTop=0;}
 c.window.scrollY=20;c.updateFeedScrollState();assert.equal(collapsed,true);
 c.window.scrollY=0;c.updateFeedScrollState();assert.equal(collapsed,false);
});
