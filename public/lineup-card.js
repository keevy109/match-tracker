(function(root) {
  const list = value => Array.isArray(value) ? value.filter(Boolean) : Object.values(value || {}).filter(Boolean);
  function position(player) {
    const value = String(player.position || '').trim().toUpperCase();
    return ({TW:'TW',TORWART:'TW',AB:'ABW',ABW:'ABW',ABWEHR:'ABW',MF:'MIT',MIT:'MIT',MITTELFELD:'MIT',ST:'ST',STURM:'ST'})[value] || 'Ohne Position';
  }
  function selectedPlayers(members, ids) {
    const selected = new Set(list(ids).map(String));
    const order = ['TW','ABW','MIT','ST','Ohne Position'];
    return list(members).filter(player => selected.has(String(player.id))).sort((a,b) =>
      order.indexOf(position(a)) - order.indexOf(position(b)) || String(a.name || '').localeCompare(String(b.name || ''), 'de'));
  }
  const escape = value => String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function render(card, members, ids) {
    if (!card) return;
    const players = selectedPlayers(members, ids);
    const signature = JSON.stringify(players.map(p => [p.id,p.name,p.photo,position(p)]));
    if (card.dataset.lineup === signature) return;
    card.dataset.lineup = signature;
    card.hidden = !players.length;
    card.innerHTML = '';
    if (!players.length) return;
    card.innerHTML = `<h2>Aufstellung <small>${players.length} Spieler</small></h2><div class="lineup-viewport" tabindex="0" aria-label="Aufstellung – Spieler durch Wischen ansehen"><div class="lineup-track lineup-intro" style="--lineup-duration:${Math.max(14,players.length * 3 + 6)}s">${players.map(player => `<figure class="lineup-player"><figcaption><strong>${escape(player.name)}</strong></figcaption>${player.photo ? `<img src="${escape(player.photo)}" alt="" loading="eager">` : '<span class="lineup-placeholder" aria-hidden="true">👤</span>'}</figure>`).join('')}</div></div>`;
    const viewport = card.querySelector('.lineup-viewport');
    const track = card.querySelector('.lineup-track');
    const enableSwipe = (reset = false) => {
      if (!track.classList.contains('lineup-intro')) return;
      const offset = Math.max(0, viewport.getBoundingClientRect().left - track.getBoundingClientRect().left);
      track.classList.remove('lineup-intro');
      viewport.scrollLeft = reset ? 0 : offset;
    };
    track.addEventListener('animationend', () => enableSwipe(true), {once:true});
    viewport.addEventListener('pointerdown', () => enableSwipe(), {passive:true});
    viewport.addEventListener('wheel', () => enableSwipe(), {passive:true});
    viewport.addEventListener('keydown', () => enableSwipe());
  }
  root.MatchTrackerLineup = {position, selectedPlayers, render};
})(globalThis);
