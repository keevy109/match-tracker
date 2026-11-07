import * as api from './api.js';

// Richtet Button, Navigation und Vorschau auf den neuesten Ticker aus.
export async function init() {
  let latest = null;
  try { latest = await api.loadLatestTicker(); } catch (error) { console.warn('Letzter Ticker nicht ermittelbar.', error); }
  if (!latest) return;

  const url = `${import.meta.env.BASE_URL}match-tracker.html?ticker=${encodeURIComponent(latest.id)}`;
  for (const id of ['latestTickerLink', 'navTickerLink']) {
    const link = document.getElementById(id);
    if (link) link.href = url;
  }

  const title = document.getElementById('latestTickerTitle');
  if (title) {
    const pairing = latest.home ? `SSV Berghausen vs. ${latest.opponent}` : `${latest.opponent} vs. SSV Berghausen`;
    title.textContent = `${latest.live ? 'Live' : 'Ticker'} · ${pairing}`;
  }

  const frame = document.getElementById('latestTickerFrame');
  const empty = document.getElementById('latestTickerEmpty');
  if (frame) { frame.src = `${url}&embed=compact&style=dark`; frame.hidden = false; }
  if (empty) empty.hidden = true;

  const strip = document.getElementById('navScore');
  const stripFrame = document.getElementById('navScoreFrame');
  if (strip && stripFrame) { stripFrame.src = `${url}&embed=score-compact&style=dark`; strip.hidden = false; }
}
