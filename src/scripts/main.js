import '../styles/main.css';

import splashHtml    from '../sections/splash.frag?raw';
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

import logoUrl from '/ssvlogo_white.png';

import { init as initTheme }      from './theme.js';
import { init as initBackground } from './background.js';
import { init as initSplash }     from './splash.js';
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
app.innerHTML = rawHtml.replaceAll('/ssvlogo_white.png', logoUrl);

// Module initialisieren
initBackground();
initSplash();
initNewsModal();
initKader();
initSpielplan();
initMatchday();
