import * as api from './api.js';

export async function init() {
  const modal = document.getElementById('matchdayModal');
  if (!modal) return;

  document.getElementById('mdClose')?.addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  window.closeMatchdayModal = close;

  if (document.documentElement.classList.contains('splash-open')) {
    document.addEventListener('splashClosed', checkAndOpen, { once: true });
  } else {
    checkAndOpen();
  }
}

async function checkAndOpen() {
  try {
    const [spielplan, vereine] = await Promise.all([
      api.load('spielplan').catch(() => JSON.parse(localStorage.getItem('ssv_spielplan') || '[]')),
      api.load('vereine').catch(()   => JSON.parse(localStorage.getItem('ssv_vereine')   || '[]')),
    ]);

    const today = new Date().toISOString().slice(0, 10);
    const match = spielplan.find(m => m.status === 'next' && m.date === today);
    if (!match) return;

    populate(match, vereine);
    populateBanner(match, vereine);
    open();
  } catch {}
}

function populateBanner(match, vereine) {
  const banner = document.getElementById('matchdayBanner');
  if (!banner) return;

  const scoreEl = document.getElementById('mdbScore');
  if (scoreEl) {
    scoreEl.textContent = match.result
      ? match.result.replace(':', ' : ')
      : (match.time || '– : –');
  }

  const awayBadge = document.getElementById('mdbAwayBadgeBanner');
  if (awayBadge) {
    const club = vereine.find(v => v.name.toLowerCase() === (match.opponent || '').toLowerCase());
    if (club?.badge) {
      awayBadge.innerHTML = `<img src="${club.badge}" alt="${club.name}">`;
      if (club.color1) awayBadge.style.background = club.color1;
    } else {
      awayBadge.textContent = club?.short || (match.opponent || '?').slice(0, 3).toUpperCase();
    }
  }

  const navEl = document.querySelector('.nav');
  if (navEl) banner.style.top = navEl.offsetHeight + 'px';
  banner.classList.add('mdb-visible');
}

function populate(match, vereine) {
  const dt = document.getElementById('mdDatetime');
  if (dt) {
    const d = new Date(match.date + 'T00:00:00');
    const dateStr = d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    dt.textContent = match.time ? dateStr + ' · ' + match.time + ' Uhr' : dateStr;
  }

  const awayName  = document.getElementById('mdAwayName');
  const awayShort = document.getElementById('mdAwayShort');
  const awayBadge = document.getElementById('mdAwayBadge');
  if (awayName) awayName.textContent = match.opponent || 'Gegner';

  const club = vereine.find(v =>
    v.name.toLowerCase() === (match.opponent || '').toLowerCase()
  );
  if (club) {
    if (awayShort) awayShort.textContent = club.short || '–';
    if (awayBadge) {
      awayBadge.innerHTML = club.badge
        ? `<img src="${club.badge}" alt="${club.name}">`
        : (club.short || match.opponent?.slice(0, 3) || '?');
      awayBadge.style.background = club.color1 || '';
    }
    const bgAway = document.getElementById('mdBgAway');
    if (bgAway && club.color1) bgAway.style.setProperty('--club-color', club.color1);
  } else {
    if (awayShort) awayShort.textContent = '–';
  }

  const venue = document.getElementById('mdVenueLine');
  if (venue) {
    const loc = match.home
      ? (match.venue || 'Sportplatz Berghausen')
      : ('Auswärtsspiel · ' + (match.venue || match.opponent));
    venue.textContent = '📍 ' + loc;
  }

  const eyebrow = document.getElementById('mdEyebrow');
  if (eyebrow) eyebrow.textContent = match.home ? 'Heimspiel · Saison 2026/27' : 'Auswärtsspiel · Saison 2026/27';
}

function open() {
  const modal = document.getElementById('matchdayModal');
  if (!modal) return;
  modal.classList.add('md-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function close() {
  const modal = document.getElementById('matchdayModal');
  if (!modal) return;
  modal.classList.remove('md-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
