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
      api.loadTrackedSchedule().catch(() => api.load('spielplan')),
      api.loadTrackedTeams().catch(() => api.load('vereine')),
    ]);

    const today = localDateKey(new Date());
    const match = spielplan.find(m => m.status === 'next' && !m.result && isInMatchWeek(m.date, today));
    if (!match) return;

    populate(match, vereine);
    populateBanner(match, vereine);
    open();
  } catch {}
}

function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isInMatchWeek(matchDate, today) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(matchDate || '') || !/^\d{4}-\d{2}-\d{2}$/.test(today || '')) return false;
  const matchDay = new Date(`${matchDate}T12:00:00`);
  const monday = new Date(matchDay);
  const daysSinceMonday = (matchDay.getDay() + 6) % 7;
  monday.setDate(matchDay.getDate() - daysSinceMonday);
  return today >= localDateKey(monday) && today <= matchDate;
}

function populateBanner(match, vereine) {
  const banner = document.getElementById('matchdayBanner');
  if (!banner) return;
  const club = globalThis.MatchTrackerTeams.find(vereine, match.opponent);
  const homeBadge = document.getElementById('mdbHomeBadge');
  const awayBadge = document.getElementById('mdbAwayBadgeBanner');
  const ownBadgeHtml = homeBadge?.innerHTML || '';

  const scoreEl = document.getElementById('mdbScore');
  if (scoreEl) {
    scoreEl.textContent = match.result
      ? match.result.replace(':', ' : ')
      : (match.time || '– : –');
  }

  if (match.home) {
    setClubBadge(awayBadge, club, match.opponent);
  } else {
    setClubBadge(homeBadge, club, match.opponent);
    if (awayBadge) {
      awayBadge.innerHTML = ownBadgeHtml;
      awayBadge.style.background = '';
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

  const club = globalThis.MatchTrackerTeams.find(vereine, match.opponent);
  const homeName = document.getElementById('mdHomeName');
  const homeShort = document.getElementById('mdHomeShort');
  const homeBadge = document.getElementById('mdHomeBadge');
  const awayName = document.getElementById('mdAwayName');
  const awayShort = document.getElementById('mdAwayShort');
  const awayBadge = document.getElementById('mdAwayBadge');
  const ownBadgeHtml = homeBadge?.innerHTML || '';

  if (match.home) {
    if (homeName) homeName.textContent = 'SSV Berghausen';
    if (homeShort) homeShort.textContent = 'E-Jugend';
    if (awayName) awayName.textContent = club?.name || match.opponent || 'Gegner';
    if (awayShort) awayShort.textContent = club?.short || '–';
    setClubBadge(awayBadge, club, match.opponent);
  } else {
    if (homeName) homeName.textContent = club?.name || match.opponent || 'Gegner';
    if (homeShort) homeShort.textContent = club?.short || '–';
    setClubBadge(homeBadge, club, match.opponent);
    if (awayName) awayName.textContent = 'SSV Berghausen';
    if (awayShort) awayShort.textContent = 'E-Jugend';
    if (awayBadge) {
      awayBadge.innerHTML = ownBadgeHtml;
      awayBadge.style.background = '';
    }
  }

  const bgOpponent = document.getElementById(match.home ? 'mdBgAway' : 'mdBgHome');
  if (bgOpponent && club?.color1) bgOpponent.style.setProperty('--club-color', club.color1);

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

function setClubBadge(element, club, fallbackName) {
  if (!element) return;
  if (club?.badge) {
    element.innerHTML = `<img src="${club.badge}" alt="${club.name}">`;
    element.style.background = club.color1 || '';
  } else {
    element.textContent = club?.short || (fallbackName || '?').slice(0, 3).toUpperCase();
    element.style.background = club?.color1 || '';
  }
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
