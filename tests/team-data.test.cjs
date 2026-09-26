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
