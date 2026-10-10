const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = vm.createContext({});
vm.runInContext(fs.readFileSync('public/team-data.js', 'utf8'), context);
const {normalize, merge, canonicalName, find} = context.MatchTrackerTeams;

test('ticker teams are normalized for the admin and own team is hidden', () => {
  const teams = [
    {id: 1, name: 'SSV Berghausen', isOurTeam: true, logo: 'ssv.png'},
    {id: 2, name: 'TG Burg', logo: 'burg.png', color: 'rgb(0, 20, 40)'},
  ];
  const clubs = normalize(teams);
  assert.equal(clubs.length, 1);
  assert.equal(clubs[0].badge, 'burg.png');
  assert.equal(clubs[0].color1, '#001428');
});

test('admin team changes retain the protected own team and ticker fields', () => {
  const current = [
    {id: 1, name: 'SSV Berghausen', isOurTeam: true, logo: 'ssv.png'},
    {id: 2, name: 'TG Burg', isOurTeam: false, logo: 'old.png', color: '#000000'},
  ];
  const teams = merge(current, [
    {id: 2, name: 'TG Burg', short: 'TGB', badge: 'new.png', color1: '#112233', color2: '#ffffff'},
  ]);
  assert.equal(teams.length, 2);
  assert.equal(teams[0].isOurTeam, true);
  assert.equal(teams[1].logo, 'new.png');
  assert.equal(teams[1].badge, 'new.png');
  assert.equal(teams[1].color, '#112233');
});

test('club lookup tolerates official squad suffixes', () => {
  const teams = [
    {name:'1. Spvg. Solingen-Wald 03', logo:'wald.png'},
    {name:'TuSpo Richrath', logo:'richrath.png'},
    {name:'FC Monheim', logo:'monheim.png'},
  ];
  assert.equal(find(teams, '1. Spvg. Solingen-Wald 03 III').logo, 'wald.png');
  assert.equal(find(teams, 'TuSpo Richrath U11-2016').logo, 'richrath.png');
  assert.equal(find(teams, '1.FC Monheim E1 2016 U11').logo, 'monheim.png');
  assert.equal(canonicalName('DV Solingen E2'), 'dv solingen');
});

test('club lookup does not confuse unrelated similarly named clubs', () => {
  const teams = [{name:'FC Monheim', logo:'monheim.png'}];
  assert.equal(find(teams, 'Inter Monheim E1'), undefined);
});

test('header colors accept RGB and clamp legacy out-of-range channels', () => {
  const {color} = context.MatchTrackerTeams;
  assert.equal(color('rgb(256,128,0)'), '#ff8000');
  assert.equal(color('rgb(0, 20, 40)'), '#001428');
  assert.equal(color('#123456'), '#123456');
  assert.equal(color(undefined), '#333333');
});

test('live match presentation resolves Inter squad suffix without changing game state', () => {
  const events = [{type:'goal', minute:5}];
  const data = {homeTeam:'SSV Berghausen',awayTeam:'Inter Monheim E1',awayLogo:'',awayColor:'',homeScore:2,awayScore:1,timerBase:123,events};
  const result = context.MatchTrackerTeams.resolveMatch(data, [{name:'Inter Monheim',badge:'inter.png',color1:'#ff0000'}]);
  assert.equal(result.awayTeam, 'Inter Monheim');
  assert.equal(result.awayLogo, 'inter.png');
  assert.equal(result.awayColor, '#ff0000');
  assert.equal(result.events, events);
  assert.equal(result.timerBase, 123);
  assert.equal(result.homeScore, 2);
  assert.equal(result.awayScore, 1);
  assert.equal(data.awayTeam, 'Inter Monheim E1');
});

test('reporter refresh repairs restored title and buttons without saving or resetting match', () => {
  const html = fs.readFileSync('match-tracker.html', 'utf8');
  const title = {value:'SSV Berghausen vs. Inter Monheim E1'};
  const calls = [];
  const ctx = vm.createContext({document:{getElementById:()=>title}, DEV_MODE:false,
    getMatchTeams:()=>({home:'SSV Berghausen',away:'Inter Monheim'}),
    updateScoreLabels:()=>calls.push('logos'), updateGoalButtons:()=>calls.push('buttons'),
    matchSnapshot:()=>({homeScore:3,awayScore:1,timerBase:123}),
    updateTickerUI:(data)=>{assert.equal(data.homeScore,3);assert.equal(data.timerBase,123);calls.push('header');}});
  vm.runInContext(html.slice(html.indexOf('function refreshReporterBranding()'),html.indexOf('function updateScoreLabels()')),ctx);
  ctx.refreshReporterBranding();
  assert.equal(title.value,'SSV Berghausen vs. Inter Monheim');
  assert.deepEqual(calls,['logos','buttons','header']);
});
