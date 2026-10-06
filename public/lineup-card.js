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
    const arrow = '<svg viewBox="0 0 52 24" aria-hidden="true"><path d="M14 4 6 12 14 20 M30 4 22 12 30 20 M46 4 38 12 46 20"/></svg>';
    card.innerHTML = `<div class="lineup-heading"><h2>Aufstellung</h2><div class="lineup-navigation" hidden><button type="button" class="lineup-prev" aria-label="Vorherige Spieler">${arrow}</button><button type="button" class="lineup-next" aria-label="Weitere Spieler">${arrow}</button></div></div><div class="lineup-viewport" tabindex="0" aria-label="Aufstellung – Spieler durch Wischen ansehen"><div class="lineup-track lineup-intro" style="--lineup-duration:${Math.max(14,players.length * 3 + 6)}s">${players.map(player => `<figure class="lineup-player"><figcaption><strong>${escape(player.name)}</strong></figcaption>${player.photo ? `<img src="${escape(player.photo)}" alt="" loading="eager">` : '<span class="lineup-placeholder" aria-hidden="true">👤</span>'}</figure>`).join('')}</div></div>`;
    const viewport = card.querySelector('.lineup-viewport');
    const track = card.querySelector('.lineup-track');
    const navigation = card.querySelector('.lineup-navigation');
    const enableSwipe = (reset = false) => {
      if (!track.classList.contains('lineup-intro')) return;
      const offset = Math.max(0, viewport.getBoundingClientRect().left - track.getBoundingClientRect().left);
      track.classList.remove('lineup-intro');
      viewport.scrollLeft = reset ? 0 : offset;
      navigation.hidden = false;
    };
    for (const [selector, direction] of [['.lineup-prev', -1], ['.lineup-next', 1]]) {
      card.querySelector(selector).addEventListener('click', () => {
        viewport.scrollBy({left: direction * Math.max(152, viewport.clientWidth * 0.8), behavior: root.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
      });
    }
    if (root.matchMedia?.('(prefers-reduced-motion: reduce)').matches) enableSwipe(true);
    track.addEventListener('animationend', () => enableSwipe(true), {once:true});
    viewport.addEventListener('pointerdown', () => enableSwipe(), {passive:true});
    viewport.addEventListener('wheel', () => enableSwipe(), {passive:true});
    viewport.addEventListener('keydown', () => enableSwipe());
  }
  const cards = new WeakMap();
  function mount(list, members, ids, publishedAt, matchId) {
    if (!list) return;
    let saved = cards.get(list);
    if (saved && saved.matchId !== String(matchId)) { saved.card.remove(); saved = null; }
    if (!publishedAt || !selectedPlayers(members, ids).length) {
      saved?.card.remove();
      cards.delete(list);
      return;
    }
    if (!saved) {
      const card = document.createElement('section');
      card.className = 'lineup-card';
      card.setAttribute('aria-label', 'Aufstellung');
      saved = {card, matchId:String(matchId)};
      cards.set(list, saved);
    }
    const card = saved.card;
    render(card, members, ids);
    card.dataset.eventId = String(publishedAt);
    card.dataset.type = 'aufstellung';
    list.querySelector('.empty-state')?.remove();
    const before = Array.from(list.children).find(item => item !== card && Number(item.dataset.eventId) < Number(publishedAt));
    list.insertBefore(card, before || null);
  }
  root.MatchTrackerLineup = {position, selectedPlayers, render, mount};
})(globalThis);
