(function(){
 const input=document.getElementById('source'),status=document.getElementById('status'),host=document.getElementById('variants');
 function render(value){
  try{
   let id=value.trim();if(/^https?:\/\//i.test(id))id=new URL(id).searchParams.get('ticker')||'';
   if(!/^[a-zA-Z0-9_-]{1,100}$/.test(id))throw new Error('Bitte eine gültige Ticker-ID oder einen Zuschauerlink mit ticker= eingeben.');
   input.value=id;host.replaceChildren();const params=new URLSearchParams({ticker:id});history.replaceState(null,'',`${location.pathname}?${params}`);
   for(const [format,title,height] of [['feed','Ticker-Feed',720],['compact','Kompakt',440],['score','Spielstand',200],['score-compact','Spielstand kompakt',100]])for(const style of ['light','dark']){
    const article=document.createElement('article'),heading=document.createElement('h2'),description=document.createElement('p');heading.textContent=`${title} · ${style==='light'?'Hell':'Dunkel'}`;description.textContent=`Responsive Breite · ${height} px Höhe`;
    const frame=document.createElement('iframe'),url=new URL('./match-tracker.html',location.href);url.search=new URLSearchParams({ticker:id,embed:format,style});frame.src=url.href;frame.title=heading.textContent;frame.height=height;frame.loading='lazy';frame.allow='web-share';frame.referrerPolicy='strict-origin-when-cross-origin';
    const code=document.createElement('textarea');code.readOnly=true;code.value=MatchShare.embed(id,format,style);code.setAttribute('aria-label',`Einbettungscode ${heading.textContent}`);
    const copy=document.createElement('button');copy.type='button';copy.textContent='Code kopieren';copy.onclick=async()=>{try{await navigator.clipboard.writeText(code.value);copy.textContent='Kopiert';}catch{code.focus();code.select();copy.textContent='Code auswählen und kopieren';}};
    article.append(heading,description,frame,code,copy);host.append(article);
   }
   status.textContent=`Acht Varianten für Ticker ${id}. Inhalte werden live geladen.`;
  }catch(error){status.textContent=error.message;}
 }
 document.getElementById('sourceForm').onsubmit=e=>{e.preventDefault();render(input.value)};
 render(new URLSearchParams(location.search).get('ticker')||'221205012');
})();
