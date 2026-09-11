import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../src/scripts/image-upload.js', import.meta.url), 'utf8');
const { prepareImage, MAX_IMAGE_LENGTH } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const tiny = 'data:image/png;base64,aGVsbG8=';
const large = 'data:image/png;base64,' + 'A'.repeat(MAX_IMAGE_LENGTH);
for (const path of ['kader/portraits', 'kader/detail', 'trainer/portraits', 'trainer/detail', 'vereine/badges']) {
  test(`${path}: small image becomes a persistable data URL without an upload request`, async () => {
    assert.equal(await prepareImage(path, tiny, { decode: async () => ({ naturalWidth: 32, naturalHeight: 32 }) }), tiny);
  });
}
test('large photo is scaled with its aspect ratio preserved and encoded below the limit', async () => {
  const canvas = { getContext: () => ({ drawImage() {} }), toDataURL: () => tiny };
  assert.equal(await prepareImage('kader/portraits', large, { decode: async () => ({ naturalWidth: 4000, naturalHeight: 2000 }), makeCanvas: () => canvas }), tiny);
  assert.equal(canvas.width, 640);
  assert.equal(canvas.height, 320);
});
test('oversized encoded images are downscaled again', async () => {
  const canvas = { getContext: () => ({ drawImage() {} }), toDataURL: () => canvas.width > 500 ? large : tiny };
  await prepareImage('kader/portraits', large, { decode: async () => ({ naturalWidth: 4000, naturalHeight: 2000 }), makeCanvas: () => canvas });
  assert.equal(canvas.width, 480);
});
test('invalid files and targets fail before decoding', async () => {
  await assert.rejects(prepareImage('kader/portraits', 'data:image/svg+xml;base64,aGVsbG8='), /PNG/);
  await assert.rejects(prepareImage('../admin', tiny), /Bildziel/);
  await assert.rejects(prepareImage('kader/detail', 'data:image/png;base64,' + 'A'.repeat(15 * 1024 * 1024)), /10 MB/);
});
test('unreadable or uncompressible images fail instead of returning empty URLs', async () => {
  await assert.rejects(prepareImage('kader/detail', tiny, { decode: async () => ({ naturalWidth: 0 }) }), /gelesen/);
  await assert.rejects(prepareImage('kader/detail', large, {
    decode: async () => ({ naturalWidth: 4000, naturalHeight: 2000 }),
    makeCanvas: () => ({ getContext: () => ({ drawImage() {} }), toDataURL: () => large }),
  }), /Ausschnitt/);
});
