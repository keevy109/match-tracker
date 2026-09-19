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
        const result = match?.matchFinished === true
          ? score({home: match.homeScore, away: match.awayScore})
          : null;

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

  function visibleMatches(matches, schedule) {
    const archivedIds = new Set();
    const scheduledIds = new Set();
    Object.entries(schedule || {}).forEach(([key, item]) => {
      if (item && item.archived !== true) {
        scheduledIds.add(String(key));
        if (item.id != null) scheduledIds.add(String(item.id));
      }
      if (item?.archived === true) {
        archivedIds.add(String(key));
        if (item.id != null) archivedIds.add(String(item.id));
      }
    });
    const visible = Object.fromEntries(
      Object.entries(matches || {}).filter(([id]) => scheduledIds.has(String(id)) && !archivedIds.has(String(id))),
    );
    return visible;
  }

  function mergeAdminSchedule(current, items) {
    const existing = current || {};
    const wanted = new Set((items || []).map(item => String(item.id)));
    const updates = {};

    Object.entries(existing).forEach(([key, item]) => {
      if (item && item.archived !== true && !wanted.has(String(item.id ?? key))) {
        updates[key] = {...item, archived:true};
      }
    });

    (items || []).forEach(item => {
      const key = String(item.id);
      const oldKey = Object.keys(existing).find(candidate =>
        String(existing[candidate]?.id ?? candidate) === key);
      const old = oldKey ? existing[oldKey] : {};
      const merged = {
        ...old,
        id:item.id,
        opponent:item.opponent,
        date:item.date || null,
        time:item.time || null,
        isHome:item.home !== false,
        venue:item.venue || null,
        type:item.type || old.type || null,
        archived:false,
      };
      delete merged.home;
      delete merged.status;
      // Results and events belong exclusively to matches/{id}.
      delete merged.result;
      // Appearances belong exclusively to matchParticipants/{id}.
      delete merged.participantIds;
      updates[key] = merged;
    });
    return updates;
  }

  root.MatchTrackerSchedule = {normalize, visibleMatches, mergeAdminSchedule};
})(globalThis);
