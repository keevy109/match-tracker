import * as api from './api.js';
import casparUrl from '/caspar.png';

const POS_LABEL = { TW: 'Tor', AB: 'Abwehr', MF: 'Mittelfeld', ST: 'Stürmer' };

function posFromNum(num) {
  const n = parseInt(num);
  if (!n && n !== 0) return '–';
  if (n === 1) return 'TW';
  if (n <= 4)  return 'AB';
  if (n <= 8)  return 'MF';
  return 'ST';
}

function posLabel(pos) {
  return POS_LABEL[pos] || pos || '–';
}

function statColor(v) {
  if (v >= 75) return '';
  if (v >= 60) return 'mid';
  return 'low';
}

let squad   = [];
let coaches = [];
let sortField = 'num';
let sortDir   = 1;

const SORT_COLS = [
  { field: 'num',      label: '#',      right: false },
  { field: null,       label: '',       right: false },
  { field: 'name',     label: 'Name',   right: false },
  { field: 'goals',    label: 'Tore',   right: true  },
  { field: 'assists',  label: 'Vorl.',  right: true  },
  { field: 'games',    label: 'Spiele', right: true  },
  { field: 'training', label: 'Train.', right: true  },
];

function sortedSquad() {
  return squad.slice().sort((a, b) => {
    if (sortField === 'name') {
      const av = (a.name || '').toLowerCase();
      const bv = (b.name || '').toLowerCase();
      return sortDir * (av < bv ? -1 : av > bv ? 1 : 0);
    }
    return sortDir * ((a[sortField] ?? 0) - (b[sortField] ?? 0));
  });
}

function renderSortHeader(container) {
  let header = document.getElementById('kaderSortHeader');
  if (!header) {
    header = document.createElement('div');
    header.id = 'kaderSortHeader';
    header.className = 'kl-header';
    container.insertAdjacentElement('beforebegin', header);
  }
  header.innerHTML = SORT_COLS.map(col => {
    if (!col.field) return '<span></span>';
    const active = sortField === col.field;
    const arrow  = active ? (sortDir > 0 ? ' ↑' : ' ↓') : '';
    const cls    = 'kl-sort-btn' + (active ? ' kl-sort-active' : '') + (col.right ? ' kl-sort-right' : ' kl-sort-num');
    return `<button class="${cls}" data-sort="${col.field}">${col.label}${arrow}</button>`;
  }).join('');

  header.querySelectorAll('.kl-sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const field = btn.dataset.sort;
      if (sortField === field) {
        sortDir = -sortDir;
      } else {
        sortField = field;
        sortDir = field === 'name' ? 1 : -1;
      }
      renderKader();
    });
  });
}

function renderKader() {
  const container = document.getElementById('kaderRows');
  const badge     = document.getElementById('kaderCount');
  if (!container) return;

  if (badge) badge.textContent = squad.length ? squad.length + ' Spieler' : '–';

  if (!squad.length) {
    const old = document.getElementById('kaderSortHeader');
    if (old) old.remove();
    container.innerHTML = '<div class="kl-empty">Noch keine Spieler angelegt –<br><a href="admin.html">im Admin hinzufügen</a></div>';
    return;
  }

  renderSortHeader(container);

  const sorted = sortedSquad();
  container.innerHTML = sorted.map(p => {
    const pos    = p.position || posFromNum(p.num);
    const avatar = p.photo
      ? `<div class="kl-avatar"><img src="${p.photo}" alt=""></div>`
      : '<div class="kl-avatar">👤</div>';
    return `<div class="kl-row" data-pid="${p.id}">
      <div class="kl-date"><strong>${p.num ?? '–'}</strong>${pos}</div>
      ${avatar}
      <div class="kl-name">${p.name}</div>
      <div class="kl-stat" data-col="goals">${p.goals ?? 0}</div>
      <div class="kl-stat" data-col="assists">${p.assists ?? 0}</div>
      <div class="kl-stat" data-col="games">${p.games ?? 0}</div>
      <div class="kl-stat" data-col="training">${p.training ?? 0}<span class="kl-pct">%</span></div>
    </div>`;
  }).join('');

  container.querySelectorAll('.kl-row').forEach(row => {
    row.addEventListener('click', () => {
      container.querySelectorAll('.kl-row').forEach(r => r.classList.remove('kl-selected'));
      row.classList.add('kl-selected');
      const pid    = Number(row.dataset.pid);
      const player = squad.find(p => p.id === pid);
      if (player) showDetail(player);
    });
  });
}

function isMobile() { return window.innerWidth < 900; }

function placeDetail() {
  const detail   = document.getElementById('kaderDetail');
  const layout   = document.querySelector('.kader-layout');
  const selRow   = document.querySelector('.kl-row.kl-selected');
  if (!detail || !layout) return;

  if (isMobile() && selRow) {
    selRow.after(detail);
  } else if (!isMobile() && detail.parentNode !== layout) {
    layout.appendChild(detail);
  }
}

function setBg(src) {
  const bg = document.getElementById('kdBg');
  if (bg) bg.src = src || '';
}

