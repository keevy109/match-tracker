import * as api from './api.js';

// Richtet Button, Navigation und Vorschau auf den neuesten Ticker aus.
export async function init() {
  let latest = null;
  for (let attempt = 0; attempt < 3 && !latest; attempt++) {
    try { latest = await api.loadLatestTicker(); }
    catch (error) {
      console.warn('Letzter Ticker nicht ermittelbar.', error);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  if (!latest) return;

  const url = `${import.meta.env.BASE_URL}match-tracker.html?ticker=${encodeURIComponent(latest.id)}`;
  for (const id of ['latestTickerLink', 'navTickerLink']) {
    const link = document.getElementById(id);
    if (!link) continue;
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
  }

  const title = document.getElementById('latestTickerTitle');
  if (title) {
    const pairing = latest.home ? `SSV Berghausen vs. ${latest.opponent}` : `${latest.opponent} vs. SSV Berghausen`;
    title.textContent = `${latest.live ? 'Live' : 'Ticker'} · ${pairing}`;
  }

  const frames = [
    [document.getElementById('latestTickerFrame'), 'feed'],
    [document.getElementById('navScoreFrame'), 'score-compact&names=1&transparent=1'],
  ].filter(([frame]) => frame);
  const theme = () => document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  const empty = document.getElementById('latestTickerEmpty');
  if (empty) empty.hidden = true;
  // Erst sichtbar machen, dann laden: ein verstecktes Iframe lädt sonst nicht zuverlässig.
  for (const id of ['latestTickerFrame', 'navScore']) {
    const el = document.getElementById(id);
    if (el) el.hidden = false;
  }
  for (const [frame, format] of frames) frame.src = `${url}&embed=${format}&style=${theme()}`;

  // Embeds folgen dem Farbschema der Seite; gleiche Herkunft erlaubt den
  // direkten Umschalter ohne Neuladen, sonst wird die URL neu gesetzt.
  new MutationObserver(() => {
    for (const [frame, format] of frames) {
      try { frame.contentDocument.documentElement.dataset.theme = theme(); }
      catch { frame.src = `${url}&embed=${format}&style=${theme()}`; }
    }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}
