/* Presentation only. All mutations go through the existing tracker commands. */
(function(){
 document.addEventListener('DOMContentLoaded',()=>{
  if(new URLSearchParams(location.search).has('ticker'))return;
  const anonymous=new URLSearchParams(location.search).get('scoreboard')==='guest';
  const host=document.createElement('section');host.id='touchScoreboard';host.hidden=true;
  host.innerHTML='<header><strong>Scoreboard</strong><span id="touchStatus" role="status"></span><button id="touchFull">Vollbild</button><button id="touchExit">Zum Ticker</button></header><form id="touchSetup"><h1>Bereit zum Anpfiff?</h1><label id="touchHomeLabel">Deine Mannschaft<input id="touchHome" maxlength="80" placeholder="Heimmannschaft"></label><label>Gegner<input id="touchOpponent" required maxlength="80" placeholder="Gastmannschaft"></label><label>Spielzeit gesamt (Minuten)<input id="touchDuration" type="number" min="2" max="240" step="2" value="50" required></label><button>Spiel anlegen</button></form><div id="touchGame"><div class="touch-teams"><button data-side="home"><img class="touch-crest" alt="" hidden><span class="touch-name"></span><strong class="touch-score"></strong><small>Antippen · +1 Tor</small></button><button data-side="away"><img class="touch-crest" alt="" hidden><span class="touch-name"></span><strong class="touch-score"></strong><small>Antippen · +1 Tor</small></button></div><footer><button id="touchUndo">↶ Letztes Tor</button><button id="touchClock"></button><button id="touchPeriod">Abschnitt beenden</button><button id="touchEnd">Abpfiff</button></footer></div>';
  document.body.append(host);
  document.getElementById('touchHomeLabel').hidden=!anonymous;
  document.getElementById('touchHome').required=anonymous;
  if(anonymous){document.getElementById('touchExit').textContent='Spiel verwerfen';host.querySelector('header strong').textContent='Scoreboard · ohne Anmeldung';}

  let lastTap=0,previousFocus;
  let inertBackground=[];
  const api=window.TrackerScoreboard;
  function draw(){
   if(host.hidden)return;
   const d=api.read();
   document.getElementById('touchSetup').hidden=!!d.active;
   document.getElementById('touchGame').hidden=!d.active;
   document.getElementById('touchStatus').textContent=d.ready?(d.anonymous?'Nur in diesem Browser · 24 Stunden gespeichert':d.dev?'Lokales Testspiel':''):'Daten werden geladen …';
   host.querySelectorAll('[data-side]').forEach(b=>{const side=b.dataset.side;b.querySelector('.touch-name').textContent=d[side];b.querySelector('.touch-score').textContent=d.score[side];const crest=b.querySelector('.touch-crest'),logo=d.logos[side]||'';
    if(crest.getAttribute('src')!==logo){if(logo)crest.src=logo;else crest.removeAttribute('src');}
    crest.hidden=!logo;
    b.style.setProperty('--score-width', (88/Math.max(1,String(d.score[side]).length))+'cqw');
    b.style.setProperty('--team-color',d.colors[side]||'#193a31');b.disabled=!d.active||!d.ready;});
   document.getElementById('touchClock').textContent=(d.running?'Ⅱ Pause':'▶ Start')+' · '+d.clock;
   document.getElementById('touchUndo').disabled=!d.canUndo||!d.ready;
   document.getElementById('touchPeriod').hidden=!d.canNext;
  }
  function open(){if(!host.hidden)return;previousFocus=document.activeElement;inertBackground=[...document.body.children].filter(el=>el!==host&&!el.inert);inertBackground.forEach(el=>el.inert=true);host.hidden=false;document.body.classList.add('touch-scoreboard-open');draw();document.getElementById('touchExit').focus();}
  function close(){if(anonymous){if(confirm('Dieses lokale Spiel vollständig verwerfen?'))api.discard();return;}host.hidden=true;inertBackground.forEach(el=>el.inert=false);inertBackground=[];document.body.classList.remove('touch-scoreboard-open');if(document.fullscreenElement===host)document.exitFullscreen().catch(()=>{});previousFocus?.focus();}
  window.openTouchScoreboard=open;
  host.querySelectorAll('[data-side]').forEach(b=>b.onclick=()=>{if(Date.now()-lastTap<400)return;lastTap=Date.now();api.goal(b.dataset.side);draw();});
  document.getElementById('touchExit').onclick=close;
  document.getElementById('touchFull').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(host.requestFullscreen)await host.requestFullscreen();else document.getElementById('touchStatus').textContent='Browser-Vollbild nicht verfügbar; die Anzeige nutzt bereits das ganze Fenster.';}catch{document.getElementById('touchStatus').textContent='Vollbild konnte nicht aktiviert werden.';}};
  document.getElementById('touchClock').onclick=()=>{api.toggle();draw();};
  document.getElementById('touchUndo').onclick=()=>{api.undo();draw();};
  document.getElementById('touchPeriod').onclick=()=>{if(confirm('Abschnitt beenden und Pause beginnen?')){api.period();draw();}};
  document.getElementById('touchEnd').onclick=()=>{if(confirm('Spiel wirklich abpfeifen und Ergebnis speichern?')){api.end();draw();}};
  document.getElementById('touchSetup').onsubmit=async e=>{e.preventDefault();await api.create(document.getElementById('touchOpponent').value,Number(document.getElementById('touchDuration').value),document.getElementById('touchHome').value);draw();};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!host.hidden)close();});
  setInterval(draw,500);
  if(new URLSearchParams(location.search).get('scoreboard')==='1'||anonymous)open();
 });
})();
