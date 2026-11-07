/* Gemeinsame PIN-Sperre für Reporter-Ansicht und Admin. */
(function(root) {
  const PIN = '1909', KEY = 'mt_auth';
  function check() {
    try { if (sessionStorage.getItem(KEY) === '1') return true; } catch (_) {}
    const pin = prompt('Zugang gesperrt. PIN eingeben:');
    if (pin !== PIN) return false;
    try { sessionStorage.setItem(KEY, '1'); } catch (_) {}
    return true;
  }
  function deny() {
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#888;font-family:sans-serif;font-size:18px">Zugang verweigert.</div>';
  }
  root.MatchTrackerAccess = {check, deny};
})(globalThis);
