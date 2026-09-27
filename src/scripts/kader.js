import * as api from './api.js';

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
let sortField = 'name';
let sortDir   = 1;

const SORT_COLS = [
  { field: 'num',      label: '#',      right: false },
  { field: null,       label: '',       right: false },
  { field: 'name',     label: 'Name',   right: false },
  { field: 'goals',    label: 'Tore',   right: true  },
  { field: 'games',    label: 'Spiele', right: true  },
  { field: 'training', label: 'Train.', right: true  },
];

function sortedSquad() {
  return squad.slice().sort((a, b) => {
    if (sortField === 'name') {
      const av = (a.name || '').toLowerCase();
      const bv = (b.name || '').toLowerCase();
      return sortDir * av.localeCompare(bv, 'de', {sensitivity:'base'});
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

function isVideoSource(src) {
  return /^data:video\//i.test(src || '') || /\.(?:mp4|webm|ogg)(?:[?#].*)?$/i.test(src || '');
}

function activeBg() {
  const video = document.getElementById('kdVideo');
  const image = document.getElementById('kdBg');
  return video && !video.hidden ? video : image;
}

function setBg(src) {
  const image = document.getElementById('kdBg');
  const video = document.getElementById('kdVideo');
  if (!image || !video) return;

  if (isVideoSource(src)) {
    image.hidden = true;
    image.src = '';
    video.hidden = false;
    if (video.getAttribute('src') !== src) {
      video.src = src;
      video.load();
    }
    video.play().catch(() => {});
    return;
  }

  video.pause();
  video.hidden = true;
  video.removeAttribute('src');
  video.load();
  image.hidden = false;
  image.src = src || '';
}

function crossfadeBg(src) {
  const bg = activeBg();
  if (!bg) return;
  bg.style.opacity = '0';
  setTimeout(() => {
    setBg(src);
    const next = activeBg();
    if (!next) return;
    next.style.transition = 'none';
    next.style.opacity = '0';
    void next.offsetHeight;
    next.style.transition = '';
    requestAnimationFrame(() => { next.style.opacity = ''; });
  }, 250);
}

function applyPlayerContent(player) {
  const pos = player.position || posFromNum(player.num) || '–';
  set('kdRating', player.num ?? '–');
  set('kdGes',    posLabel(pos));
  set('kdPos',    '');
  set('kdLN', (player.name || '–').toUpperCase());
  set('kdGoals',    player.goals    ?? 0);
  set('kdGames',    player.games    ?? 0);
  set('kdTraining', (player.training ?? 0) + ' %');
}

function showDetail(player) {
  const detail = document.getElementById('kaderDetail');
  if (!detail) return;
  const src = player.detailPhoto || player.photo || '';

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
