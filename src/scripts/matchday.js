import '@fontsource/anton/400.css';
import * as api from './api.js';

const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
let sparks = null;

export async function init() {
  const modal = document.getElementById('matchdayModal');
  if (!modal) return;

  document.getElementById('mdClose')?.addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  window.closeMatchdayModal = close;

  if (document.documentElement.classList.contains('splash-open')) {
    document.addEventListener('splashClosed', checkAndOpen, { once: true });
  } else {
    return checkAndOpen();
  }
}

async function checkAndOpen() {
  try {
    const [spielplan, vereine] = await Promise.all([
      api.loadTrackedSchedule().catch(() => api.load('spielplan')),
      api.loadTrackedTeams().catch(() => api.load('vereine')),
    ]);

    // Nur lokal: ?matchday=<id> zeigt ein beliebiges Spiel als Vorschau.
    const preview = import.meta.env.DEV ? new URLSearchParams(location.search).get('matchday') : null;
    const today = localDateKey(new Date());
    const match = preview
      ? spielplan.find(m => String(m.id) === preview)
      : spielplan.find(m => m.status === 'next' && !m.result && isInMatchWeek(m.date, today));
    if (!match) return;

    populate(match, vereine, spielplan);
    open();
  } catch {}
}

function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isInMatchWeek(matchDate, today) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(matchDate || '') || !/^\d{4}-\d{2}-\d{2}$/.test(today || '')) return false;
  const matchDay = new Date(`${matchDate}T12:00:00`);
  const monday = new Date(matchDay);
  const daysSinceMonday = (matchDay.getDay() + 6) % 7;
  monday.setDate(matchDay.getDate() - daysSinceMonday);
  return today >= localDateKey(monday) && today <= matchDate;
}

function isFriendly(match) { return /test|freundschaft/i.test(match?.type || ''); }

// „4. Saisonspiel“: Pflichtspiele bis einschließlich dieses Spiels; Testspiele zählen nicht.
function eyebrowText(match, spielplan) {
  if (isFriendly(match)) return 'Testspiel';
  const key = m => `${m.date || '9999-12-31'}T${m.time || '23:59'}`;
  const number = (spielplan || []).filter(m => m && !m.archived && !isFriendly(m) && key(m) <= key(match)).length;
  return number ? `${number}. Saisonspiel` : 'Saisonspiel';
}

// „Heute“ bzw. „Morgen“, wenn es zutrifft; sonst Wochentag und Datum.
function dateText(match, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(match.date || '')) return '';
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  if (match.date === localDateKey(now)) return 'Heute';
  if (match.date === localDateKey(tomorrow)) return 'Morgen';
  const d = new Date(match.date + 'T12:00:00');
  return `${WEEKDAYS[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`;
}

