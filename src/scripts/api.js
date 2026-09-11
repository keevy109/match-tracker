export async function load(collection) {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${collection}.json`);
  if (!res.ok) return [];
  try { return await res.json(); } catch { return []; }
}

export async function save(collection, data) {
  if (!import.meta.env.DEV) return; // im Build kein Schreibzugriff
  const res = await fetch(`/api/${collection}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => 'Unbekannter Fehler');
    throw new Error(msg);
  }
}
