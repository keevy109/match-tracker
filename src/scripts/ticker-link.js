import * as api from './api.js';

const tickerUrl = id => `${import.meta.env.BASE_URL}match-tracker.html?ticker=${encodeURIComponent(id)}`;

// Läuft kein Spiel, teasert die Leiste unter der Navigation das nächste Spiel
// (0:0 und Anstoßzeit); sonst zeigt sie den neuesten Ticker.
async function nextFixtureId(latest) {
  if (latest?.live) return null;
  try {
    const next = (await api.loadTrackedSchedule()).find(item => item.status === 'next');
    return next ? String(next.id) : null;
  } catch { return null; }
}

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
  const teaserId = await nextFixtureId(latest);
  if (!latest && !teaserId) return;

  const url = latest ? tickerUrl(latest.id) : null;
  const navUrl = teaserId ? tickerUrl(teaserId) : url;
  for (const id of ['latestTickerLink', 'navTickerLink']) {
    const link = document.getElementById(id);
    if (!link || !url) continue;
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
  }

  const title = document.getElementById('latestTickerTitle');
  if (title && latest) {
    const pairing = latest.home ? `SSV Berghausen vs. ${latest.opponent}` : `${latest.opponent} vs. SSV Berghausen`;
    title.textContent = `${latest.live ? 'Live' : 'Ticker'} · ${pairing}`;
  }

  const frames = [
    [document.getElementById('latestTickerFrame'), 'feed', url],
    [document.getElementById('navScoreFrame'), 'score-compact&names=1&transparent=1', navUrl],
  ].filter(([frame, , src]) => frame && src);
  const theme = () => document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  const empty = document.getElementById('latestTickerEmpty');
  if (empty && url) empty.hidden = true;
  // Erst sichtbar machen, dann laden: ein verstecktes Iframe lädt sonst nicht zuverlässig.
  for (const [id, src] of [['latestTickerFrame', url], ['navScore', navUrl]]) {
    const el = document.getElementById(id);
    if (el && src) el.hidden = false;
  }
  for (const [frame, format, src] of frames) frame.src = `${src}&embed=${format}&style=${theme()}`;

  // Embeds folgen dem Farbschema der Seite; gleiche Herkunft erlaubt den
  // direkten Umschalter ohne Neuladen, sonst wird die URL neu gesetzt.
  new MutationObserver(() => {
    for (const [frame, format, src] of frames) {
      try { frame.contentDocument.documentElement.dataset.theme = theme(); }
      catch { frame.src = `${src}&embed=${format}&style=${theme()}`; }
    }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}
