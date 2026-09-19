import '../../public/player-stats.js';
import '../../public/schedule-data.js';
const DATABASE = 'https://match-tracker-891ac-default-rtdb.europe-west1.firebasedatabase.app';
async function remote(path) {
  const res = await fetch(`${DATABASE}/${path}.json`, {signal:AbortSignal.timeout(8000), cache:'no-store'});
  if (!res.ok) throw new Error('Gemeinsamer Kader nicht erreichbar');
  return res.json();
}
export async function load(collection) {
  if (collection === 'kader') {
    try {
      const [roster, matches, participants, training, schedule] = await Promise.all([remote('app/squad'), remote('matches'), remote('matchParticipants'), remote('trainingSessions'), remote('app/schedule')]);
      if (roster) return globalThis.MatchTrackerStats.calculate(roster, globalThis.MatchTrackerSchedule.visibleMatches(matches, schedule), participants || {}, training || {});
    } catch (error) { console.warn('Kader: gespeicherte lokale Version wird verwendet.', error); }
  }
  const res = await fetch(`${import.meta.env.BASE_URL}data/${collection}.json`);
  if (!res.ok) return [];
  try { return await res.json(); } catch { return []; }
}
export async function save(collection, data) {
  if (collection === 'kader') {
    const res = await fetch(`${DATABASE}/app/squad.json`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data), signal:AbortSignal.timeout(10000)});
    if (!res.ok) throw new Error('Gemeinsamer Kader konnte nicht gespeichert werden.');
  }
  if (!import.meta.env.DEV) return;
  const res = await fetch(`/api/${collection}`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
  if (!res.ok) throw new Error(await res.text().catch(() => 'Unbekannter Fehler'));
}

export async function loadMatchRecords() {
  const [matches, schedule] = await Promise.all([remote('matches'), remote('app/schedule')]);
  return globalThis.MatchTrackerSchedule.visibleMatches(matches, schedule);
}

export async function loadTrackedSchedule() {
  const [schedule, matches] = await Promise.all([remote('app/schedule'), remote('matches')]);
  return globalThis.MatchTrackerSchedule.normalize(
    schedule,
    matches,
    new Date().toISOString().slice(0, 10),
  );
}

export async function saveTrackedSchedule(items) {
  const [schedule, matches] = await Promise.all([remote('app/schedule'), remote('matches')]);
  const scheduleUpdates = globalThis.MatchTrackerSchedule.mergeAdminSchedule(schedule, items);
  const updates = {};

  Object.entries(scheduleUpdates).forEach(([id, fixture]) => {
    updates[`app/schedule/${id}`] = fixture;
  });

  (items || []).forEach(item => {
    if (typeof item.result !== 'string') return;
    const id = String(item.id);
    const fixture = scheduleUpdates[id];
    if (!fixture?.result) return;
    const old = matches?.[id] || {};
    updates[`matches/${id}`] = {
      ...old,
      homeTeam:fixture.isHome ? 'SSV Berghausen' : fixture.opponent,
      awayTeam:fixture.isHome ? fixture.opponent : 'SSV Berghausen',
      homeScore:fixture.result.home,
      awayScore:fixture.result.away,
      isHomeTeam:fixture.isHome,
      matchFinished:true,
      fixture,
      updatedAt:Date.now(),
    };
  });

  const res = await fetch(`${DATABASE}/.json`, {
    method:'PATCH',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(updates),
    signal:AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error('Gemeinsamer Spielplan konnte nicht gespeichert werden.');
}
