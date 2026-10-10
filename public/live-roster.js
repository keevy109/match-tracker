(function(root) {
  // Read-only subscriptions shared by the reporter and spectator. A roster
  // refresh must never restore, save, stop or reset the active match.
  function subscribe(database, changed, failed = error => console.warn('Kader/Statistik konnte nicht aktualisiert werden.', error)) {
    let roster, matches, schedule;
    const subscriptions = [];
    function publish() {
      if (roster === undefined) return;
      const players = Object.values(roster || {}).filter(Boolean);
      if (matches === undefined || schedule === undefined) {
        changed(players, null, null);
        return;
      }
      const records = root.MatchTrackerSchedule.visibleMatches(matches, schedule);
      const totals = root.MatchTrackerStats.calculate(players, records);
      changed(players.map((player, index) => ({...player, goals:totals[index].goals})), records,
        root.MatchTrackerStats.seasonGoalNumbers(players, records));
    }
    [['app/squad', value => { roster = value; }],
      ['app/schedule', value => { schedule = value; }],
      ['matches', value => { matches = value; }]].forEach(([path, receive]) => {
      const ref = database.ref(path);
      const listener = snapshot => { receive(snapshot.val()); publish(); };
      ref.on('value', listener, failed);
      subscriptions.push(() => ref.off('value', listener));
    });
    return () => subscriptions.forEach(stop => stop());
  }
  root.MatchTrackerLiveRoster = {subscribe};
})(globalThis);
