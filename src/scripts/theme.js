export function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

export function init() {
  const saved = localStorage.getItem('theme');
  document.documentElement.setAttribute('data-theme',
    saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  window.toggleTheme = toggleTheme;
}
