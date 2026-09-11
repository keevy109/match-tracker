import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../src/scripts/data-store.js', import.meta.url), 'utf8');
const { createDataStore } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

function setup({ local = false, token = 'admin-token' } = {}) {
  const records = new Map();
  const calls = [];
  let failure = false;
  let version = 0;
  const seed = [{ id: 1, name: 'Beispiel' }];
  const request = async (url, options = {}) => {
    calls.push({ url, options });
    const collection = url.match(/\/(kader|spielplan|vereine|trainer)(?:\.json)?(?:\?|$)/)?.[1];
    if (url.startsWith('/match-tracker/data/')) return Response.json(seed);
    if (url.startsWith('/api/')) return failure ? new Response('', { status: 500 }) : Response.json({ ok: true });
    if (failure) return new Response('', { status: 403 });
    const stored = records.get(collection);
    const etag = stored?.etag || '"null_etag"';
    if (options.method === 'PUT') {
      if (options.headers['If-Match'] !== etag) return new Response('', { status: 412 });
      const next = { value: JSON.parse(options.body), etag: `"v${++version}"` };
      records.set(collection, next);
      return Response.json(next.value, { headers: { ETag: next.etag } });
    }
    return Response.json(stored?.value ?? null, { headers: { ETag: etag } });
  };
  const makeStore = () => createDataStore({ local, baseUrl: '/match-tracker/', cloudUrl: 'https://example.test', getToken: async () => token, request });
  return { store: makeStore(), makeStore, records, calls, seed, fail: () => { failure = true; } };
}

for (const collection of ['kader', 'spielplan', 'vereine', 'trainer']) {
  test(`${collection}: save persists across a fresh reader, including deletion of all items`, async () => {
    const { store, makeStore, seed } = setup();
    assert.deepEqual(await store.load(collection, { strict: true }), seed);
    const changed = [{ id: 1, name: 'Geändert', num: null }];
    await store.save(collection, changed);
    assert.deepEqual(await makeStore().load(collection), changed);
    await store.save(collection, []);
    assert.deepEqual(await makeStore().load(collection), []);
  });
}
test('unauthenticated admin cannot load or save, public reading needs no token', async () => {
  const { store, calls } = setup({ token: null });
  await assert.rejects(store.load('kader', { strict: true }), /anmelden/);
  await store.load('kader');
  await assert.rejects(store.save('kader', []), /anmelden/);
  assert.equal(calls.some(call => call.options.method === 'PUT'), false);
});
test('cloud failure blocks admin while public website can use published data', async () => {
  const { store, fail, seed, calls } = setup();
  fail();
  await assert.rejects(store.load('kader', { strict: true }), /geladen/);
  assert.deepEqual(await store.load('kader'), seed);
  await assert.rejects(store.save('kader', []), /neu laden/);
  assert.equal(calls.some(call => call.options.method === 'PUT'), false);
});
test('failed saves do not report success or change persisted data', async () => {
  const { store, fail, records } = setup();
  await store.load('kader', { strict: true });
  fail();
  await assert.rejects(store.save('kader', []), /fehlgeschlagen/);
  assert.equal(records.size, 0);
});
test('a stale admin cannot overwrite another admin’s changes', async () => {
  const { store, makeStore } = setup();
  const other = makeStore();
  await store.load('kader', { strict: true });
  await other.load('kader', { strict: true });
  await store.save('kader', [{ id: 2, name: 'Neu' }]);
  await assert.rejects(other.save('kader', []), /Zwischenzeitlich/);
  assert.deepEqual(await makeStore().load('kader'), [{ id: 2, name: 'Neu' }]);
});
test('local editing still uses local JSON and API', async () => {
  const { store, calls, fail } = setup({ local: true });
  await store.load('vereine', { strict: true });
  await store.save('vereine', []);
  assert.equal(calls[1].url, '/api/vereine');
  assert.equal(calls[1].options.method, 'POST');
  fail();
  await assert.rejects(store.save('vereine', []), /fehlgeschlagen/);
});
test('unknown collections cannot become database paths', async () => {
  const { store, calls } = setup();
  await assert.rejects(store.load('../admins'), /Unbekannter/);
  await assert.rejects(store.save('../admins', []), /Unbekannter/);
  assert.equal(calls.length, 0);
});
