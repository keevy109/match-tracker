(function(){
 const host=document.getElementById('variants'),theme=document.getElementById('theme');
 function render(){
  host.replaceChildren();
  for(const [id,[title,description]] of Object.entries(TickerFixtures.descriptions)){
   const article=document.createElement('article'),h=document.createElement('h2'),p=document.createElement('p'),frame=document.createElement('iframe'),details=document.createElement('details'),summary=document.createElement('summary'),pre=document.createElement('pre'),link=document.createElement('a');
   h.textContent=title;p.textContent=description;
   const format=id==='finished'?'score-compact':id==='abandoned'?'score':'feed';
   const url=new URL('./match-tracker.html',location.href);url.search=new URLSearchParams({dev:'1',fixture:id,ticker:'dev-fixture',embed:format,style:theme.value});
   frame.src=url.href;frame.title=title;frame.height=format==='score'?200:format==='score-compact'?100:620;
   link.href=url.href;link.target='_blank';link.rel='noopener';link.textContent='Einzeln öffnen ↗';
   summary.textContent='Input-Daten ansehen';pre.textContent=JSON.stringify(TickerFixtures.get(id),null,2);pre.style.cssText='max-height:400px;overflow:auto;font-size:12px;white-space:pre-wrap';
   details.append(summary,pre);article.append(h,p,frame,link,details);
   if(id==='max')for(const mode of ['mobile','tv']){const a=document.createElement('a'),u=new URL(url);u.searchParams.set('scoreboard',mode);a.href=u.href;a.target='_blank';a.rel='noopener';a.textContent=' · Scoreboard '+(mode==='mobile'?'Mobil':'TV');article.append(a);}if(id==='max')for(const [side,label] of [['left','Heim-TV'],['right','Gast-TV']]){const a=document.createElement('a'),u=new URL(url);u.searchParams.set('scoreboard','tv');u.searchParams.set('side',side);a.href=u.href;a.target='_blank';a.rel='noopener';a.textContent=' · '+label;article.append(a);}host.append(article);
  }
 }
 theme.onchange=render;render();
})();
