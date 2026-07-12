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

function renderKader() {
  const container = document.getElementById('kaderRows');
  const badge     = document.getElementById('kaderCount');
  if (!container) return;

  if (badge) badge.textContent = squad.length ? squad.length + ' Spieler' : '–';

  if (!squad.length) {
    container.innerHTML = '<div class="kl-empty">Noch keine Spieler angelegt –<br><a href="admin.html">im Admin hinzufügen</a></div>';
    return;
  }

  const sorted = squad.slice().sort((a, b) => (a.num || 999) - (b.num || 999));
  container.innerHTML = sorted.map(p => {
    const pos = p.position || posFromNum(p.num);
    const avatar = p.photo
      ? `<div class="kl-avatar"><img src="${p.photo}" alt=""></div>`
      : '<div class="kl-avatar">👤</div>';
    return `<div class="kl-row" data-pid="${p.id}">
      <div class="kl-date"><strong>${p.num ?? '–'}</strong>${pos}</div>
      ${avatar}
      <div class="kl-name">${p.name}</div>
    </div>`;
  }).join('');

  container.querySelectorAll('.kl-row').forEach(row => {
    row.addEventListener('click', () => {
      container.querySelectorAll('.kl-row').forEach(r => r.classList.remove('kl-selected'));
      row.classList.add('kl-selected');
      const pid = parseInt(row.dataset.pid);
      const player = squad.find(p => p.id === pid);
      if (player) showDetail(player);
    });
  });
}

function applyPlayerContent(player) {
  const bg = document.getElementById('kdBg');
  if (bg) bg.src = player.detailPhoto || player.photo || casparUrl;
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

  if (detail.classList.contains('kd-visible')) {
    detail.classList.add('kd-switching');
    setTimeout(() => {
      applyPlayerContent(player);
      detail.classList.remove('kd-trainer', 'kd-switching');
    }, 120);
  } else {
    applyPlayerContent(player);
    detail.classList.remove('kd-trainer');
    detail.classList.add('kd-visible');
    void detail.offsetHeight; // Reflow: zwingt display:block vor der Transition
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
  const bg = document.getElementById('kdBg');
  if (bg) bg.src = t.detailPhoto || t.photo || '';
  set('kdRating', '');
  set('kdGes',    t.role || 'Trainer');
  set('kdLN',     (t.name || '–').toUpperCase());
}

function showTrainerDetail(t) {
  const detail = document.getElementById('kaderDetail');
  if (!detail) return;

  if (detail.classList.contains('kd-visible')) {
    detail.classList.add('kd-switching');
    setTimeout(() => {
      applyTrainerContent(t);
      detail.classList.add('kd-trainer');
      detail.classList.remove('kd-switching');
    }, 120);
  } else {
    applyTrainerContent(t);
    detail.classList.add('kd-visible', 'kd-trainer');
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
}
