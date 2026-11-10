import '../../public/player-stats.js';
import '../../public/schedule-data.js';
import '../../public/team-data.js';
import '../../public/news-images.js';
const LIVE_DATABASE = 'https://match-tracker-891ac-default-rtdb.europe-west1.firebasedatabase.app';
// Nur in `npm run dev`: localStorage ssv_database_url (z. B. Emulator
// "http://127.0.0.1:9000?ns=match-tracker-891ac-default-rtdb") ersetzt die Live-Datenbank.
const DATABASE = (import.meta.env.DEV && globalThis.localStorage?.getItem('ssv_database_url')) || LIVE_DATABASE;
function dbUrl(path, query = '') {
  const url = new URL(DATABASE);
  url.pathname = `${url.pathname.replace(/\/$/, '')}/${path}.json`;
  new URLSearchParams(query).forEach((value, key) => url.searchParams.set(key, value));
  return url.href;
}

// Mehrere Bereiche der Seite lesen beim Start dieselben Pfade. Gleichzeitige und
// kurz aufeinanderfolgende Lesezugriffe teilen sich deshalb eine Anfrage.
const READ_CACHE_MS = 60000;
const reads = new Map();
async function fetchRemote(path, {timeoutMs = 20000, shallow = false} = {}) {
  const query = shallow ? '?shallow=true' : '';
  const res = await fetch(dbUrl(path, query), {signal:AbortSignal.timeout(timeoutMs), cache:'no-store'});
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
    const res = await fetch(dbUrl(`app/squad`), {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data), signal:AbortSignal.timeout(10000)});
    if (!res.ok) throw new Error('Gemeinsamer Kader konnte nicht gespeichert werden.');
  }
  if (collection === 'news') return saveNews(data);
  if (collection === 'trainer') {
    const res = await fetch(dbUrl(`app/${collection}`), {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data), signal:AbortSignal.timeout(10000)});
    if (!res.ok) throw new Error('Gemeinsame Inhalte konnten nicht gespeichert werden.');
    return;
  }
  if (!import.meta.env.DEV) return;
  const res = await fetch(`/api/${collection}`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
  if (!res.ok) throw new Error(await res.text().catch(() => 'Unbekannter Fehler'));
}

// ─── News-Bilder ──────────────────────────────────────────────────────────────
// Beiträge (app/news) tragen nur Verweise "db:{key}", die Bilder liegen unter
// newsImages/{key}. So lädt die Website zuerst die Texte und Bilder erst bei Bedarf.
const NewsImages = globalThis.MatchTrackerNewsImages;
async function imageHash(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest).slice(0, 16), byte => byte.toString(16).padStart(2, '0')).join('');
}
async function patchRoot(updates, timeoutMs) {
  const res = await fetch(dbUrl(''), {method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(updates), signal:AbortSignal.timeout(timeoutMs)});
  if (!res.ok) throw new Error('Gemeinsame Inhalte konnten nicht gespeichert werden.');
}
// Speichert Beiträge und neue Bilder in einem Schritt und liefert die gespeicherte Liste.
async function saveNews(data) {
  const {items, images} = await NewsImages.extract(data, imageHash);
  const updates = {'app/news': items};
  Object.entries(images).forEach(([key, image]) => { updates[`newsImages/${key}`] = image; });
  // Neue Bilder können mehrere MB groß sein; ohne neue Bilder reicht die übliche Frist.
  await patchRoot(updates, Object.keys(images).length ? 60000 : 10000);
  Object.entries(images).forEach(([key, image]) => newsImageCache.set(key, Promise.resolve(image)));
  // Bilder, auf die kein Beitrag mehr verweist, entfernen. Ein Fehler hier ist harmlos.
  try {
    const keep = NewsImages.referenced(items);
    const stored = await fetchRemote('newsImages', {shallow:true});
    const stale = Object.keys(stored || {}).filter(key => !keep.has(key));
    if (stale.length) await patchRoot(Object.fromEntries(stale.map(key => [`newsImages/${key}`, null])), 10000);
  } catch (error) { console.warn('Alte News-Bilder nicht entfernt:', error); }
  return items;
}
const newsImageCache = new Map();
// Liefert die darstellbare Bildquelle: Verweise werden einmal geladen, alles andere bleibt.
export function newsImage(value) {
  const key = NewsImages.refKey(value);
  if (!key) return Promise.resolve(value || '');
  if (!newsImageCache.has(key)) {
    const request = fetchRemote(`newsImages/${key}`, {timeoutMs:30000}).then(image => image || '');
    request.catch(() => newsImageCache.delete(key));
    newsImageCache.set(key, request);
  }
  return newsImageCache.get(key).catch(() => '');
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

  const res = await fetch(dbUrl(''), {
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
  const res = await fetch(dbUrl(`app/teams`), {
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
  const res = await fetch(dbUrl(`trainingSessions/${encodeURIComponent(id)}`), {
    method:'PUT',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(session),
    signal:AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error('Training konnte nicht gespeichert werden.');
}

export async function deleteTrainingSession(id) {
  forgetReads();
  const res = await fetch(dbUrl(`trainingSessions/${encodeURIComponent(id)}`), {
    method:'DELETE',
    signal:AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error('Training konnte nicht gelöscht werden.');
}
