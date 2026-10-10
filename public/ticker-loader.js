(function(root) {
  function start(required) {
    const pending = new Set(required);
    const overlay = document.createElement('div');
    overlay.className = 'ticker-loading-overlay';
    overlay.setAttribute('role', 'status');
    overlay.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M51 19A23 23 0 1 0 55 36"/><path d="M42 18l11 3 2-12"/></svg><span>Spiel wird geladen …</span><button hidden>Erneut laden</button>';
    overlay.querySelector('button').onclick = () => location.reload();
    document.body.appendChild(overlay);
    document.body.classList.add('ticker-loading');
    let finished = false, revealing = false;
    const timeout = setTimeout(() => fail('Das Laden dauert länger. Bitte Verbindung prüfen.'), 15000);
    function fail(message = 'Der Ticker konnte nicht vollständig geladen werden.') {
      if (finished) return;
      overlay.querySelector('span').textContent = message;
      overlay.querySelector('button').hidden = false;
    }
    async function ready(key) {
      pending.delete(key);
      if (pending.size || finished || revealing) return;
      revealing = true;
      // Decode crests before revealing their final layout; failed assets cannot
      // leave the ticker blocked indefinitely.
      await Promise.all(Array.from(document.querySelectorAll('.feed-result-logo')).map(img =>
        !img.getAttribute('src') ? Promise.resolve() : Promise.race([
          img.decode().catch(() => {}), new Promise(resolve => setTimeout(resolve, 5000))
        ])));
      finished = true; clearTimeout(timeout);
      document.body.classList.remove('ticker-loading');
      document.body.classList.add('ticker-loaded');
      overlay.remove();
    }
    return {ready, fail};
  }
  root.MatchTrackerLoader = {start};
})(globalThis);
