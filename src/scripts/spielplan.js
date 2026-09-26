import * as api from './api.js';

function formatDate(dateStr) {
  if (!dateStr) return { day: '–', month: '' };
  const d = new Date(dateStr + 'T00:00:00');
  return {
    day:   d.getDate(),
    month: d.toLocaleDateString('de-DE', { month: 'short' }),
  };
}

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function escAttr(str) {
  return esc(str).replace(/"/g, '&quot;');
}

function teamLabel(name, ownTeam, clubs) {
  const club = ownTeam ? null : globalThis.MatchTrackerTeams.find(clubs, name);
  const logo = ownTeam ? `${import.meta.env.BASE_URL}ssvlogo.png` : club?.badge;
  return `<span class="match-card-team">${logo ? `<img class="match-card-club-logo" src="${escAttr(logo)}" alt="">` : ''}<span>${esc(ownTeam ? 'SSV Berghausen' : (club?.name || name))}</span></span>`;
}

function render(matches, clubs = []) {
  const container = document.querySelector('.match-list');
  if (!container) return;

  const sorted = (matches || []).slice().sort((a, b) =>
    (a.date || '').localeCompare(b.date || ''));

  if (!sorted.length) {
    container.innerHTML = '<div class="kl-empty" style="padding:40px 0;text-align:center">Noch keine Spiele geplant –<br><a href="admin.html">im Admin-Bereich anlegen</a></div>';
    return;
  }

  const total  = sorted.length;
  const played = sorted.filter(m => m.result).length;
  const badge  = document.querySelector('.section-title .placeholder-badge');
  if (badge) badge.textContent = `${played}/${total}`;

  container.innerHTML = sorted.map(m => {
    const { day, month } = formatDate(m.date);
    const isPast   = !!m.result;
    const isNext   = m.status === 'next';
    const isFuture = !isPast && !isNext;

    const ownTeam = teamLabel('SSV Berghausen', true, clubs);
    const opponent = teamLabel(m.opponent, false, clubs);
    const teams = m.home
      ? `${ownTeam}<span class="match-card-versus">vs.</span>${opponent}`
      : `${opponent}<span class="match-card-versus">vs.</span>${ownTeam}`;

    const badgeHtml = !isPast
      ? `<span class="badge ${m.home ? 'badge-home' : 'badge-away'}">${m.home ? 'Heim' : 'Auswärts'}</span>`
      : '';

    const venue = m.home ? (m.venue || 'Sportplatz Berghausen') : 'Auswärtsspiel';
    const meta  = [venue, m.time ? m.time + ' Uhr' : ''].filter(Boolean).join(' · ');

    let rightCol = '';
    if (isPast) {
      const [hs, as] = (m.result || '0:0').split(':').map(Number);
      const won  = m.home ? hs > as : as > hs;
      const draw = hs === as;
      rightCol = `<div class="match-card-result ${draw ? '' : won ? 'win' : 'loss'}">${m.result}</div>`;
    } else if (isNext) {
      rightCol = `<div style="font-family:var(--mono);font-size:11px;color:var(--accent);letter-spacing:0.06em">Nächstes</div>`;
    }

    const styleAttr = isNext
      ? 'border-color:var(--accent);opacity:1'
      : isFuture ? 'opacity:0.6' : '';

    return `<div class="match-card"${styleAttr ? ` style="${styleAttr}"` : ''}>
      <div class="match-card-date"><strong>${day}</strong>${month}</div>
      <div>
        <div class="match-card-teams">${teams} ${badgeHtml}</div>
        <div class="match-card-meta">${meta}</div>
      </div>
      <div style="text-align:right">${rightCol}</div>
    </div>`;
  }).join('');
}

export async function init() {
  let matches = [];
  let clubs = [];
  try {
    matches = await api.loadTrackedSchedule();
  } catch {
    try { matches = await api.load('spielplan'); } catch {
      try { matches = JSON.parse(localStorage.getItem('ssv_spielplan') || '[]'); } catch {}
    }
  }
  try { clubs = await api.loadTrackedTeams(); } catch {}
  render(matches, clubs);
}
