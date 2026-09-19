const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'../src/scripts/admin.js'),'utf8');

test('admin roster season goals field is editable',()=>{
 assert.match(source,/id="fPlayerGoals" type="number"/);
 assert.doesNotMatch(source,/id="fPlayerGoals" readonly/);
});
