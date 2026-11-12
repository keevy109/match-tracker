import '../styles/main.css';

import '../../public/ticker-loader.js';
import splashHtml from '../sections/splash.frag?raw';
import navHtml       from '../sections/nav.frag?raw';
import heroHtml      from '../sections/hero.frag?raw';
import tickerHtml    from '../sections/ticker.frag?raw';
import spielplanHtml from '../sections/spielplan.frag?raw';
import kaderHtml     from '../sections/kader.frag?raw';
import aktuellesHtml from '../sections/aktuelles.frag?raw';
import footerHtml    from '../sections/footer.frag?raw';
import modalHtml        from '../sections/news-modal.frag?raw';
import matchdayHtml    from '../sections/matchday-modal.frag?raw';

import brandLogoUrl from '/ssvlogo_white.png';

const clubLogoUrl = `${import.meta.env.BASE_URL}ssvlogo.webp`;

import { init as initNews } from './news.js';
import { init as initHero } from './hero.js';
import { init as initTheme }      from './theme.js';
import { init as initSplash } from './splash.js';
import { init as initBackground } from './background.js';
import { init as initNewsModal }  from './news-modal.js';
import { init as initKader }      from './kader.js';
import { init as initSpielplan }  from './spielplan.js';
import { init as initMatchday }   from './matchday.js';
import { init as initTickerLink } from './ticker-link.js';

// Theme-Token sofort anwenden (vor dem Rendern)
initTheme();

// HTML-Bausteine in #app einfügen
const app = document.getElementById('app');
const rawHtml = splashHtml + navHtml + heroHtml + tickerHtml + spielplanHtml +
  kaderHtml + aktuellesHtml + footerHtml + modalHtml + matchdayHtml;
app.innerHTML = rawHtml
  .replaceAll('/ssvlogo_white.png', brandLogoUrl)
  .replaceAll('/ssvlogo.webp', clubLogoUrl)
  .replaceAll('{{BUILD_VERSION}}', import.meta.env.VITE_BUILD_VERSION || '2.5.6');

// Module initialisieren
initBackground();
initNewsModal();
initSplash();

// Navi-Höhe als CSS-Variable: Bezugspunkt für sticky Elemente und Ankersprünge,
// die Spielstand-Leiste macht die Navigation nachträglich höher.
const nav = document.querySelector('.nav');
const publishNavHeight = () => document.documentElement.style.setProperty('--nav-height', nav.offsetHeight + 'px');
publishNavHeight();
if (typeof ResizeObserver === 'function') new ResizeObserver(publishNavHeight).observe(nav);
// Erst laden, dann den Splash zeigen: dahinter steht die Seite schon fertig.
const loading = globalThis.MatchTrackerLoader.start(['site']);
document.querySelector('.ticker-loading-overlay span').textContent = 'Webseite wird geladen …';
Promise.allSettled([initNews(), initKader(), initHero(), initSpielplan(), initMatchday(), initTickerLink()])
  .then(() => loading.ready('site'));
