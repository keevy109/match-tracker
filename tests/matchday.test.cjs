const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('src/scripts/matchday.js','utf8');
const start=source.indexOf('function localDateKey(');
const end=source.indexOf('function populateBanner(',start);
const context=vm.createContext({Date});
vm.runInContext(source.slice(start,end),context);

test('Saturday fixture appears from Monday of its match week',()=>{
  assert.equal(context.isInMatchWeek('2026-09-26','2026-09-20'),false);
  assert.equal(context.isInMatchWeek('2026-09-26','2026-09-21'),true);
  assert.equal(context.isInMatchWeek('2026-09-26','2026-09-26'),true);
  assert.equal(context.isInMatchWeek('2026-09-26','2026-09-27'),false);
});

test('match week also starts Monday for weekday fixtures',()=>{
  assert.equal(context.isInMatchWeek('2026-09-23','2026-09-21'),true);
  assert.equal(context.isInMatchWeek('2026-09-23','2026-09-24'),false);
  assert.equal(context.isInMatchWeek('', '2026-09-21'),false);
});
