(()=>{
 const full=document.getElementById('crossFull');
 if(full)full.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{full.textContent='Vollbild nicht verfügbar';}};
 document.querySelectorAll('[data-cross-embed]').forEach(host=>{
  for(const view of ['conference','score','score-compact','accordion','expandable'])for(const style of ['light','dark']){
  const heading=document.createElement('h3');heading.textContent=({conference:'Vereinskonferenz',score:'Spielstände','score-compact':'Spielstände kompakt',accordion:'Kompakt · ein Spiel ausklappen',expandable:'Kompakt · mehrere Spiele ausklappen'}[view])+' · '+(style==='dark'?'Dunkel':'Hell');host.append(heading);
  const url=new URL('./cross-tracker.html',location.href);
  url.searchParams.set('view',view);url.searchParams.set('style',style);
  const height=view==='score-compact'?300:view==='score'?600:['accordion','expandable'].includes(view)?520:720;
  const frame=document.createElement('iframe');frame.src=url.href;frame.title='crossTracker · '+heading.textContent+' (Demo)';frame.height=String(height);frame.style.cssText='width:100%;border:0';frame.allow='fullscreen';frame.loading='lazy';frame.referrerPolicy='strict-origin-when-cross-origin';
  const code=document.createElement('textarea');code.readOnly=true;code.setAttribute('aria-label','Einbettungscode '+heading.textContent);code.style.cssText='width:100%;min-height:100px';
  code.value=`<iframe src="${url.href.replace(/&/g,'&amp;')}" title="${frame.title}" width="100%" height="${height}" style="border:0" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="fullscreen"></iframe>`;
  const copy=document.createElement('button');copy.textContent='Embed-Code kopieren';copy.onclick=async()=>{try{await navigator.clipboard.writeText(code.value);copy.textContent='Kopiert';}catch{code.focus();code.select();copy.textContent='Code markieren und kopieren';}};
  const link=document.createElement('a');link.href=url.href;link.textContent=' Embed einzeln öffnen ↗';link.target='_blank';link.rel='noopener';
  const test=document.createElement('a'),testUrl=new URL(url);testUrl.searchParams.set('simulate','1');test.href=testUrl.href;test.target='_blank';test.rel='noopener';test.textContent=' · Tore simulieren ↗';
  host.append(frame,code,copy,link,test);
  }
 });
})();
