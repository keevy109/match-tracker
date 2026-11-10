// Lagert eingebettete News-Bilder aus app/news nach newsImages/{key} aus.
//
//   node scripts/migrate-news-images.mjs            Probelauf: zeigt nur, was passieren würde
//   node scripts/migrate-news-images.mjs --apply    sichert app/news nach backups/ und migriert
//
// Erst ausführen, wenn die Website-Version mit newsImages ausgeliefert ist; ältere
// Versionen zeigen ausgelagerte Bilder nicht an. Mehrfaches Ausführen ist unschädlich.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATABASE = process.env.DATABASE_URL || 'https://match-tracker-891ac-default-rtdb.europe-west1.firebasedatabase.app';
const apply = process.argv.includes('--apply');

await import(path.join(ROOT, 'public/news-images.js'));
const NewsImages = globalThis.MatchTrackerNewsImages;
// Gleicher Schlüssel wie im Browser (api.js): SHA-256, erste 16 Byte als Hex.
const hash = async value => crypto.createHash('sha256').update(value).digest('hex').slice(0, 32);

// DATABASE_URL darf eine Query tragen, z. B. für den Emulator: http://127.0.0.1:9000?ns=…
function address(dbPath) {
  const url = new URL(DATABASE);
  url.pathname = `${url.pathname.replace(/\/$/, '')}/${dbPath}.json`;
  return url;
}
async function request(dbPath, init) {
  const res = await fetch(address(dbPath), init);
  if (!res.ok) throw new Error(`${init?.method || 'GET'} ${dbPath}: ${res.status} ${await res.text()}`);
  return res.json();
}
const size = value => `${(Buffer.byteLength(JSON.stringify(value ?? null)) / 1024).toFixed(0)} KB`;

const news = await request('app/news');
if (!news) { console.log('app/news ist leer, nichts zu tun.'); process.exit(0); }
const {items, images} = await NewsImages.extract(news, hash);
const keys = Object.keys(images);
console.log(`app/news jetzt: ${size(news)}, danach: ${size(items)}; ${keys.length} Bild(er) nach newsImages/ (${size(images)}).`);
if (!keys.length) { console.log('Keine eingebetteten Bilder mehr, nichts zu tun.'); process.exit(0); }
if (!apply) { console.log('Probelauf. Mit --apply ausführen, um zu migrieren.'); process.exit(0); }

const backupDir = process.env.BACKUP_DIR || path.join(ROOT, 'backups');
fs.mkdirSync(backupDir, {recursive: true});
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
const backup = path.join(backupDir, `app-news-${stamp}.json`);
fs.writeFileSync(backup, JSON.stringify(news));
console.log(`Sicherung: ${path.relative(ROOT, backup)}`);

// Ein PATCH: Bilder und verkleinerte Beiträge werden gemeinsam (atomar) geschrieben.
const updates = {'app/news': items};
keys.forEach(key => { updates[`newsImages/${key}`] = images[key]; });
await request('', {method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(updates)});

for (const key of keys) {
  if (await request(`newsImages/${key}`) !== images[key]) throw new Error(`Bild ${key} weicht ab – Sicherung ${backup} zurückspielen.`);
}
const after = await request('app/news');
if (JSON.stringify(after) !== JSON.stringify(items)) throw new Error(`app/news weicht ab – Sicherung ${backup} zurückspielen.`);
console.log(`Fertig: app/news ${size(after)}, ${keys.length} Bild(er) geprüft.`);
