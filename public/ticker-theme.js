(function() {
  const button = document.getElementById('themeToggle');
  if (!button) return;
  function update() {
    const dark = document.documentElement.dataset.theme === 'dark';
    const label = dark ? 'Lightmode aktivieren' : 'Darkmode aktivieren';
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', label);
    button.title = label;
  }
  button.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('matchtracker_theme', theme); } catch (_) {}
    update();
  });
  update();
})();