function crossfadeBg(src) {
  const bg = document.getElementById('kdBg');
  if (!bg) return;

  const container = bg.parentElement;

  // Altes Bild auf Prev-Ebene (dahinter) sichern
  let prev = document.getElementById('kdBgPrev');
  if (!prev) {
    prev = document.createElement('img');
    prev.id = 'kdBgPrev';
    prev.alt = '';
    prev.className = 'kd-bg-prev';
    container.insertBefore(prev, bg);
  }
  prev.src = bg.src;

  // Neues Bild sofort auf 0 (ohne Transition)
  bg.style.transition = 'none';
  bg.style.opacity = '0';
  void bg.offsetHeight; // Reflow

  // CSS-Transition wieder aktiv
  bg.style.transition = '';

  if (!src) { bg.src = ''; bg.style.opacity = ''; return; }

  const img = new Image();
  const done = () => {
    bg.src = src;
    void bg.offsetHeight; // Reflow damit Transition von 0→1 feuert
    bg.style.opacity = '';
  };
  img.onload = done;
  img.onerror = done;
  img.src = src;
}

function applyPlayerContent(player) {
  const pos = player.position || posFromNum(player.num) || '–';
  set('kdRating', player.num ?? '–');
  set('kdGes',    posLabel(pos));
  set('kdPos',    '');
  set('kdLN', (player.name || '–').toUpperCase());
  set('kdGoals',    player.goals    ?? 0);
  set('kdAssists',  player.assists  ?? 0);
  set('kdGames',    player.games    ?? 0);
  set('kdTraining', (player.training ?? 0) + ' %');
}

function showDetail(player) {
  const detail = document.getElementById('kaderDetail');
  if (!detail) return;
  const src = player.detailPhoto || player.photo || casparUrl;

  if (detail.classList.contains('kd-visible')) {
    detail.classList.add('kd-switching');
    crossfadeBg(src);
    setTimeout(() => {
      applyPlayerContent(player);
      detail.classList.remove('kd-trainer', 'kd-switching');
      if (isMobile()) placeDetail();
    }, 500);
  } else {
    setBg(src);
    applyPlayerContent(player);
    detail.classList.remove('kd-trainer');
    placeDetail();
    detail.classList.add('kd-visible');
    void detail.offsetHeight;
    detail.classList.add('kd-shown');
  }
}

function set(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function allRows() {
  return document.querySelectorAll('.kl-row');
}

function applyTrainerContent(t) {
  set('kdRating', '');
  set('kdGes',    t.role || 'Trainer');
  set('kdLN',     (t.name || '–').toUpperCase());
}

function showTrainerDetail(t) {
  const detail = document.getElementById('kaderDetail');
  if (!detail) return;
  const src = t.detailPhoto || t.photo || '';

  if (detail.classList.contains('kd-visible')) {
    detail.classList.add('kd-switching');
    crossfadeBg(src);
    setTimeout(() => {
      applyTrainerContent(t);
      detail.classList.add('kd-trainer');
      detail.classList.remove('kd-switching');
      if (isMobile()) placeDetail();
    }, 500);
  } else {
    setBg(src);
    applyTrainerContent(t);
    detail.classList.add('kd-visible', 'kd-trainer');
    placeDetail();
    void detail.offsetHeight;
    detail.classList.add('kd-shown');
  }
}

function renderTrainer() {
  const section = document.getElementById('trainerSection');
  const container = document.getElementById('trainerRows');
  if (!container || !section) return;

  if (!coaches.length) { section.style.display = 'none'; return; }
  section.style.display = 'block';

  container.innerHTML = coaches.map(t => {
    const avatar = t.photo
      ? `<div class="kl-avatar"><img src="${t.photo}" alt=""></div>`
      : '<div class="kl-avatar">👤</div>';
    return `<div class="kl-row kl-trainer-row" data-tid="${t.id}">
      <div class="kl-trainer-role">${t.role || 'Trainer'}</div>
      ${avatar}
      <div class="kl-name">${t.name}</div>
    </div>`;
  }).join('');

  container.querySelectorAll('.kl-row').forEach(row => {
    row.addEventListener('click', () => {
      allRows().forEach(r => r.classList.remove('kl-selected'));
      row.classList.add('kl-selected');
      const tid = parseInt(row.dataset.tid);
      const t = coaches.find(c => c.id === tid);
      if (t) showTrainerDetail(t);
    });
  });
}

export async function init() {
  try {
    squad = await api.load('kader');
  } catch {
    try { squad = JSON.parse(localStorage.getItem('ssv_kader') || '[]'); } catch {}
    if (!squad.length) {
      try {
        const raw = JSON.parse(localStorage.getItem('matchtracker_v3') || 'null');
        squad = raw?.squad || [];
      } catch {}
    }
  }

  try { coaches = await api.load('trainer'); } catch { coaches = []; }

  renderKader();
  renderTrainer();

  window.addEventListener('resize', () => {
    const detail = document.getElementById('kaderDetail');
    if (detail?.classList.contains('kd-visible')) placeDetail();
  }, { passive: true });
}
