const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('match-tracker.html','utf8');
const source=html.slice(html.indexOf('function updateFeedScrollState()'),html.indexOf('function updateTickerUI('));
test('header collapses for page or feed scrolling and expands again at the top',()=>{
 const feed={scrollTop:0},tab={scrollTop:0},root={scrollTop:0};let collapsed; const styles={};
 const c=vm.createContext({window:{scrollY:0,innerWidth:390},document:{scrollingElement:root,querySelector:selector=>selector==='.feed-result-space'?{getBoundingClientRect:()=>({top:0})}:feed,getElementById:()=>tab,body:{style:{setProperty:(key,value)=>styles[key]=value},classList:{toggle:(name,value)=>{assert.equal(name,'feed-scrolled');collapsed=value;}}}}});
 vm.runInContext(source,c);
 c.updateFeedScrollState();assert.equal(collapsed,false);
 for(const target of [feed,tab,root]) {target.scrollTop=30;c.updateFeedScrollState();assert.equal(collapsed,true);target.scrollTop=0;}
 c.window.scrollY=20;c.updateFeedScrollState();assert.equal(collapsed,true);
 c.window.scrollY=50;c.updateFeedScrollState();assert.equal(styles['--feed-height'],'135px');assert.equal(styles['--feed-logo-height'],'70.5px');
 c.window.scrollY=150;c.updateFeedScrollState();assert.equal(styles['--feed-height'],'70px');
 c.window.scrollY=0;c.updateFeedScrollState();assert.equal(collapsed,false);assert.equal(styles['--feed-height'],'200px');
});
