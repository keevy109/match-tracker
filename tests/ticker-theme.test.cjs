const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/ticker-theme.js','utf8');
test('theme toggle reflects saved dark mode and persists both directions',()=>{
 let click;const attrs={},saved={};const root={dataset:{theme:'dark'}};
 const button={setAttribute:(key,value)=>attrs[key]=value,addEventListener:(name,fn)=>click=fn};
 vm.runInNewContext(source,{document:{documentElement:root,getElementById:()=>button},localStorage:{setItem:(key,value)=>saved[key]=value}});
 assert.equal(attrs['aria-pressed'],'true');assert.equal(attrs['aria-label'],'Lightmode aktivieren');
 click();assert.equal(root.dataset.theme,'light');assert.equal(saved.matchtracker_theme,'light');
 click();assert.equal(root.dataset.theme,'dark');assert.equal(saved.matchtracker_theme,'dark');
});
test('theme still switches when browser storage is unavailable',()=>{
 let click;const root={dataset:{theme:'light'}};
 vm.runInNewContext(source,{document:{documentElement:root,getElementById:()=>({setAttribute(){},addEventListener:(name,fn)=>click=fn})},localStorage:{setItem(){throw Error('blocked');}}});
 click();assert.equal(root.dataset.theme,'dark');
});
