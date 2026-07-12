import '../styles/base.css';
import '../styles/admin.css';
import * as api from './api.js';

// ── Storage Keys (nur noch für Migration) ─────────────────────────
const KEY_KADER    = 'ssv_kader';
const KEY_SPIELPLAN = 'ssv_spielplan';
const KEY_VEREINE  = 'ssv_vereine';

// ── State ─────────────────────────────────────────────────────────
let kader    = [];
let spielplan = [];
let vereine  = [];
let trainer  = [];
let editingId = null;
let editMode  = null;
let pendingPhoto           = null;
let pendingPhotoName       = null;
let pendingDetailPhoto     = null;
let pendingDetailPhotoName = null;
let pendingBadge           = null;
let pendingTrainerPhoto       = null;
let pendingTrainerPhotoName   = null;
let pendingTrainerDetail      = null;
let pendingTrainerDetailName  = null;

async function uploadImage(subpath, dataUrl, originalName) {
  const ext      = (originalName.split('.').pop() || 'jpg').toLowerCase();
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const res = await fetch(`/api/upload/${subpath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, data: dataUrl }),
  });
  if (!res.ok) throw new Error(await res.text());
  const { url } = await res.json();
  return url;
}

// ── Persistence ───────────────────────────────────────────────────
async function loadAll() {
  try { kader     = await api.load('kader'); }    catch { kader = []; }
  try { spielplan = await api.load('spielplan'); } catch { spielplan = []; }
  try { vereine   = await api.load('vereine'); }  catch { vereine = []; }
  try { trainer   = await api.load('trainer'); }  catch { trainer = []; }
  await migrateFromLocalStorage();
}

async function migrateFromLocalStorage() {
  const MIGRATED = 'ssv_migrated_v1';
  if (localStorage.getItem(MIGRATED)) return;

  let migrated = false;
  if (!kader.length) {
    try {
      const loc = JSON.parse(localStorage.getItem(KEY_KADER) || '[]');
      if (loc.length) { kader = loc; await api.save('kader', kader); migrated = true; }
    } catch {}
    if (!kader.length) {
      try {
        const old = JSON.parse(localStorage.getItem('matchtracker_v3') || 'null');
        if (old?.squad?.length) {
          kader = old.squad.map(p => ({ ...p, goals: p.goals || 0 }));
          await api.save('kader', kader); migrated = true;
        }
      } catch {}
    }
  }
  if (!spielplan.length) {
    try {
      const loc = JSON.parse(localStorage.getItem(KEY_SPIELPLAN) || '[]');
      if (loc.length) { spielplan = loc; await api.save('spielplan', spielplan); migrated = true; }
    } catch {}
    if (!spielplan.length) {
      try {
        const old = JSON.parse(localStorage.getItem('matchtracker_v3') || 'null');
        if (old?.schedule?.length) {
          spielplan = old.schedule.map(s => ({
            id: s.id || Date.now() + Math.random(), date: s.date || '',
            opponent: s.opponent || s.gegner || '', home: s.home !== false,
            venue: s.venue || 'Sportplatz Berghausen', time: s.time || '',
            result: s.result || null, status: s.status || (s.result ? 'past' : 'future'),
          }));
          await api.save('spielplan', spielplan); migrated = true;
        }
      } catch {}
    }
  }
  if (!vereine.length) {
    try {
      const loc = JSON.parse(localStorage.getItem(KEY_VEREINE) || '[]');
      if (loc.length) { vereine = loc; await api.save('vereine', vereine); migrated = true; }
    } catch {}
  }

  if (migrated) {
    localStorage.setItem(MIGRATED, '1');
    console.info('[Admin] Daten von localStorage auf Server migriert.');
  } else {
    localStorage.setItem(MIGRATED, '1');
  }
}

async function saveKader() {
  try { await api.save('kader', kader); }
  catch (e) { alert('Fehler beim Speichern (Kader): ' + e.message); throw e; }
}
async function saveSpielplan() {
  try { await api.save('spielplan', spielplan); }
  catch (e) { alert('Fehler beim Speichern (Spielplan): ' + e.message); throw e; }
}
async function saveVereine() {
  try { await api.save('vereine', vereine); }
  catch (e) { alert('Fehler beim Speichern (Vereine): ' + e.message); throw e; }
}
async function saveTrainer() {
  try { await api.save('trainer', trainer); }
  catch (e) { alert('Fehler beim Speichern (Trainer): ' + e.message); throw e; }
}

// ── Helpers ───────────────────────────────────────────────────────
function posFromNum(num) {
  const n = parseInt(num);
  if (!n && n !== 0) return '–';
  if (n === 1) return 'TW';
  if (n <= 4)  return 'AB';
  if (n <= 8)  return 'MF';
  return 'ST';
}

function formatDate(dateStr) {
  if (!dateStr) return { day: '–', month: '' };
  const d = new Date(dateStr + 'T00:00:00');
  return { day: d.getDate(), month: d.toLocaleDateString('de-DE', { month: 'short' }) };
}

function nextId() { return Date.now() + Math.floor(Math.random() * 1000); }

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Tab-Switching ─────────────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.admin-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.admin-section').forEach(s =>
    s.classList.toggle('active', s.dataset.section === name));
  if (name === 'vereine') renderVereine();
}

// ── Kader-Rendering ───────────────────────────────────────────────
function renderKader() {
  const el = document.getElementById('kaderList');
  const sorted = kader.slice().sort((a, b) => (a.num || 999) - (b.num || 999));
  if (!sorted.length) {
    el.innerHTML = '<div class="empty-state">Noch keine Spieler angelegt.<br>Klicke auf „Spieler hinzufügen".</div>';
    return;
  }
  el.innerHTML = sorted.map(p => {
    const pos = posFromNum(p.num);
    const avatarInner = p.photo ? `<img src="${p.photo}" alt="">` : '👤';
    return `<div class="item-card kader-card" data-id="${p.id}">
      <div class="kader-num"><strong>${p.num ?? '–'}</strong>${p.position || pos}</div>
      <div class="kader-avatar">${avatarInner}</div>
      <div>
        <div class="kader-name">${escHtml(p.name)}</div>
        <div class="kader-pos">${p.position || pos || '–'} · ${p.goals || 0} Tor${p.goals === 1 ? '' : 'e'}</div>
      </div>
      <div class="card-actions">
        <button class="btn-icon" title="Bearbeiten" onclick="openPlayerForm(${p.id})">✏️</button>
        <button class="btn-icon danger" title="Löschen" onclick="deletePlayer(${p.id})">🗑</button>
      </div>
    </div>`;
  }).join('');
}

// ── Spielplan-Rendering ───────────────────────────────────────────
function renderSpielplan() {
  const el = document.getElementById('spielplanList');
  const sorted = spielplan.slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  if (!sorted.length) {
    el.innerHTML = '<div class="empty-state">Noch keine Spiele angelegt.<br>Klicke auf „Spiel hinzufügen".</div>';
    return;
  }
  el.innerHTML = sorted.map(m => {
    const { day, month } = formatDate(m.date);
    const isPast = !!m.result, isNext = m.status === 'next';
    const teamLine = m.home
      ? `SSV Berghausen vs. ${escHtml(m.opponent)}`
      : `${escHtml(m.opponent)} vs. SSV Berghausen`;
    const badge = `<span class="mc-badge ${m.home ? 'home' : 'away'}">${m.home ? 'Heim' : 'Auswärts'}</span>`;
    const metaLine = [
      m.home ? (m.venue || 'Sportplatz Berghausen') : 'Auswärtsspiel',
      m.time ? m.time + ' Uhr' : '',
    ].filter(Boolean).join(' · ');

    let rightCol = '';
    if (isPast) {
      const [hs, as] = (m.result || '0:0').split(':').map(Number);
      const won = m.home ? hs > as : as > hs;
      const draw = hs === as;
      rightCol = `<div class="mc-result ${draw ? 'draw' : won ? 'win' : 'loss'}">${m.result}</div>`;
    } else if (isNext) {
      rightCol = `<div class="mc-next-label">Nächstes</div>`;
    }

    const cardClass = ['item-card match-card-grid', isNext ? 'is-next' : '', !isPast && !isNext ? 'mc-future' : ''].filter(Boolean).join(' ');
    return `<div class="${cardClass}" data-id="${m.id}">
      <div class="mc-date"><strong>${day}</strong>${month}</div>
      <div class="mc-info">
        <div class="mc-teams">${teamLine}${badge}</div>
        <div class="mc-meta">${metaLine}</div>
      </div>
      <div>${rightCol}</div>
      <div class="card-actions">
        ${!isPast ? `<button class="btn-sm" onclick="openResultForm(${m.id})">Ergebnis</button>` : ''}
        ${!isNext ? `<button class="btn-icon" onclick="setNextMatch(${m.id})">📌</button>` : ''}
        <button class="btn-icon" onclick="openMatchForm(${m.id})">✏️</button>
        <button class="btn-icon danger" onclick="deleteMatch(${m.id})">🗑</button>
      </div>
    </div>`;
  }).join('');
}

// ── Player-Form ───────────────────────────────────────────────────
function openPlayerForm(id) {
  editMode = 'player'; editingId = id || null;
  const p = id ? kader.find(x => x.id === id) : null;

  document.getElementById('formTitle').textContent = p ? 'Spieler bearbeiten' : 'Spieler hinzufügen';
  document.getElementById('fPlayerName').value     = p ? p.name : '';
  document.getElementById('fPlayerNum').value      = p?.num ?? '';
  document.getElementById('fPlayerPos').value      = p?.position || '';
  document.getElementById('fPlayerGoals').value    = p?.goals ?? 0;
  document.getElementById('fPlayerAssists').value  = p?.assists ?? 0;
  document.getElementById('fPlayerGames').value    = p?.games ?? 0;
  document.getElementById('fPlayerMinutes').value  = p?.minutes ?? 0;
  document.getElementById('fPlayerTraining').value = p?.training ?? 0;

  pendingPhoto           = null;
  pendingPhotoName       = null;
  pendingDetailPhoto     = null;
  pendingDetailPhotoName = null;

  const preview = document.getElementById('fPlayerPhotoPreview');
  if (preview) preview.innerHTML = p?.photo ? `<img src="${p.photo}" alt="">` : '👤';
  const photoInput = document.getElementById('fPlayerPhoto');
  if (photoInput) photoInput.value = '';

  const detailPreview = document.getElementById('fPlayerDetailPreview');
  if (detailPreview) detailPreview.innerHTML = p?.detailPhoto ? `<img src="${p.detailPhoto}" alt="">` : '🖼️';
  const detailInput = document.getElementById('fPlayerDetail');
  if (detailInput) detailInput.value = '';

  document.getElementById('fDeleteBtn').style.display = p ? 'block' : 'none';
  openPanel();
}

async function savePlayerForm() {
  const name = document.getElementById('fPlayerName').value.trim();
  if (!name) { document.getElementById('fPlayerName').focus(); return; }
  const num      = parseInt(document.getElementById('fPlayerNum').value) || null;
  const position = document.getElementById('fPlayerPos').value || '';
  const goals    = parseInt(document.getElementById('fPlayerGoals').value) || 0;
  const assists  = parseInt(document.getElementById('fPlayerAssists').value) || 0;
  const games    = parseInt(document.getElementById('fPlayerGames').value) || 0;
  const minutes  = parseInt(document.getElementById('fPlayerMinutes').value) || 0;
  const training = parseInt(document.getElementById('fPlayerTraining').value) || 0;
  const existing = editingId ? kader.find(x => x.id === editingId) : null;

  let photo = existing?.photo || '';
  let detailPhoto = existing?.detailPhoto || '';

  try {
    if (pendingPhoto)       photo       = await uploadImage('kader/portraits', pendingPhoto,       pendingPhotoName       || 'portrait.jpg');
    if (pendingDetailPhoto) detailPhoto = await uploadImage('kader/detail',    pendingDetailPhoto, pendingDetailPhotoName || 'detail.jpg');
  } catch (e) {
    alert('Upload fehlgeschlagen: ' + e.message);
    return;
  }

  if (editingId) {
    if (existing) Object.assign(existing, { name, num, position, goals, assists, games, minutes, training, photo, detailPhoto });
  } else {
    kader.push({ id: nextId(), name, num, position, goals, assists, games, minutes, training, photo, detailPhoto });
  }
  await saveKader();
  renderKader();
  closePanel();
}

async function deletePlayer(id) {
  if (!confirm('Spieler wirklich löschen?')) return;
  kader = kader.filter(p => p.id !== id);
  await saveKader();
  renderKader();
}

// ── Trainer ───────────────────────────────────────────────────────
function renderTrainer() {
  const el = document.getElementById('trainerList');
  if (!el) return;
  if (!trainer.length) {
    el.innerHTML = '<div class="empty-state" style="padding:16px 0">Noch kein Trainer angelegt.</div>';
    return;
  }
  el.innerHTML = trainer.map(t => {
    const avatarInner = t.photo ? `<img src="${t.photo}" alt="">` : '👤';
    return `<div class="item-card kader-card" data-id="${t.id}">
      <div class="kader-avatar">${avatarInner}</div>
      <div style="flex:1;min-width:0">
        <div class="kader-name">${escHtml(t.name)}</div>
        <div class="kader-pos">${escHtml(t.role || 'Trainer')}</div>
      </div>
      <div class="item-actions">
        <button class="btn-icon" onclick="openTrainerForm(${t.id})">✏️</button>
        <button class="btn-icon danger" onclick="deleteTrainer(${t.id})">🗑</button>
      </div>
    </div>`;
  }).join('');
}

function openTrainerForm(id) {
  editMode = 'trainer'; editingId = id || null;
  const t = id ? trainer.find(x => x.id === id) : null;

  document.getElementById('formTitle').textContent = t ? 'Trainer bearbeiten' : 'Trainer hinzufügen';
  document.getElementById('fTrainerName').value = t ? t.name : '';
  document.getElementById('fTrainerRole').value = t?.role || 'Trainer';

  pendingTrainerPhoto      = null;
  pendingTrainerPhotoName  = null;
  pendingTrainerDetail     = null;
  pendingTrainerDetailName = null;

  const preview = document.getElementById('fTrainerPhotoPreview');
  if (preview) preview.innerHTML = t?.photo ? `<img src="${t.photo}" alt="">` : '👤';
  const photoInput = document.getElementById('fTrainerPhoto');
  if (photoInput) photoInput.value = '';

  const detailPreview = document.getElementById('fTrainerDetailPreview');
  if (detailPreview) detailPreview.innerHTML = t?.detailPhoto ? `<img src="${t.detailPhoto}" alt="">` : '🖼️';
  const detailInput = document.getElementById('fTrainerDetail');
  if (detailInput) detailInput.value = '';

  document.getElementById('fDeleteBtn').style.display = t ? 'block' : 'none';
  openPanel();
}

async function saveTrainerForm() {
  const name = document.getElementById('fTrainerName').value.trim();
  if (!name) { document.getElementById('fTrainerName').focus(); return; }
  const role     = document.getElementById('fTrainerRole').value;
  const existing = editingId ? trainer.find(x => x.id === editingId) : null;
  let photo       = existing?.photo       || '';
  let detailPhoto = existing?.detailPhoto || '';
  try {
    if (pendingTrainerPhoto)  photo       = await uploadImage('trainer/portraits', pendingTrainerPhoto,  pendingTrainerPhotoName  || 'portrait.jpg');
    if (pendingTrainerDetail) detailPhoto = await uploadImage('trainer/detail',    pendingTrainerDetail, pendingTrainerDetailName || 'detail.jpg');
  } catch (e) { alert('Upload fehlgeschlagen: ' + e.message); return; }

  if (editingId) {
    if (existing) Object.assign(existing, { name, role, photo, detailPhoto });
  } else {
    trainer.push({ id: nextId(), name, role, photo, detailPhoto });
  }
  await saveTrainer();
  renderTrainer();
  closePanel();
}

async function deleteTrainer(id) {
  if (!confirm('Trainer wirklich löschen?')) return;
  trainer = trainer.filter(t => t.id !== id);
  await saveTrainer();
  renderTrainer();
}

// ── Match-Form ────────────────────────────────────────────────────
function refreshOpponentSelect(currentValue) {
  const sel  = document.getElementById('fMatchOpponent');
  const hint = document.getElementById('fMatchOpponentHint');
  if (!sel) return;

  if (!vereine.length) {
    sel.innerHTML = '<option value="">– Keine Vereine angelegt –</option>';
    if (hint) hint.style.display = 'block';
    return;
  }
  if (hint) hint.style.display = 'none';

  const extraOption = currentValue && !vereine.find(v => v.name === currentValue)
    ? `<option value="${escHtml(currentValue)}">${escHtml(currentValue)}</option>` : '';

  sel.innerHTML =
    '<option value="">– Gegner auswählen –</option>' +
    extraOption +
    vereine.map(v =>
      `<option value="${escHtml(v.name)}">${escHtml(v.name)}${v.short ? ' (' + escHtml(v.short) + ')' : ''}</option>`
    ).join('');

  if (currentValue) sel.value = currentValue;
}

function openMatchForm(id) {
  editMode = 'match'; editingId = id || null;
  const m = id ? spielplan.find(x => x.id === id) : null;

  document.getElementById('formTitle').textContent = m ? 'Spiel bearbeiten' : 'Spiel hinzufügen';
  refreshOpponentSelect(m?.opponent || '');
  document.getElementById('fMatchDate').value  = m ? m.date : '';
  document.getElementById('fMatchTime').value  = m ? m.time : '';
  document.getElementById('fMatchHome').value  = m ? (m.home ? 'home' : 'away') : 'home';
  document.getElementById('fMatchVenue').value = m ? (m.venue || '') : 'Sportplatz Berghausen';

  document.getElementById('fDeleteBtn').style.display = m ? 'block' : 'none';
  openPanel();
}

async function saveMatchForm() {
  const opponent = document.getElementById('fMatchOpponent').value;
  if (!opponent) { document.getElementById('fMatchOpponent').focus(); return; }
  const date  = document.getElementById('fMatchDate').value;
  const time  = document.getElementById('fMatchTime').value;
  const home  = document.getElementById('fMatchHome').value === 'home';
  const venue = document.getElementById('fMatchVenue').value.trim();

  if (editingId) {
    const m = spielplan.find(x => x.id === editingId);
    if (m) Object.assign(m, { opponent, date, time, home, venue });
  } else {
    spielplan.push({ id: nextId(), opponent, date, time, home, venue, result: null, status: 'future' });
  }
  await saveSpielplan();
  renderSpielplan();
  closePanel();
}

async function deleteMatch(id) {
  if (!confirm('Spiel wirklich löschen?')) return;
  spielplan = spielplan.filter(m => m.id !== id);
  await saveSpielplan();
  renderSpielplan();
}

async function setNextMatch(id) {
  spielplan.forEach(m => { if (m.status === 'next') m.status = 'future'; });
  const m = spielplan.find(x => x.id === id);
  if (m) m.status = 'next';
  await saveSpielplan();
  renderSpielplan();
}

// ── Result-Form ───────────────────────────────────────────────────
function openResultForm(id) {
  editMode = 'result'; editingId = id;
  const m = spielplan.find(x => x.id === id);
  const [hs, as] = (m?.result || '').split(':').map(v => parseInt(v) || 0);

  document.getElementById('formTitle').textContent = 'Ergebnis eintragen';
  const panel = document.querySelector('.form-panel');
  panel.innerHTML = buildResultPanel(hs || 0, as || 0);
  openPanel();
}

function buildResultPanel(hs, as) {
  return `
    <div class="form-handle"></div>
    <div class="form-title" id="formTitle">Ergebnis eintragen</div>
    <div class="form-field">
      <label class="form-label">Tore SSV Berghausen : Gegner</label>
      <div class="result-row">
        <input class="score-input" id="fHomeScore" type="number" min="0" max="30" value="${hs}">
        <span class="result-sep">:</span>
        <input class="score-input" id="fAwayScore" type="number" min="0" max="30" value="${as}">
      </div>
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closePanel()">Abbrechen</button>
      <button class="btn-primary" onclick="saveForm()">Speichern</button>
    </div>`;
}

async function saveResultForm() {
  const hs = parseInt(document.getElementById('fHomeScore').value) || 0;
  const as = parseInt(document.getElementById('fAwayScore').value) || 0;
  const m  = spielplan.find(x => x.id === editingId);
  if (m) { m.result = `${hs}:${as}`; m.status = 'past'; }
  await saveSpielplan();
  renderSpielplan();
  closePanel();
  setTimeout(resetPanel, 300);
}

// ── Panel ─────────────────────────────────────────────────────────
function openPanel() {
  document.getElementById('formOverlay').classList.add('open');
  document.getElementById('formPanel').classList.add('open');
  document.querySelectorAll('.form-block').forEach(b => {
    b.style.display = b.dataset.for === editMode ? 'block' : 'none';
  });
}

function closePanel() {
  document.getElementById('formOverlay').classList.remove('open');
  document.getElementById('formPanel').classList.remove('open');
  editingId = null; editMode = null;
}

function resetPanel() {
  const panel = document.querySelector('.form-panel');
  if (!panel.querySelector('#formTitle')) {
    panel.innerHTML = buildBasePanel();
    bindFormEvents();
  }
}

function buildBasePanel() {
  return `
    <div class="form-handle"></div>
    <div class="form-title" id="formTitle"></div>

    <!-- Spieler-Felder -->
    <div class="form-block" data-for="player">
      <div class="form-row">
        <div class="form-field" style="flex:1">
          <label class="form-label">Vorname</label>
          <input class="form-input" id="fPlayerName" type="text" placeholder="Vorname" maxlength="30">
        </div>
        <div class="form-field" style="width:80px;flex:none">
          <label class="form-label">Nummer</label>
          <input class="form-input" id="fPlayerNum" type="number" placeholder="–" min="1" max="99">
        </div>
      </div>
      <div class="form-field">
        <label class="form-label">Position</label>
        <select class="form-select" id="fPlayerPos">
          <option value="">– keine –</option>
          <option value="TW">TW · Torwart</option>
          <option value="AB">AB · Abwehr</option>
          <option value="MF">MF · Mittelfeld</option>
          <option value="ST">ST · Sturm</option>
        </select>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label class="form-label">Tore</label>
          <input class="form-input" id="fPlayerGoals" type="number" placeholder="0" min="0">
        </div>
        <div class="form-field">
          <label class="form-label">Vorlagen</label>
          <input class="form-input" id="fPlayerAssists" type="number" placeholder="0" min="0">
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label class="form-label">Spiele</label>
          <input class="form-input" id="fPlayerGames" type="number" placeholder="0" min="0">
        </div>
        <div class="form-field">
          <label class="form-label">Spielminuten</label>
          <input class="form-input" id="fPlayerMinutes" type="number" placeholder="0" min="0">
        </div>
      </div>
      <div class="form-field">
        <label class="form-label">Trainingsbeteiligung (%)</label>
        <input class="form-input" id="fPlayerTraining" type="number" placeholder="0" min="0" max="100">
      </div>
      <div class="form-row">
        <div class="form-field">
          <label class="form-label">Portrait <span style="font-weight:400;color:var(--muted)">(Liste)</span></label>
          <div class="photo-field">
            <div id="fPlayerPhotoPreview" class="photo-preview">👤</div>
            <label class="photo-btn">Bild wählen<input type="file" id="fPlayerPhoto" accept="image/*"></label>
          </div>
        </div>
        <div class="form-field">
          <label class="form-label">Detail-Hintergrund <span style="font-weight:400;color:var(--muted)">(Karte)</span></label>
          <div class="photo-field">
            <div id="fPlayerDetailPreview" class="photo-preview photo-preview--wide">🖼️</div>
            <label class="photo-btn">Bild wählen<input type="file" id="fPlayerDetail" accept="image/*"></label>
          </div>
        </div>
      </div>
    </div>

    <!-- Spiel-Felder -->
    <div class="form-block" data-for="match">
      <div class="form-field">
        <label class="form-label">Gegner</label>
        <select class="form-select" id="fMatchOpponent">
          <option value="">– Gegner auswählen –</option>
        </select>
        <div id="fMatchOpponentHint" style="font-family:var(--mono);font-size:10px;color:var(--muted);margin-top:5px;display:none">
          Zuerst Vereine anlegen im <strong>Vereine</strong>-Tab.
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label class="form-label">Datum</label>
          <input class="form-input" id="fMatchDate" type="date">
        </div>
        <div class="form-field">
          <label class="form-label">Uhrzeit</label>
          <input class="form-input" id="fMatchTime" type="time">
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label class="form-label">Heimspiel / Auswärts</label>
          <select class="form-select" id="fMatchHome">
            <option value="home">Heimspiel</option>
            <option value="away">Auswärtsspiel</option>
          </select>
        </div>
        <div class="form-field">
          <label class="form-label">Ort / Sportplatz</label>
          <input class="form-input" id="fMatchVenue" type="text" placeholder="Sportplatz Berghausen" maxlength="60">
        </div>
      </div>
    </div>

    <!-- Trainer-Felder -->
    <div class="form-block" data-for="trainer">
      <div class="form-field">
        <label class="form-label">Name</label>
        <input class="form-input" id="fTrainerName" type="text" placeholder="Vorname Nachname" maxlength="40">
      </div>
      <div class="form-field">
        <label class="form-label">Funktion</label>
        <select class="form-select" id="fTrainerRole">
          <option value="Trainer">Trainer</option>
          <option value="Co-Trainer">Co-Trainer</option>
          <option value="Torwarttrainer">Torwarttrainer</option>
        </select>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label class="form-label">Portrait <span style="font-weight:400;color:var(--muted)">(Liste)</span></label>
          <div class="photo-field">
            <div id="fTrainerPhotoPreview" class="photo-preview">👤</div>
            <label class="photo-btn">Bild wählen<input type="file" id="fTrainerPhoto" accept="image/*"></label>
          </div>
        </div>
        <div class="form-field">
          <label class="form-label">Detail-Hintergrund <span style="font-weight:400;color:var(--muted)">(Karte)</span></label>
          <div class="photo-field">
            <div id="fTrainerDetailPreview" class="photo-preview photo-preview--wide">🖼️</div>
            <label class="photo-btn">Bild wählen<input type="file" id="fTrainerDetail" accept="image/*"></label>
          </div>
        </div>
      </div>
    </div>

    <!-- Verein-Felder -->
    <div class="form-block" data-for="club">
      <div class="form-row">
        <div class="form-field" style="flex:1">
          <label class="form-label">Vereinsname</label>
          <input class="form-input" id="fClubName" type="text" placeholder="FC Musterstadt" maxlength="50">
        </div>
        <div class="form-field" style="width:90px;flex:none">
          <label class="form-label">Kürzel</label>
          <input class="form-input" id="fClubShort" type="text" placeholder="FCS" maxlength="5" style="text-transform:uppercase">
        </div>
      </div>
      <div class="form-field">
        <label class="form-label">Spielort / Adresse</label>
        <input class="form-input" id="fClubVenue" type="text" placeholder="Musterstraße 1, 12345 Musterstadt" maxlength="80">
      </div>
      <div class="form-row">
        <div class="form-field">
          <label class="form-label">Primärfarbe</label>
          <input class="form-input form-color" id="fClubColor1" type="color" value="#ff8341">
        </div>
        <div class="form-field">
          <label class="form-label">Sekundärfarbe</label>
          <input class="form-input form-color" id="fClubColor2" type="color" value="#ffffff">
        </div>
      </div>
      <div class="form-field">
        <label class="form-label">Vereinswappen</label>
        <div class="photo-field">
          <div id="fClubBadgePreview" class="photo-preview club-badge-preview">?</div>
          <label class="photo-btn">Wappen wählen<input type="file" id="fClubBadge" accept="image/*"></label>
        </div>
      </div>
    </div>

    <button class="btn-danger" id="fDeleteBtn" style="display:none;width:100%;margin-bottom:10px" onclick="deleteFromForm()">Löschen</button>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closePanel()">Abbrechen</button>
      <button class="btn-primary" onclick="saveForm()">Speichern</button>
    </div>`;
}

async function saveForm() {
  try {
    if (editMode === 'player')  await savePlayerForm();
    else if (editMode === 'match')   await saveMatchForm();
    else if (editMode === 'result')  await saveResultForm();
    else if (editMode === 'club')    await saveClubForm();
    else if (editMode === 'trainer') await saveTrainerForm();
  } catch (e) {
    console.error('Speichern fehlgeschlagen:', e);
  }
}

async function deleteFromForm() {
  if (editMode === 'player')       await deletePlayer(editingId);
  else if (editMode === 'match')   await deleteMatch(editingId);
  else if (editMode === 'club')    await deleteClub(editingId);
  else if (editMode === 'trainer') await deleteTrainer(editingId);
  closePanel();
}

function bindFormEvents() {
  document.getElementById('formOverlay').addEventListener('click', closePanel);

  document.getElementById('fMatchOpponent').addEventListener('change', e => {
    const club = vereine.find(v => v.name === e.target.value);
    if (!club) return;
    const homeField  = document.getElementById('fMatchHome');
    const venueField = document.getElementById('fMatchVenue');
    if (venueField && homeField?.value === 'away' && club.venue) venueField.value = club.venue;
  });

  function bindPhotoInput(inputId, previewId, onCropped) {
    document.getElementById(inputId).addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const name = file.name;
      const reader = new FileReader();
      reader.onload = ev => openCrop(ev.target.result, url => {
        onCropped(url, name);
        const preview = document.getElementById(previewId);
        if (preview) preview.innerHTML = `<img src="${url}" alt="">`;
      });
      reader.readAsDataURL(file);
    });
  }

  bindPhotoInput('fPlayerPhoto',  'fPlayerPhotoPreview',  (url, name) => { pendingPhoto = url; pendingPhotoName = name; });
  bindPhotoInput('fPlayerDetail', 'fPlayerDetailPreview', (url, name) => { pendingDetailPhoto = url; pendingDetailPhotoName = name; });
  bindPhotoInput('fTrainerPhoto', 'fTrainerPhotoPreview', (url, name) => { pendingTrainerPhoto = url; pendingTrainerPhotoName = name; });
  bindPhotoInput('fTrainerDetail','fTrainerDetailPreview',(url, name) => { pendingTrainerDetail = url; pendingTrainerDetailName = name; });

  document.getElementById('fClubBadge').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) { pendingBadge = null; return; }
    const reader = new FileReader();
    reader.onload = ev => {
      pendingBadge = ev.target.result;
      const preview = document.getElementById('fClubBadgePreview');
      if (preview) preview.innerHTML = `<img src="${pendingBadge}" alt="">`;
    };
    reader.readAsDataURL(file);
  });
}

// ── Vereine ───────────────────────────────────────────────────────
function renderVereine() {
  const el = document.getElementById('vereineList');
  if (!el) return;
  if (!vereine.length) {
    el.innerHTML = '<div class="empty-state">Noch keine Vereine angelegt.<br>Klicke auf „Verein hinzufügen".</div>';
    return;
  }
  el.innerHTML = vereine.map(v => {
    const badgeHtml = v.badge
      ? `<img src="${v.badge}" alt="">`
      : escHtml(v.short || v.name.slice(0, 3).toUpperCase());
    return `<div class="item-card club-card" data-id="${v.id}">
      <div class="club-badge-sm" style="background:${v.color1 || '#333'};color:#fff">${badgeHtml}</div>
      <div>
        <div class="kader-name">${escHtml(v.name)}</div>
        <div class="kader-pos">${escHtml(v.short || '')}${v.venue ? ' · ' + escHtml(v.venue) : ''}</div>
      </div>
      <div class="club-colors">
        <span class="color-dot" style="background:${v.color1 || '#555'}"></span>
        <span class="color-dot" style="background:${v.color2 || '#888'}"></span>
      </div>
      <div class="card-actions">
        <button class="btn-icon" title="Bearbeiten" onclick="openClubForm(${v.id})">✏️</button>
        <button class="btn-icon danger" title="Löschen" onclick="deleteClub(${v.id})">🗑</button>
      </div>
    </div>`;
  }).join('');
}

function openClubForm(id) {
  editMode = 'club'; editingId = id || null;
  const v = id ? vereine.find(x => x.id === id) : null;

  document.getElementById('formTitle').textContent = v ? 'Verein bearbeiten' : 'Verein hinzufügen';
  document.getElementById('fClubName').value   = v ? v.name   : '';
  document.getElementById('fClubShort').value  = v ? (v.short || '') : '';
  document.getElementById('fClubVenue').value  = v ? (v.venue || '') : '';
  document.getElementById('fClubColor1').value = v ? (v.color1 || '#ff8341') : '#ff8341';
  document.getElementById('fClubColor2').value = v ? (v.color2 || '#ffffff') : '#ffffff';

  pendingBadge = null;
  const preview = document.getElementById('fClubBadgePreview');
  if (preview) preview.innerHTML = v?.badge ? `<img src="${v.badge}" alt="">` : (v?.short || '?');
  const badgeInput = document.getElementById('fClubBadge');
  if (badgeInput) badgeInput.value = '';

  document.getElementById('fDeleteBtn').style.display = v ? 'block' : 'none';
  openPanel();
}

async function saveClubForm() {
  const name   = document.getElementById('fClubName').value.trim();
  if (!name) { document.getElementById('fClubName').focus(); return; }
  const short  = document.getElementById('fClubShort').value.trim().toUpperCase();
  const venue  = document.getElementById('fClubVenue').value.trim();
  const color1 = document.getElementById('fClubColor1').value;
  const color2 = document.getElementById('fClubColor2').value;
  const existingBadge = editingId ? (vereine.find(x => x.id === editingId)?.badge || '') : '';
  const badge  = pendingBadge || existingBadge;

  if (editingId) {
    const v = vereine.find(x => x.id === editingId);
    if (v) Object.assign(v, { name, short, venue, color1, color2, badge });
  } else {
    vereine.push({ id: nextId(), name, short, venue, color1, color2, badge });
  }
  await saveVereine();
  renderVereine();
  refreshOpponentSelect();
  closePanel();
}

async function deleteClub(id) {
  if (!confirm('Verein wirklich löschen?')) return;
  vereine = vereine.filter(v => v.id !== id);
  await saveVereine();
  renderVereine();
  refreshOpponentSelect();
  closePanel();
}

// ── Crop Tool ─────────────────────────────────────────────────────
let _cropCb = null;

function openCrop(dataUrl, callback) {
  _cropCb = callback;
  const overlay = document.getElementById('cropOverlay');
  const img     = document.getElementById('cropSourceImg');
  img.onload = () => {
    const wrap = document.getElementById('cropWrap');
    const iw   = img.offsetWidth;
    const ih   = img.offsetHeight;
    const size = Math.round(Math.min(iw, ih) * 0.8);
    const box  = document.getElementById('cropBox');
    box.style.width  = size + 'px';
    box.style.height = size + 'px';
    box.style.left   = Math.round((iw - size) / 2) + 'px';
    box.style.top    = Math.round((ih - size) / 2) + 'px';
  };
  img.src = dataUrl;
  overlay.classList.add('open');
}

function closeCrop() {
  document.getElementById('cropOverlay').classList.remove('open');
  _cropCb = null;
}

function confirmCrop() {
  const img  = document.getElementById('cropSourceImg');
  const box  = document.getElementById('cropBox');
  const wrap = document.getElementById('cropWrap');

  const imgRect  = img.getBoundingClientRect();
  const boxRect  = box.getBoundingClientRect();

  const sx = img.naturalWidth  / img.offsetWidth;
  const sy = img.naturalHeight / img.offsetHeight;

  const cx = (boxRect.left - imgRect.left) * sx;
  const cy = (boxRect.top  - imgRect.top)  * sy;
  const cw = boxRect.width  * sx;
  const ch = boxRect.height * sy;

  const canvas = document.createElement('canvas');
  canvas.width  = Math.round(cw);
  canvas.height = Math.round(ch);
  canvas.getContext('2d').drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);

  const url = canvas.toDataURL('image/png');
  const cb = _cropCb;
  closeCrop();
  if (cb) cb(url);
}

function initCropEvents() {
  const overlay = document.getElementById('cropOverlay');
  const box     = document.getElementById('cropBox');
  const img     = document.getElementById('cropSourceImg');

  document.getElementById('cropCancelBtn').addEventListener('click', closeCrop);
  document.getElementById('cropConfirmBtn').addEventListener('click', confirmCrop);

  // Drag box to move
  box.addEventListener('mousedown', e => {
    if (e.target.classList.contains('crop-handle')) return;
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const startL = parseInt(box.style.left), startT = parseInt(box.style.top);
    const onMove = e => {
      const iw = img.offsetWidth, ih = img.offsetHeight;
      const bw = box.offsetWidth, bh = box.offsetHeight;
      box.style.left = Math.max(0, Math.min(startL + e.clientX - startX, iw - bw)) + 'px';
      box.style.top  = Math.max(0, Math.min(startT + e.clientY - startY, ih - bh)) + 'px';
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  // Corner handles: resize (square, so w = h always)
  box.querySelectorAll('.crop-handle').forEach(h => {
    h.addEventListener('mousedown', e => {
      e.preventDefault(); e.stopPropagation();
      const isTL = h.classList.contains('crop-tl'), isTR = h.classList.contains('crop-tr');
      const isBL = h.classList.contains('crop-bl');
      const startX = e.clientX, startY = e.clientY;
      const startW = box.offsetWidth;
      const startL = parseInt(box.style.left), startT = parseInt(box.style.top);
      const onMove = e => {
        const iw = img.offsetWidth, ih = img.offsetHeight;
        const dx = e.clientX - startX, dy = e.clientY - startY;
        let delta = (isTL || isBL) ? -dx : dx;
        let newW  = Math.max(40, startW + delta);
        let newL  = startL, newT = startT;
        if (isTL || isBL) newL = startL + startW - newW;
        if (isTL || isTR) newT = startT + startW - newW;
        newL = Math.max(0, newL); newT = Math.max(0, newT);
        newW = Math.min(newW, iw - newL, ih - newT);
        box.style.width = box.style.height = newW + 'px';
        box.style.left = newL + 'px';
        box.style.top  = newT + 'px';
      };
      const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  });
}

// ── Bootstrap ─────────────────────────────────────────────────────
async function boot() {
  await loadAll();

  document.querySelector('.form-panel').innerHTML = buildBasePanel();
  bindFormEvents();
  initCropEvents();

  document.querySelectorAll('.admin-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  Object.assign(window, {
    openPlayerForm, deletePlayer, savePlayerForm,
    openMatchForm,  deleteMatch,  saveMatchForm, setNextMatch,
    openResultForm, saveResultForm,
    openClubForm,   deleteClub,   saveClubForm,
    openTrainerForm, deleteTrainer, saveTrainerForm,
    closePanel, saveForm, deleteFromForm,
    openCrop,
  });

  renderKader();
  renderSpielplan();
  renderVereine();
  renderTrainer();
}

document.addEventListener('DOMContentLoaded', boot);
