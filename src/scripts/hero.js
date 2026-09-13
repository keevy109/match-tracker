import { loadMatchRecords } from './api.js';
export async function init() {
  try {
    const totals = globalThis.MatchTrackerStats.summarizeMatches(await loadMatchRecords());
    document.querySelectorAll('[data-match-stat]').forEach(el => {
      el.textContent = totals[el.dataset.matchStat];
    });
  } catch (error) {
    document.querySelectorAll('[data-match-stat]').forEach(el => {
      el.textContent = '–';
      el.title = 'Spielstatistik konnte nicht geladen werden.';
    });
  }
}
