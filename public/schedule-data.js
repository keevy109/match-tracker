(function(root) {
  function score(result) {
    if (!result || !Number.isInteger(result.home) || !Number.isInteger(result.away)) return null;
    return `${result.home}:${result.away}`;
  }

  function normalize(schedule, matches, today) {
    const matchRecords = matches || {};
    const items = Object.entries(schedule || {})
      .filter(([, item]) => item && item.archived !== true)
      .map(([key, item]) => {
        const id = item.id ?? key;
        const match = matchRecords[String(id)];
        const finished = match?.matchFinished === true;
        const result = finished
          ? score({home: match.homeScore, away: match.awayScore})
          : (!match ? (typeof item.result === 'string' ? item.result : score(item.result)) : null);

        return {
          ...item,
          id,
          home: typeof item.home === 'boolean' ? item.home : item.isHome !== false,
          result,
          status: result ? 'past' : 'future',
        };
      });

    const next = items
      .filter(item => !item.result && (!item.date || item.date >= today))
      .sort((a, b) => `${a.date || ''}T${a.time || ''}`.localeCompare(`${b.date || ''}T${b.time || ''}`))[0];
    if (next) next.status = 'next';
    return items;
  }

  root.MatchTrackerSchedule = {normalize};
})(globalThis);
