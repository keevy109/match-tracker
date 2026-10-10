import '../styles/main.css';

import '../../public/ticker-loader.js';
import splashHtml from '../sections/splash.frag?raw';
import navHtml       from '../sections/nav.frag?raw';
import heroHtml      from '../sections/hero.frag?raw';
import tickerHtml    from '../sections/ticker.frag?raw';
import spielplanHtml from '../sections/spielplan.frag?raw';
import kaderHtml     from '../sections/kader.frag?raw';
import aktuellesHtml from '../sections/aktuelles.frag?raw';
import kontaktHtml   from '../sections/kontakt.frag?raw';
import footerHtml    from '../sections/footer.frag?raw';
import modalHtml        from '../sections/news-modal.frag?raw';
import matchdayHtml    from '../sections/matchday-modal.frag?raw';

import brandLogoUrl from '/ssvlogo_white.png';

const clubLogoUrl = `${import.meta.env.BASE_URL}ssvlogo.png`;

import { init as initNews } from './news.js';
import { init as initHero } from './hero.js';
import { init as initTheme }      from './theme.js';
import { init as initSplash } from './splash.js';
import { init as initBackground } from './background.js';
import { init as initNewsModal }  from './news-modal.js';
import { init as initKader }      from './kader.js';
import { init as initSpielplan }  from './spielplan.js';
import { init as initMatchday }   from './matchday.js';

// Theme-Token sofort anwenden (vor dem Rendern)
initTheme();

// HTML-Bausteine in #app einfügen
const app = document.getElementById('app');
const rawHtml = splashHtml + navHtml + heroHtml + tickerHtml + spielplanHtml +
  kaderHtml + aktuellesHtml + kontaktHtml + footerHtml + modalHtml + matchdayHtml;
app.innerHTML = rawHtml
  .replaceAll('/ssvlogo_white.png', brandLogoUrl)
  .replaceAll('/ssvlogo.png', clubLogoUrl);

// Module initialisieren
initBackground();
initNewsModal();
// Erst nach dem Startbildschirm laden und die fertige Webseite einblenden.
document.addEventListener('splashClosed', () => {
  const loading = globalThis.MatchTrackerLoader.start(['site']);
  document.querySelector('.ticker-loading-overlay span').textContent = 'Webseite wird geladen …';
  Promise.allSettled([initNews(), initKader(), initHero(), initSpielplan(), initMatchday()])
    .then(() => loading.ready('site'));
}, { once: true });
initSplash();
