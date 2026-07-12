import { defineConfig } from 'vite';
import fs   from 'fs';
import path from 'path';

const DATA_DIR   = path.resolve('./public/data');
const UPLOAD_DIR = path.resolve('./public/uploads');
const ALLOWED        = new Set(['kader', 'spielplan', 'vereine', 'trainer']);
const UPLOAD_ALLOWED = new Set(['kader/portraits', 'kader/detail', 'trainer/portraits', 'trainer/detail']);

function apiPlugin() {
  return {
    name: 'api',
    configureServer(server) {
      server.middlewares.use('/api', (req, res) => {
        const url  = (req.url || '/').replace(/^\/+/, '').split('?')[0];

        // ── Upload-Endpoint: /api/upload/<subpath> ──────────────────
        if (url.startsWith('upload/')) {
          const subpath = url.slice('upload/'.length);
          if (!UPLOAD_ALLOWED.has(subpath)) { res.statusCode = 404; res.end('Not found'); return; }
          if (req.method !== 'POST') { res.statusCode = 405; res.end('Method not allowed'); return; }
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { filename, data } = JSON.parse(body);
              if (!filename || !data) throw new Error('Missing filename or data');
              const base64 = data.replace(/^data:[^;]+;base64,/, '');
              const buf    = Buffer.from(base64, 'base64');
              const safe   = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
              const dir    = path.join(UPLOAD_DIR, subpath);
              fs.mkdirSync(dir, { recursive: true });
              fs.writeFileSync(path.join(dir, safe), buf);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ url: `uploads/${subpath}/${safe}` }));
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        // ── JSON-Daten-Endpoint: /api/<collection> ──────────────────
        if (!ALLOWED.has(url)) { res.statusCode = 404; res.end('Not found'); return; }
        const file = path.join(DATA_DIR, `${url}.json`);

        if (req.method === 'GET') {
          const data = fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : '[]';
          res.setHeader('Content-Type', 'application/json');
          res.end(data);

        } else if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              JSON.parse(body);
              fs.mkdirSync(DATA_DIR, { recursive: true });
              fs.writeFileSync(file, body, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end('{"ok":true}');
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: e.message }));
            }
          });

        } else {
          res.statusCode = 405;
          res.end('Method not allowed');
        }
      });
    },
  };
}

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [apiPlugin()],
  server: { port: 4321 },
  build: {
    rollupOptions: {
      input: { main: 'index.html', tracker: 'match-tracker.html', admin: 'admin.html' },
    },
  },
});
