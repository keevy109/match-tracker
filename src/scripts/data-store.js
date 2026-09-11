const COLLECTIONS = new Set(['kader', 'spielplan', 'vereine', 'trainer']);

// Shared by the public website and admin. A missing cloud collection uses the
// published JSON once; an explicitly saved empty list must stay empty.
export function createDataStore({ baseUrl, local, request, cloudUrl, getToken }) {
  const versions = new Map();
  const validate = collection => {
    if (!COLLECTIONS.has(collection)) throw new Error('Unbekannter Datenbereich.');
  };
  async function seed(collection) {
    const response = await request(`${baseUrl}data/${collection}.json`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Die vorhandenen Daten konnten nicht geladen werden.');
    const items = await response.json();
    if (!Array.isArray(items)) throw new Error('Ungültiges Datenformat.');
    return items;
  }
  async function url(collection, authenticated) {
    const target = new URL(`${cloudUrl}/website/${collection}.json`);
    if (authenticated) {
      const token = await getToken();
      if (!token) throw new Error('Bitte zuerst als Administrator anmelden.');
      target.searchParams.set('auth', token);
    }
    return target.toString();
  }
  return {
    async load(collection, { strict = false } = {}) {
      validate(collection);
      versions.delete(collection);
      if (local) return seed(collection);
      try {
        const response = await request(await url(collection, strict), {
          cache: 'no-store', headers: { 'X-Firebase-ETag': 'true' },
        });
        if (!response.ok) throw new Error('Firebase-Daten konnten nicht geladen werden. Bitte Verbindung und Zugriffsregeln prüfen.');
        const value = await response.json();
        let items;
        if (value === null) items = await seed(collection);
        else {
          if (value.schema !== 1 || typeof value.items !== 'string') throw new Error('Ungültiges Firebase-Datenformat.');
          items = JSON.parse(value.items);
          if (!Array.isArray(items)) throw new Error('Ungültiges Firebase-Datenformat.');
        }
        const etag = response.headers.get('ETag');
        if (strict && !etag) throw new Error('Firebase hat keine Speicherversion geliefert. Bitte erneut laden.');
        versions.set(collection, etag);
        return items;
      } catch (error) {
        if (strict) throw error;
        console.warn(`Live-Daten (${collection}) nicht verfügbar; veröffentlichter Stand wird angezeigt.`);
        return seed(collection);
      }
    },
    async save(collection, items) {
      validate(collection);
      if (!Array.isArray(items)) throw new Error('Ungültiges Datenformat.');
      let response;
      if (local) {
        response = await request(`/api/${collection}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(items),
        });
      } else {
        if (!versions.get(collection)) throw new Error('Daten vor dem Speichern neu laden.');
        response = await request(await url(collection, true), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'If-Match': versions.get(collection), 'X-Firebase-ETag': 'true' },
          // JSON string preserves empty lists, null fields and array order in RTDB.
          body: JSON.stringify({ schema: 1, items: JSON.stringify(items) }),
        });
      }
      if (response.status === 412) throw new Error('Zwischenzeitlich wurden diese Daten geändert. Bitte die Seite neu laden und die Änderung erneut eingeben.');
      if (!response.ok) throw new Error('Speichern fehlgeschlagen. Bitte Anmeldung, Verbindung und Firebase-Schreibberechtigung prüfen.');
      if (!local) {
        const etag = response.headers.get('ETag');
        if (etag) versions.set(collection, etag);
        else versions.delete(collection); // Never overwrite a newer version blindly.
      }
    },
  };
}
