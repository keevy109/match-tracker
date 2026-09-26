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

  function canonicalName(value) {
    const tokens = String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('de')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    while (tokens.length > 1 && /^(?:[ivx]{1,4}|[a-g]\d+|u\d+|\d{4}|\d)$/i.test(tokens[tokens.length - 1])) {
      tokens.pop();
    }
    return tokens.join(' ');
  }

  function find(teams, name) {
    const candidates = list(teams);
    const exact = String(name || '').trim().toLocaleLowerCase('de');
    const direct = candidates.find(team => String(team.name || '').trim().toLocaleLowerCase('de') === exact);
    if (direct) return direct;
    const wanted = canonicalName(name);
    if (!wanted) return undefined;
    return candidates.find(team => {
      const candidate = canonicalName(team.name);
      return candidate === wanted ||
        (candidate.length >= 5 && wanted.endsWith(` ${candidate}`)) ||
        (wanted.length >= 5 && candidate.endsWith(` ${wanted}`));
    });
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

  root.MatchTrackerTeams = {normalize, merge, canonicalName, find};
})(globalThis);
