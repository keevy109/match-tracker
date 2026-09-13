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
  function summarizeMatches(matches) {
    const totals = {played:0, scored:0, conceded:0, wins:0, losses:0};
    Object.entries(matches || {}).forEach(([id, match]) => {
      if (id === 'null' || match?.matchFinished !== true) return;
      const home = match.homeScore, away = match.awayScore;
      if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0) return;
      const scored = match.isHomeTeam === false ? away : home;
      const conceded = match.isHomeTeam === false ? home : away;
      totals.played++; totals.scored += scored; totals.conceded += conceded;
      if (scored > conceded) totals.wins++;
      if (scored < conceded) totals.losses++;
    });
    return totals;
  }
  root.MatchTrackerStats = {calculate, summarizeMatches};
})(globalThis);
