import '../../public/player-stats.js';
import '../../public/schedule-data.js';
import '../../public/team-data.js';
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
  if (collection === 'trainer' || collection === 'news') {
    try {
      const shared = await remote(`app/${collection}`);
      if (shared) return Array.isArray(shared) ? shared : Object.values(shared);
    } catch (error) { console.warn(`${collection}: statische Version wird verwendet.`, error); }
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
  const [matches, schedule] = await Promise.all([remote('matches'), remote('app/schedule')]);
  return globalThis.MatchTrackerSchedule.visibleMatches(matches, schedule);
}

export async function loadTrackedSchedule() {
  const [schedule, matches, teams] = await Promise.all([remote('app/schedule'), remote('matches'), remote('app/teams')]);
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
  const schedule = await remote('app/schedule');
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
  return globalThis.MatchTrackerTeams.normalize(await remote('app/teams'));
}

export async function saveTrackedTeams(clubs) {
  const teams = globalThis.MatchTrackerTeams.merge(await remote('app/teams'), clubs);
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
  const res = await fetch(`${DATABASE}/trainingSessions/${encodeURIComponent(id)}.json`, {
    method:'PUT',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(session),
    signal:AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error('Training konnte nicht gespeichert werden.');
}

export async function deleteTrainingSession(id) {
  const res = await fetch(`${DATABASE}/trainingSessions/${encodeURIComponent(id)}.json`, {
    method:'DELETE',
    signal:AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error('Training konnte nicht gelöscht werden.');
}