function populate(match, vereine, spielplan) {
  const club = globalThis.MatchTrackerTeams.find(vereine, match.opponent);
  const ownBadge = document.getElementById('mdHomeBadge')?.querySelector('img')?.getAttribute('src') || '';
  const opponent = club?.name || match.opponent || 'Gegner';
  const sides = match.home
    ? {home: {name:'SSV Berghausen', badge:ownBadge, club:null}, away: {name:opponent, badge:club?.badge, club, fallback:match.opponent}}
    : {home: {name:opponent, badge:club?.badge, club, fallback:match.opponent}, away: {name:'SSV Berghausen', badge:ownBadge, club:null}};

  for (const [side, data] of Object.entries(sides)) {
    const suffix = side === 'home' ? 'Home' : 'Away';
    setText(`md${suffix}Name`, data.name);
    // Funken sprühen nur am eigenen Wappen.
    document.getElementById(`md${suffix}Crest`)?.toggleAttribute('data-own', !data.club && data.name === 'SSV Berghausen');
    setCrest(document.getElementById(`md${suffix}Crest`), document.getElementById(`md${suffix}Badge`), data);
  }

  setText('mdEyebrow', eyebrowText(match, spielplan));
  setText('mdTitle', match.home ? 'Heimspiel' : 'Auswärtsspiel');
  setText('mdDatetime', dateText(match));
  setText('mdKickoff', match.time ? `Anstoß: ${match.time.slice(0, 5)} Uhr` : '');

  const loc = match.home ? (match.venue || 'Sportplatz Berghausen') : (match.venue || '');
  setText('mdVenueLine', loc ? '📍 ' + loc : '');
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// Wappenbild plus Glutrand/Glanz als CSS-Variable; ohne Bild bleibt das Kürzel.
function setCrest(crest, badge, {name, badge: image, club, fallback}) {
  if (!crest || !badge) return;
  if (image) {
    badge.replaceChildren(Object.assign(document.createElement('img'), {src:image, alt:name}));
    crest.style.setProperty('--md-crest-image', `url("${image}")`);
    crest.dataset.image = '1';
  } else {
    badge.textContent = club?.short || (fallback || name || '?').slice(0, 3).toUpperCase();
    crest.style.removeProperty('--md-crest-image');
    delete crest.dataset.image;
  }
}

function open() {
  const modal = document.getElementById('matchdayModal');
  if (!modal) return;
  modal.classList.add('md-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    sparks = startSparks(document.getElementById('mdSparks'), [...modal.querySelectorAll('.md-crest[data-own] .md-crest-float')]);
  }
}

function close() {
  const modal = document.getElementById('matchdayModal');
  if (!modal) return;
  modal.classList.remove('md-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  sparks?.stop(); sparks = null;
}

// Funken steigen vom Rand des Berghausener Wappens auf.
function startSparks(canvas, crests) {
  if (!canvas?.getContext) return null;
  const ctx = canvas.getContext('2d');
  const particles = [];
  let frame = 0, last = performance.now(), width = 0, height = 0, ratio = 1;
  function resize() {
    ratio = Math.min(devicePixelRatio || 1, 2);
    width = canvas.clientWidth; height = canvas.clientHeight;
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  }
  resize();
  addEventListener('resize', resize);

  function spawn(rect) {
    // Punkt auf einer Ellipse um das Wappen, eher an Seiten und Oberkante.
    const angle = Math.random() * Math.PI * 2;
    const x = rect.left + rect.width / 2 + Math.cos(angle) * rect.width * 0.46;
    const y = rect.top + rect.height / 2 + Math.sin(angle) * rect.height * 0.46;
    particles.push({x, y, vx: (Math.random() - 0.5) * 40 + Math.cos(angle) * 18, vy: -40 - Math.random() * 90,
      life: 0, max: 0.9 + Math.random() * 1.6, size: 0.8 + Math.random() * 2.2, wobble: Math.random() * 6});
  }
  // Glühpunkt einmal vorrendern; shadowBlur pro Partikel und Frame ruckelt auf Mobilgeräten.
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = 32;
  const sctx = sprite.getContext('2d');
  const glow = sctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  glow.addColorStop(0, 'rgba(255,240,200,1)');
  glow.addColorStop(0.25, 'rgba(255,170,60,0.9)');
  glow.addColorStop(0.6, 'rgba(255,90,10,0.25)');
  glow.addColorStop(1, 'rgba(255,60,0,0)');
  sctx.fillStyle = glow;
  sctx.fillRect(0, 0, 32, 32);
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const rects = crests.map(el => el.getBoundingClientRect()).filter(r => r.width);
    for (const rect of rects) for (let i = 0; i < 2; i++) if (Math.random() < 0.6) spawn(rect);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      const t = p.life / p.max;
      if (t >= 1 || particles.length > 240) { particles.splice(i, 1); continue; }
      p.vx += Math.sin((p.life + p.wobble) * 5) * 18 * dt;
      p.vy -= 12 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      const r = p.size * (1 - t * 0.5) * 3;
      ctx.globalAlpha = (1 - t) * 0.95;
      ctx.drawImage(sprite, p.x - r, p.y - r, r * 2, r * 2);
    }
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
  const pause = () => { if (document.hidden) { cancelAnimationFrame(frame); } else { last = performance.now(); frame = requestAnimationFrame(tick); } };
  document.addEventListener('visibilitychange', pause);
  return {
    stop() {
      cancelAnimationFrame(frame);
      removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', pause);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}
