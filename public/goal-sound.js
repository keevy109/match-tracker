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
      error = 'Torsound konnte nicht geladen werden. Verbindung prüfen und Torsound erneut einschalten.';
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
        if (matchId !== null) stop();
        matchId = String(id); seen = new Set(); initialized = false;
      }
      const key = String(event.id);
      if (seen.has(key)) return;
      seen.add(key);
      if (enabled && visible() && eligible(event, data)) void play();
    }
    function observe(id, data) {
      if (String(id) !== matchId) {
        if (matchId !== null) stop();
        matchId = String(id); seen = new Set(); initialized = false;
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
      async setEnabled(value) {
        error = '';
        stop();
        enabled = value;
        notify();
        if (!value) return;
        // Unlock the same media element silently during the user's click.
        // There is no audible test: only a future goal plays the MP3.
        const attempt = generation;
        audio.muted = true;
        try {
          await audio.play();
          if (generation !== attempt) return;
          audio.pause();
          audio.currentTime = 0;
        } catch (_) {
          if (generation !== attempt) return;
          enabled = false;
          error = 'Ton konnte nicht starten. Bitte am Seitenende erneut einschalten.';
        } finally {
          audio.muted = false;
          notify();
        }
      },
      toggle() { return this.setEnabled(!enabled); },
    };
  }
  root.MatchTrackerGoalSound = { create };
  if (!root.document) return;
  const params = new URLSearchParams(location.search);
  if (params.has('embed')) return; // Embedded previews must stay silent.
  const button = document.getElementById('goalSoundToggle');
  const status = document.getElementById('goalSoundStatus');
  if (!button) return;
  button.hidden = false;
  const viewer = params.has('ticker');
  const dev = params.get('dev') === '1';
  const preferenceKey = viewer ? 'mt_goal_sound_viewer' : 'mt_goal_sound_reporter';
  let preference = null;
  try { preference = localStorage.getItem(preferenceKey); } catch (_) {}
  const audio = new Audio(new URL('./audio/tor-fuer-uns.mp3', document.currentScript.src).href);
  audio.preload = 'auto';
  const controller = create({ audio, visible: () => !document.hidden, changed(state) {
    const label = state.enabled ? 'Torsound ausschalten' : 'Torsound einschalten';
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
    button.setAttribute('aria-pressed', String(state.enabled));
    status.textContent = state.error;
  }});
  let resume = null;
  function cancelResume() {
    if (!resume) return;
    document.removeEventListener('pointerdown', resume);
    document.removeEventListener('keydown', resume);
    resume = null;
  }
  function choose(value) {
    cancelResume();
    preference = value ? 'on' : 'off';
    try { localStorage.setItem(preferenceKey, preference); } catch (_) {}
    void controller.setEnabled(value);
  }
  button.onclick = () => choose(button.getAttribute('aria-pressed') !== 'true');
  if (dev || (viewer && preference === null)) {
    const dialog = document.createElement('dialog');
    dialog.className = 'sound-consent';
    dialog.setAttribute('aria-labelledby', 'soundConsentTitle');
    dialog.setAttribute('aria-describedby', 'soundConsentDescription');
    dialog.innerHTML = '<h2 id="soundConsentTitle">Mit Torjubel mitfiebern?</h2><p id="soundConsentDescription">Dürfen bei neuen Toren von SSV Berghausen Torsounds auf diesem Gerät abgespielt werden?</p><p>Du kannst den Ton jederzeit mit dem Lautsprecher-Button <strong>ganz unten am Seitenende, neben dem Hell-/Dunkel-Schalter</strong>, ein- oder ausschalten.</p><div class="sound-consent-actions"><button type="button" data-choice="no" autofocus>Ohne Ton</button><button type="button" data-choice="yes">Torsound erlauben</button></div>';
    document.body.appendChild(dialog);
    function finish(value) {
      choose(value);
      dialog.close();
      button.focus({ preventScroll: true });
    }
    dialog.querySelector('[data-choice="yes"]').onclick = () => finish(true);
    dialog.querySelector('[data-choice="no"]').onclick = () => finish(false);
    dialog.addEventListener('cancel', event => { event.preventDefault(); finish(false); });
    dialog.showModal();
  } else if (preference === 'on') {
    // Browsers can require a fresh gesture after navigation. Restore consent on
    // the next interaction, silently, without showing the first-visit prompt again.
    resume = event => {
      if (event.target instanceof Element && event.target.closest('#goalSoundToggle')) return;
      cancelResume();
      void controller.setEnabled(true);
    };
    document.addEventListener('pointerdown', resume);
    document.addEventListener('keydown', resume);
  }
  root.addEventListener('pagehide', () => { cancelResume(); controller.stop(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) controller.stop(); });
  root.MatchTrackerGoalSound.controller = controller;
})(globalThis);
