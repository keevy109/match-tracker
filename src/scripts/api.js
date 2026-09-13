import '../../public/player-stats.js';
const DATABASE = 'https://match-tracker-891ac-default-rtdb.europe-west1.firebasedatabase.app';
async function remote(path) {
  const res = await fetch(`${DATABASE}/${path}.json`, {signal:AbortSignal.timeout(8000), cache:'no-store'});
  if (!res.ok) throw new Error('Gemeinsamer Kader nicht erreichbar');
  return res.json();
}
export async function load(collection) {
  if (collection === 'kader') {
    try {
      const [roster, matches, participants] = await Promise.all([remote('app/squad'), remote('matches'), remote('matchParticipants')]);
      if (roster) return globalThis.MatchTrackerStats.calculate(roster, matches, participants || {});
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

export async function loadMatchRecords() { return remote('matches'); }
