/* Read-only projection of the live ticker DOM. No mutation commands or storage. */
(function(){
 document.addEventListener('DOMContentLoaded',()=>{
  const params=new URLSearchParams(location.search);
  if(!params.has('ticker'))return;
  const panel=document.createElement('section');panel.id='viewerScoreboard';panel.hidden=true;panel.tabIndex=-1;
  panel.innerHTML='<nav><button data-mode="mobile">Mobil</button><button data-mode="tv">TV</button><button id="viewerFull">Vollbild</button><button id="viewerBack">Zum Feed</button></nav><div class="viewer-score-teams">'+['Home','Away'].map(side=>'<div class="viewer-score-team" data-side="'+side+'"><img alt="" hidden><span class="viewer-team-name"></span><strong></strong></div>').join('')+'</div><div class="viewer-score-clock" role="status"></div>';
  const choices=document.createElement('nav');choices.className='viewer-score-choices';choices.setAttribute('aria-label','Ticker-Ansicht');
  choices.innerHTML='<button data-mode="mobile">Scoreboard · Mobil</button><button data-mode="tv">Scoreboard · TV</button>';choices.hidden=true;
  document.querySelector('.feed-result-space').before(choices);document.body.append(panel);
  if(params.has('embed'))choices.hidden=true;
  const selectedSide=['left','right'].includes(params.get('side'))?params.get('side'):'both';
  panel.dataset.viewSide=selectedSide;
  if(selectedSide!=='both')panel.querySelector('[data-side="'+(selectedSide==='left'?'Away':'Home')+'"]').hidden=true;
  const screens=document.createElement('span');screens.className='viewer-screen-links';
  for(const [side,label] of [['both','Beide'],['left','Heim-TV ↗'],['right','Gast-TV ↗']]){
   const link=document.createElement('a'),url=new URL(location.href);url.searchParams.set('scoreboard','tv');
   if(side==='both')url.searchParams.delete('side');else url.searchParams.set('side',side);
   link.href=url.href;link.textContent=label;link.target='_blank';link.rel='noopener';screens.append(link);
  }
  panel.querySelector('nav').append(screens);
  let focus,hideTimer;
  function reveal(){panel.classList.add('show-controls');clearTimeout(hideTimer);if(panel.dataset.mode==='tv')hideTimer=setTimeout(()=>panel.classList.remove('show-controls'),3500);}
  function draw(){
   if(panel.hidden)return;
   for(const side of ['Home','Away']){
    const team=panel.querySelector('[data-side="'+side+'"]'),logo=document.getElementById('feedLogo'+side);
    team.querySelector('.viewer-team-name').textContent=document.getElementById('feedName'+side).textContent;
    const score=document.getElementById('feedScore'+side).textContent;team.querySelector('strong').textContent=score;
    team.style.setProperty('--score-size',(85/Math.max(1,score.length))+'cqw');
    team.style.setProperty('--team-color',getComputedStyle(document.documentElement).getPropertyValue('--feed-'+side.toLowerCase()+'-color')||'#193a31');
    const img=team.querySelector('img'),src=logo.getAttribute('src')||'';img.hidden=!src;
    if(img.getAttribute('src')!==src){if(src)img.src=src;else img.removeAttribute('src');}
   }
   panel.querySelector('.viewer-score-clock').textContent=document.getElementById('feedMatchTime').textContent||'Ticker wird geladen …';
  }
  function open(mode){focus=document.activeElement;panel.dataset.mode=mode;panel.hidden=false;document.body.classList.add('viewer-score-open');draw();reveal();if(mode==='tv')panel.focus();else panel.querySelector('#viewerBack').focus();}
  function close(){panel.hidden=true;clearTimeout(hideTimer);document.body.classList.remove('viewer-score-open');if(document.fullscreenElement===panel)document.exitFullscreen().catch(()=>{});focus?.focus();}
  [...panel.querySelectorAll('[data-mode]'),...choices.querySelectorAll('[data-mode]')].forEach(b=>b.onclick=()=>open(b.dataset.mode));
  panel.querySelector('#viewerBack').onclick=close;
  panel.querySelector('#viewerFull').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(panel.requestFullscreen)await panel.requestFullscreen();}catch{}};
  panel.addEventListener('pointermove',reveal);panel.addEventListener('pointerdown',reveal);panel.addEventListener('focusin',reveal);
  document.addEventListener('keydown',e=>{if(panel.hidden)return;if(e.key==='Escape')close();else reveal();});
  const observer=new MutationObserver(draw);observer.observe(document.querySelector('.feed-result-header'),{subtree:true,childList:true,characterData:true,attributes:true});setInterval(()=>{if(!panel.hidden){const t=document.getElementById('feedMatchTime');if(t)panel.querySelector('.viewer-score-clock').textContent=t.textContent||'Ticker wird geladen …';}},500);
  if(['mobile','tv'].includes(params.get('scoreboard')))open(params.get('scoreboard'));else if(selectedSide!=='both')open('tv');
 });
})();
