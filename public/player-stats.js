(function(root) {
  function calculate(roster, matches, participants = {}) {
    const list = Object.values(roster || {}).filter(Boolean).map(p => { const {assists, ...rest} = p; return {...rest, goals:0, games:0}; });
    const byId = new Map(list.map(p => [String(p.id), p]));
    Object.entries(matches || {}).forEach(([id, match]) => {
      if (!match || id === 'null') return;
      const side = match.isHomeTeam === false ? 'away' : 'home';
      Object.values(match.events || {}).forEach(event => {
        if ((event.typ || 'tor') !== 'tor' || event.isOwnGoal || event.team !== side) return;
        const player = byId.get(String(event.scorerId));
        if (player) player.goals++;
      });
      const ids = participants[id]?.playerIds || match.participantIds || [];
      new Set(Object.values(ids).map(String)).forEach(id => { const player = byId.get(id); if (player) player.games++; });
    });
    return list;
  }
  root.MatchTrackerStats = {calculate};
})(globalThis);
