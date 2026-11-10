const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');

const context = vm.createContext({});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname, '../public/news-images.js'), 'utf8'), context);
const images = vm.runInContext('MatchTrackerNewsImages', context);
const hash = async value => crypto.createHash('sha256').update(value).digest('hex').slice(0, 32);
const jpeg = id => `data:image/jpeg;base64,${Buffer.from('bild-' + id).toString('base64')}`;

test('embedded images become db: references, paths and URLs stay', async () => {
  const items = [
    {id: 'a', title: 'A', image: jpeg(1), photos: [jpeg(2), 'uploads/news/x.jpg']},
    {id: 'b', title: 'B', image: 'juniorcup.jpg', photos: []},
    {id: 'c', title: 'C'},
  ];
  const {items: stored, images: extracted} = await images.extract(items, hash);
  assert.match(stored[0].image, /^db:[a-f0-9]{32}$/);
  assert.match(stored[0].photos[0], /^db:[a-f0-9]{32}$/);
  assert.equal(stored[0].photos[1], 'uploads/news/x.jpg');
  assert.equal(stored[1].image, 'juniorcup.jpg');
  assert.equal('image' in stored[2], false);
  assert.equal(Object.keys(extracted).length, 2);
  assert.equal(extracted[images.refKey(stored[0].image)], jpeg(1));
  assert.equal(items[0].image, jpeg(1), 'input stays untouched');
  assert.ok(JSON.stringify(stored).length < 400);
});

test('the same picture maps to the same key, so unchanged images are not re-sent', async () => {
  const first = await images.extract([{id: 'a', image: jpeg(1)}], hash);
  const again = await images.extract(first.items, hash);
  assert.equal(JSON.stringify(again.items), JSON.stringify(first.items));
  assert.equal(Object.keys(again.images).length, 0);
  const twice = await images.extract([{id: 'a', image: jpeg(1), photos: [jpeg(1)]}], hash);
  assert.equal(Object.keys(twice.images).length, 1);
});

test('referenced() collects keys from title images and photos, also from object-shaped lists', async () => {
  const {items} = await images.extract({0: {id: 'a', image: jpeg(1), photos: {0: jpeg(2)}}, 1: null}, hash);
  const keys = images.referenced(items);
  assert.equal(keys.size, 2);
  assert.equal(images.referenced([{image: 'juniorcup.jpg', photos: ['db:nicht-hex']}]).size, 0);
});

test('refKey only accepts well-formed references', () => {
  assert.equal(images.refKey('db:0123456789abcdef0123456789abcdef'), '0123456789abcdef0123456789abcdef');
  for (const value of ['db:../app', 'db:', 'uploads/db:abc', null, 42, 'data:image/png;base64,AA']) assert.equal(images.refKey(value), null);
});
