const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('src/scripts/matchday.js','utf8');
const start=source.indexOf('function localDateKey(');
const end=source.indexOf('function populate(',start);
const context=vm.createContext({Date,WEEKDAYS:['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag']});
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

test('poster date says Heute and Morgen when they apply, otherwise weekday and date',()=>{
  const now=new Date('2026-11-11T08:00:00');
  assert.equal(context.dateText({date:'2026-11-11'},now),'Heute');
  assert.equal(context.dateText({date:'2026-11-12'},now),'Morgen');
  assert.equal(context.dateText({date:'2026-11-14'},now),'Samstag, 14.11.');
  assert.equal(context.dateText({date:'2027-01-01'},new Date('2026-12-31T23:30:00')),'Morgen');
  assert.equal(context.dateText({},now),'');
});
