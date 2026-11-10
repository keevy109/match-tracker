import '../../public/player-stats.js';
import '../../public/schedule-data.js';
import '../../public/team-data.js';
const DATABASE = 'https://match-tracker-891ac-default-rtdb.europe-west1.firebasedatabase.app';

// Mehrere Bereiche der Seite lesen beim Start dieselben Pfade. Gleichzeitige und
// kurz aufeinanderfolgende Lesezugriffe teilen sich deshalb eine Anfrage.
const READ_CACHE_MS = 60000;
const reads = new Map();
async function fetchRemote(path, {timeoutMs = 20000, shallow = false} = {}) {
  const query = shallow ? '?shallow=true' : '';
  const res = await fetch(`${DATABASE}/${path}.json${query}`, {signal:AbortSignal.timeout(timeoutMs), cache:'no-store'});
  if (!res.ok) throw new Error(`Gemeinsame Daten nicht erreichbar (${path})`);
  return res.json();
}
function remote(path, options = {}) {
  const key = `${path}${options.shallow ? '?shallow' : ''}`;
  const cached = reads.get(key);
  if (cached && !options.fresh) return cached;
  const request = fetchRemote(path, options);
  reads.set(key, request);
  request.then(
    () => setTimeout(() => { if (reads.get(key) === request) reads.delete(key); }, READ_CACHE_MS),
    () => { if (reads.get(key) === request) reads.delete(key); },
  );
  return request;
}
function forgetReads() { reads.clear(); }

// matches/ enthält Fotos und Logos als Base64 (mehrere MB). Die Seite braucht pro
// Spiel nur Ergebnis und Status, daher werden genau diese Felder einzeln gelesen.
const SUMMARY_FIELDS = ['matchFinished', 'abandoned', 'homeScore', 'awayScore', 'isHomeTeam', 'updatedAt'];
async function loadMatchSummaries(schedule) {
  const index = await remote('matches', {shallow:true});
  const ids = Object.keys(globalThis.MatchTrackerSchedule.visibleMatches(index, schedule));
  const entries = await Promise.all(ids.map(async id => {
    const values = await Promise.all(SUMMARY_FIELDS.map(field => remote(`matches/${id}/${field}`)));
    const match = {};
    SUMMARY_FIELDS.forEach((field, i) => { if (values[i] !== null) match[field] = values[i]; });
    return [id, match];
  }));
  return Object.fromEntries(entries);
}

// Für Tore pro Spieler werden die Events gebraucht; sie werden ohne Fotos lokal
// gemerkt und nur neu geladen, wenn sich das Spiel seitdem geändert hat.
async function loadGoalEvents(id, updatedAt) {
  const key = `ssv_match_events_${id}`;
  if (updatedAt != null) {
    try {
      const cached = JSON.parse(localStorage.getItem(key) || 'null');
      if (cached && cached.updatedAt === updatedAt) return cached.events;
    } catch {}
  }
  const raw = await remote(`matches/${id}/events`, {timeoutMs:60000});
  const events = Object.values(raw || {}).filter(Boolean)
    .map(({id, typ, team, scorerId, isOwnGoal}) => ({id, typ, team, scorerId, isOwnGoal}));
  if (updatedAt != null) {
    try { localStorage.setItem(key, JSON.stringify({updatedAt, events})); } catch {}
  }
  return events;
}

async function loadKaderStats() {
  const [roster, schedule, participants, training] = await Promise.all([
    remote('app/squad'), remote('app/schedule'), remote('matchParticipants'), remote('trainingSessions'),
  ]);
  if (!roster) return null;
  const summaries = await loadMatchSummaries(schedule);
  const matches = Object.fromEntries(await Promise.all(Object.entries(summaries).map(async ([id, match]) => {
    const [events, participantIds] = await Promise.all([
      loadGoalEvents(id, match.updatedAt),
      participants?.[id] ? null : remote(`matches/${id}/participantIds`),
    ]);
    return [id, {...match, events, ...(participantIds ? {participantIds} : {})}];
  })));
  return globalThis.MatchTrackerStats.calculate(roster, matches, participants || {}, training || {});
}

