import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const source = (await readFile(new URL('../src/scripts/admin.js', import.meta.url), 'utf8'))
  .replace(/^import .*;\n/gm, '')
  .replaceAll('import.meta.env.DEV', 'false');
function editor(save) {
  const elements = new Map();
  const context = vm.createContext({
    api: { save }, structuredClone, console,
    document: {
      addEventListener() {},
      getElementById(id) {
        if (!elements.has(id)) elements.set(id, { value: '', textContent: '', focus() {}, classList: { toggle() {} } });
        return elements.get(id);
      },
    },
  });
  vm.runInContext(source, context);
  vm.runInContext(`
    globalThis.closed = false;
    globalThis.rendered = false;
    closePanel = () => { globalThis.closed = true; };
    renderKader = () => { globalThis.rendered = true; };
    confirmed.kader = [{ id: 1, name: 'Alt', goals: 0 }];
    kader = structuredClone(confirmed.kader);
    editingId = 1;
    editMode = 'player';
    document.getElementById('fPlayerName').value = 'Neu';
    document.getElementById('fPlayerGoals').value = '3';
  `, context);
  return context;
}
test('failed save keeps player editor open and rolls back unsaved model', async () => {
  const context = editor(async () => { throw new Error('Keine Berechtigung'); });
  await assert.rejects(vm.runInContext('saveForm()', context), /Keine Berechtigung/);
  assert.equal(vm.runInContext('kader[0].name', context), 'Alt');
  assert.equal(context.closed, false);
  assert.equal(context.rendered, false);
  assert.equal(vm.runInContext("document.getElementById('fPlayerName').value", context), 'Neu');
});
test('successful save closes editor only after persistence resolves', async () => {
  let finish;
  const context = editor(() => new Promise(resolve => { finish = resolve; }));
  const pending = vm.runInContext('saveForm()', context);
  assert.equal(context.closed, false);
  finish();
  await pending;
  assert.equal(context.closed, true);
  assert.equal(context.rendered, true);
  assert.equal(vm.runInContext('confirmed.kader[0].name', context), 'Neu');
  assert.equal(vm.runInContext('confirmed.kader[0].goals', context), 3);
});
for (const collection of ['spielplan', 'vereine', 'trainer']) {
  test(`${collection}: failed save restores last confirmed state`, async () => {
    const context = editor(async () => { throw new Error('Offline'); });
    const method = { spielplan: 'saveSpielplan', vereine: 'saveVereine', trainer: 'saveTrainer' }[collection];
    vm.runInContext(`confirmed.${collection} = [{ id: 1, name: 'Alt' }]; ${collection} = [{ id: 1, name: 'Neu' }];`, context);
    await assert.rejects(vm.runInContext(`${method}()`, context), /Offline/);
    assert.equal(vm.runInContext(`${collection}[0].name`, context), 'Alt');
  });
}
