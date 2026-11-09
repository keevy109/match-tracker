(function (root) {
  // A controller belongs to one page: spectator and reporter opt in independently.
  function create({ audio, now = Date.now, visible = () => true, changed = () => {} }) {
    let enabled = false, playing = false, error = '', generation = 0;
    let matchId = null, seen = new Set(), initialized = false;
    const notify = () => changed({ enabled, playing, error });
    function stop() {
      generation++;
      audio.pause();
      audio.currentTime = 0;
      playing = false;
      notify();
    }
    async function play() {
      stop();
      const attempt = generation;
      error = '';
      try {
        // Called synchronously from the activation/test click to unlock browser audio.
        await audio.play();
        if (generation !== attempt) return;
        playing = true;
        notify();
      } catch (_) {
        if (generation !== attempt) return;
        enabled = false;
        error = 'Ton konnte nicht starten. Audioausgabe prüfen und erneut aktivieren.';
        notify();
      }
    }
    audio.addEventListener('ended', () => { playing = false; notify(); });
    audio.addEventListener('error', () => {
      enabled = false; playing = false;
      error = 'Torsound konnte nicht geladen werden. Verbindung prüfen und erneut testen.';
      notify();
    });
    function eligible(event, data) {
      const side = data.isHomeTeam === false ? 'away' : 'home';
      const name = data[side + 'Team'] || '';
      const age = now() - Number(event.id);
      return (event.typ || 'tor') === 'tor' && event.team === side &&
        /berghausen/i.test(name) && Number.isFinite(age) && age >= -5000 && age <= 30000 &&
        !data.matchFinished && !data.abandoned;
    }
    function goal(id, event, data) {
      if (String(id) !== matchId) {
        stop(); matchId = String(id); seen = new Set(); initialized = false;
      }
      const key = String(event.id);
      if (seen.has(key)) return;
      seen.add(key);
      if (enabled && visible() && eligible(event, data)) void play();
    }
    function observe(id, data) {
      if (String(id) !== matchId) {
        stop(); matchId = String(id); seen = new Set(); initialized = false;
      }
      const entries = Object.values(data.events || {}).filter(e => e && e.id != null);
      if (!initialized) {
        entries.forEach(e => seen.add(String(e.id)));
        initialized = true;
        return;
      }
      // All snapshots update the baseline, even while sound is off or tab is hidden.
      entries.sort((a, b) => Number(a.id) - Number(b.id)).forEach(e => goal(id, e, data));
    }
    return {
      observe, goal, stop,
      toggle() { enabled = !enabled; error = ''; if (enabled) void play(); else stop(); notify(); },
      test() { void play(); },
    };
  }
  root.MatchTrackerGoalSound = { create };
  if (!root.document) return;
  const params = new URLSearchParams(location.search);
  if (params.has('embed')) return; // Embedded previews must stay silent.
  const host = document.getElementById('goalSoundControls');
  if (!host) return;
  const viewer = params.has('ticker');
  host.innerHTML = '<strong>Torsound · Berghausen</strong><div class="goal-sound-actions"><button type="button" data-sound="toggle" aria-pressed="false"></button><button type="button" data-sound="test">Testen</button><button type="button" data-sound="stop" disabled>Stoppen</button></div><p></p><span role="status" aria-live="polite"></span>';
  const toggle = host.querySelector('[data-sound="toggle"]');
  const stop = host.querySelector('[data-sound="stop"]');
  host.querySelector('p').textContent = viewer
    ? 'Nach Aktivierung erklingen neue Berghausener Tore auf diesem Gerät. Ticker geöffnet lassen.'
    : 'Ton auf diesem Gerät aktivieren und testen. Neue Berghausener Tore erklingen nach erfolgreicher Übertragung.';
  const audio = new Audio(new URL('./audio/tor-fuer-uns.mp3', document.currentScript.src).href);
  audio.preload = 'auto';
  const controller = create({ audio, visible: () => !document.hidden, changed(state) {
    toggle.textContent = state.enabled ? 'Torsound ausschalten' : viewer ? 'Torsound aktivieren' : 'Torsound am Eintragungsgerät aktivieren';
    toggle.setAttribute('aria-pressed', String(state.enabled));
    stop.disabled = !state.playing;
    host.querySelector('[role="status"]').textContent = state.error || (state.enabled ? 'Aktiv · nur auf diesem Gerät' : 'Aus');
  }});
  toggle.onclick = controller.toggle;
  stop.onclick = controller.stop;
  host.querySelector('[data-sound="test"]').onclick = controller.test;
  toggle.textContent = viewer ? 'Torsound aktivieren' : 'Torsound am Eintragungsgerät aktivieren';
  root.addEventListener('pagehide', controller.stop);
  root.document.addEventListener('visibilitychange', () => { if (document.hidden) controller.stop(); });
  root.MatchTrackerGoalSound.controller = controller;
})(globalThis);
