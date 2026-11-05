/* Share & Embed: standalone presentation and native file sharing. */
(function(root){
 const formats={feed:{height:720,label:'Ticker-Feed'},compact:{height:440,label:'Kompakt'},score:{height:200,label:'Nur Spielstand'},'score-compact':{height:100,label:'Spielstand kompakt'}};
 function embed(id,format='feed',style='light'){
  if(!formats[format]||!['light','dark'].includes(style)||!id)throw new Error('Ungültige Einbettung');
  const url=new URL('https://keevy109.github.io/match-tracker/match-tracker.html');
  url.search=new URLSearchParams({ticker:String(id),embed:format,style}).toString();
  return `<iframe src="${url.href.replace(/&/g,'&amp;')}" title="Liveticker" width="100%" height="${formats[format].height}" style="border:0;max-width:600px" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="web-share"></iframe>`;
 }
 function mount(id){
  let host=document.getElementById('embedEditor');if(!host)return;
  host.replaceChildren();const title=document.createElement('h4');title.textContent='Auf deiner Website einbinden';host.append(title);
  const select=(label,options)=>{const wrap=document.createElement('label');wrap.textContent=label;const el=document.createElement('select');for(const [value,text] of options){const o=document.createElement('option');o.value=value;o.textContent=text;el.append(o);}wrap.append(el);host.append(wrap);return el;};
  const format=select('Format',Object.entries(formats).map(([key,value])=>[key,value.label]));const style=select('Style',[['light','Hell'],['dark','Dunkel']]);
  const code=document.createElement('textarea');code.readOnly=true;code.setAttribute('aria-label','Einbettungscode');host.append(code);
  const update=()=>code.value=embed(id,format.value,style.value);format.onchange=style.onchange=update;update();
  const copy=document.createElement('button');copy.textContent='Einbettungscode kopieren';copy.onclick=async()=>{try{await navigator.clipboard.writeText(code.value);copy.textContent='Kopiert';}catch{code.focus();code.select();copy.textContent='Code markieren und kopieren';}};host.append(copy);
 }
 async function image(canvas,filename){
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('Bild konnte nicht erstellt werden');
  const file=new File([blob],filename,{type:'image/png'}),url=URL.createObjectURL(blob);
  const dialog=document.createElement('dialog');dialog.className='share-image-dialog';const heading=document.createElement('h2');heading.textContent='Bild teilen';const preview=document.createElement('img');preview.src=url;preview.alt='Vorschau des Spielstands';
  const status=document.createElement('p');status.setAttribute('role','status');const share=document.createElement('button');share.textContent='Bild teilen';share.hidden=!(navigator.canShare&&navigator.canShare({files:[file]})&&navigator.share);
  share.onclick=async()=>{try{await navigator.share({files:[file]});}catch(e){if(e.name!=='AbortError')status.textContent='Teilen nicht möglich. Bitte das Bild herunterladen.';}};
  const download=document.createElement('a');download.href=url;download.download=filename;download.textContent='Bild herunterladen';const close=document.createElement('button');close.textContent='Schließen';close.onclick=()=>dialog.close();dialog.append(heading,preview,share,download,close,status);document.body.append(dialog);dialog.addEventListener('close',()=>{dialog.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)},{once:true});dialog.showModal();
 }
 root.MatchShare=Object.freeze({embed,mount,image});
 document.addEventListener('DOMContentLoaded',()=>{const params=new URLSearchParams(location.search);if(!params.get('ticker')||!formats[params.get('embed')])return;document.body.dataset.embed=params.get('embed');document.documentElement.dataset.embed=params.get('embed');root.updateFeedScrollState?.();const style=params.get('style');if(['light','dark'].includes(style))document.documentElement.dataset.theme=style;},{once:true});
})(window);
