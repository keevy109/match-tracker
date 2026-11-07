export function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

export function init() {
  // Dunkel ist Standard; nur eine ausdrückliche Wahl des Besuchers überschreibt das.
  const saved = localStorage.getItem('theme');
  document.documentElement.setAttribute('data-theme', saved || 'dark');
  window.toggleTheme = toggleTheme;
}
