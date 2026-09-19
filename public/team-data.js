(function(root) {
  function list(value) {
    return Array.isArray(value) ? value.filter(Boolean) : Object.values(value || {}).filter(Boolean);
  }

  function color(value, fallback = '#333333') {
    if (/^#[0-9a-f]{6}$/i.test(value || '')) return value;
    const rgb = String(value || '').match(/\d+/g)?.slice(0, 3).map(Number);
    if (rgb?.length === 3) {
      return '#' + rgb.map(part => Math.max(0, Math.min(255, part)).toString(16).padStart(2, '0')).join('');
    }
    return fallback;
  }

  function normalize(teams) {
    return list(teams).filter(team => !team.isOurTeam).map(team => ({
      ...team,
      badge:team.badge || team.logo || '',
      color1:color(team.color1 || team.color),
      color2:color(team.color2, '#ffffff'),
    }));
  }

  function merge(current, clubs) {
    const previous = list(current);
    const ownTeams = previous.filter(team => team.isOurTeam);
    const opponents = (clubs || []).map(club => {
      const old = previous.find(team => String(team.id) === String(club.id)) ||
        previous.find(team => !team.isOurTeam && team.name === club.name) || {};
      const badge = club.badge || old.badge || old.logo || '';
      const primary = color(club.color1 || old.color1 || old.color);
      return {
        ...old,
        ...club,
        logo:badge,
        badge,
        color:primary,
        color1:primary,
        color2:color(club.color2 || old.color2, '#ffffff'),
        isOurTeam:false,
      };
    });
    return [...ownTeams, ...opponents];
  }

  root.MatchTrackerTeams = {normalize, merge};
})(globalThis);