export async function load(collection) {
  if (collection === 'kader') {
    try {
      const stats = await loadKaderStats();
      if (stats) return stats;
    } catch (error) { console.warn('Kader: gespeicherte lokale Version wird verwendet.', error); }
  }
  if (collection === 'trainer' || collection === 'news') {
    try {
      const shared = await remote(`app/${collection}`, {timeoutMs:30000});
      if (shared) {
        const items = Array.isArray(shared) ? shared : Object.values(shared);
        if (collection === 'trainer') {
          return items.map(item => item.id === 1783854243021 && item.detailPhoto === 'uploads/trainer/detail/1783854338780_ri2k28s98yq.png'
            ? {...item, detailPhoto: 'uploads/trainer/detail/geo-viggle-5a0ec2b1.mp4'}
            : item);
        }
        return items;
      }
    } catch (error) { console.warn(`${collection}: statische Version wird verwendet.`, error); }
  }
  const res = await fetch(`${import.meta.env.BASE_URL}data/${collection}.json`);
  if (!res.ok) return [];
  try { return await res.json(); } catch { return []; }
}
export async function save(collection, data) {
  forgetReads();
  if (collection === 'kader') {
    const res = await fetch(`${DATABASE}/app/squad.json`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data), signal:AbortSignal.timeout(10000)});
    if (!res.ok) throw new Error('Gemeinsamer Kader konnte nicht gespeichert werden.');
  }
  if (collection === 'trainer' || collection === 'news') {
    const res = await fetch(`${DATABASE}/app/${collection}.json`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data), signal:AbortSignal.timeout(10000)});
    if (!res.ok) throw new Error('Gemeinsame Inhalte konnten nicht gespeichert werden.');
    return;
  }
  if (!import.meta.env.DEV) return;
  const res = await fetch(`/api/${collection}`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
  if (!res.ok) throw new Error(await res.text().catch(() => 'Unbekannter Fehler'));
}

export async function loadMatchRecords() {
  return loadMatchSummaries(await remote('app/schedule'));
}

export async function loadLatestTicker() {
  const schedule = await remote('app/schedule');
  const latest = globalThis.MatchTrackerSchedule.latestTicker(schedule, await loadMatchSummaries(schedule));
  if (!latest) return null;
  // Teams (mit Logos) nur für den Anzeigenamen; ohne sie bleibt der Spielplan-Name.
  const teams = await remote('app/teams', {timeoutMs:30000}).catch(() => null);
  const club = globalThis.MatchTrackerTeams.find(teams, latest.opponent);
  return club ? {...latest, opponent:club.name} : latest;
}

export async function loadTrackedSchedule() {
  const schedule = await remote('app/schedule');
  const [matches, teams] = await Promise.all([
    loadMatchSummaries(schedule),
    remote('app/teams', {timeoutMs:30000}).catch(() => null),
  ]);
  return globalThis.MatchTrackerSchedule.normalize(
    schedule,
    matches,
    new Date().toISOString().slice(0, 10),
  ).map(item => {
    const club = globalThis.MatchTrackerTeams.find(teams, item.opponent);
    return club ? {...item, opponent:club.name, opponentId:club.id} : item;
  });
}

export async function saveTrackedSchedule(items) {
  forgetReads();
  const schedule = await remote('app/schedule', {fresh:true});
  const scheduleUpdates = globalThis.MatchTrackerSchedule.mergeAdminSchedule(schedule, items);
  const updates = {};

  Object.entries(scheduleUpdates).forEach(([id, fixture]) => {
    updates[`app/schedule/${id}`] = fixture;
  });

  const res = await fetch(`${DATABASE}/.json`, {
    method:'PATCH',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(updates),
    signal:AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error('Gemeinsamer Spielplan konnte nicht gespeichert werden.');
}

export async function loadTrackedTeams() {
  return globalThis.MatchTrackerTeams.normalize(await remote('app/teams', {timeoutMs:30000}));
}

export async function saveTrackedTeams(clubs) {
  forgetReads();
  const teams = globalThis.MatchTrackerTeams.merge(await remote('app/teams', {fresh:true, timeoutMs:30000}), clubs);
  const res = await fetch(`${DATABASE}/app/teams.json`, {
    method:'PUT',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(teams),
    signal:AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error('Gemeinsame Teams konnten nicht gespeichert werden.');
}

export async function loadTrainingSessions() {
  return (await remote('trainingSessions')) || {};
}

export async function saveTrainingSession(id, session) {
  forgetReads();
  const res = await fetch(`${DATABASE}/trainingSessions/${encodeURIComponent(id)}.json`, {
    method:'PUT',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(session),
    signal:AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error('Training konnte nicht gespeichert werden.');
}

export async function deleteTrainingSession(id) {
  forgetReads();
  const res = await fetch(`${DATABASE}/trainingSessions/${encodeURIComponent(id)}.json`, {
    method:'DELETE',
    signal:AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error('Training konnte nicht gelöscht werden.');
}
