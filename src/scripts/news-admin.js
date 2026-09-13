import * as api from './api.js';
import {sanitizeNews,safeImage,newsDate,plainText,renderNewsPhotos} from './news-content.js';
let items=[],current=null,image='',imageData='',dirty=false,saving=false,imageToken=0,imageBusy=false;
let photos=[],photosBusy=false,photosToken=0;
const $=id=>document.getElementById(id);
function markDirty(){dirty=true;try{localStorage.setItem('ssv_news_draft_'+current,JSON.stringify(read()));}catch{$('newsSaveStatus').textContent='Der Browser-Entwurf ist zu groß. Bitte lokal speichern und diesen Tab bis dahin offen lassen.';}}
function lockEditor(locked){$('newsEditorPanel').querySelectorAll('input,textarea,button').forEach(el=>el.disabled=locked);$('newsBody').contentEditable=String(!locked);}
function render(){
  const list=$('newsAdminList');list.replaceChildren();
  const drafts=[];
  try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key.startsWith('ssv_news_draft_')){const n=JSON.parse(localStorage.getItem(key));if(n?.id&&!items.some(item=>item.id===n.id))drafts.push({...n,browserDraft:true});}}}catch{}
  [...items,...drafts].sort((a,b)=>b.date.localeCompare(a.date)).forEach(n=>{
    const card=document.createElement('div');card.className='item-card';
    const label=document.createElement('span');label.textContent=`${newsDate(n.date)} · ${n.title||'Neuer Beitrag'}${n.browserDraft?' · Entwurf im Browser':''}${n.published===false?' · Entwurf':''}`;
    const button=document.createElement('button');button.className='btn-secondary';button.textContent='Bearbeiten';button.onclick=()=>open(n);
    card.append(label,button);list.append(card);
  });
  if(!items.length&&!drafts.length)list.textContent='Noch keine Beiträge.';
}
function open(item){
  if(saving)return;
  if(dirty){markDirty();render();}
  photosToken++;photosBusy=false;imageToken++;imageBusy=false;current=item?.id||crypto.randomUUID();
  let data=item;
  try {const draft=JSON.parse(localStorage.getItem('ssv_news_draft_'+current)||'null');if(draft&&confirm('Lokalen Entwurf wiederherstellen?'))data=draft;}catch{}
  $('newsTitle').value=data?.title||'';$('newsDate').value=data?.date||new Date().toLocaleDateString('sv-SE');$('newsExcerpt').value=data?.excerpt||'';
  $('newsPublished').checked=!!data&&data.published!==false;$('newsBody').innerHTML=sanitizeNews(data?.body||'<p><br></p>');
  photos=Array.isArray(data?.photos)?[...data.photos]:[];renderPhotos();$('newsPhotos').value='';
  image=data?.image||'';imageData='';$('newsImage').value='';$('newsImagePreview').src=safeImage(image);$('newsImagePreview').hidden=!image;
  $('newsEditorPanel').hidden=false;$('newsSaveStatus').textContent='';$('newsPreview').hidden=true;dirty=false;$('newsTitle').focus();
}
function read(){return {...items.find(n=>n.id===current),id:current,title:$('newsTitle').value.trim(),date:$('newsDate').value,excerpt:$('newsExcerpt').value.trim(),published:$('newsPublished').checked,body:sanitizeNews($('newsBody').innerHTML),image:imageData||image,photos:[...photos]};}
async function pickImage(file){
 if(!file)return;
 if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)||file.size>10*1024*1024)throw Error('Bitte JPG, PNG, WebP oder GIF bis 10 MB auswählen.');
 const url=URL.createObjectURL(file);
 try{const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('Bild konnte nicht gelesen werden.'));img.src=url;});const scale=Math.min(1,1400/img.width,1400/img.height);const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',0.85);}finally{URL.revokeObjectURL(url);}
}
async function save(){
 if(saving)return;
 if(imageBusy||photosBusy){$('newsSaveStatus').textContent='Das Bild wird noch vorbereitet.';return;}
 const data=read();if(!data.title||!data.date||!plainText(data.body)){$('newsSaveStatus').textContent='Bitte Titel, Datum und Beitragstext eingeben.';return;}
 saving=true;lockEditor(true);
 try{
  try{localStorage.setItem('ssv_news_draft_'+current,JSON.stringify(data));}catch{}
  if(!import.meta.env.DEV)throw Error('Bitte den lokalen Admin öffnen. Beiträge werden lokal gespeichert und anschließend über GitHub veröffentlicht.');
  if(imageData){const response=await fetch('/api/upload/news',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filename:crypto.randomUUID()+'.jpg',data:imageData})});if(!response.ok)throw Error('Bild konnte nicht gespeichert werden.');data.image=(await response.json()).url;}
  data.photos=await Promise.all(data.photos.map(uploadPhoto));
  const next=items.filter(n=>n.id!==current).concat(data);await api.save('news',next);items=next;photos=data.photos;renderPhotos();image=data.image;imageData='';dirty=false;localStorage.removeItem('ssv_news_draft_'+current);render();$('newsSaveStatus').textContent='Lokal gespeichert. Mit dem nächsten GitHub-Push wird der Beitrag veröffentlicht.';
 }catch(error){$('newsSaveStatus').textContent=error.message+' Bitte diesen Tab offen lassen und erneut speichern.';}finally{saving=false;lockEditor(false);}
}
export async function init(){
 try{items=await api.load('news');render();}catch{$('newsAdminList').textContent='Beiträge konnten nicht geladen werden.';}
 $('newNews').onclick=()=>open(null);$('newsSave').onclick=save;
 $('newsEditorPanel').addEventListener('input',markDirty);
 $('newsToolbar').addEventListener('mousedown',event=>event.preventDefault());
 $('newsToolbar').addEventListener('click',event=>{const button=event.target.closest('[data-command]');if(!button)return;$('newsBody').focus();let value=button.dataset.value||null;if(button.dataset.command==='createLink'){const input=prompt('Link-Adresse (https://…)');if(!input)return;value=safeLinkForEditor(input);if(!value){$('newsSaveStatus').textContent='Bitte eine gültige https://- oder http://-Adresse eingeben.';return;}}document.execCommand(button.dataset.command,false,value);markDirty();});
 $('newsBody').addEventListener('paste',event=>{event.preventDefault();const text=event.clipboardData.getData('text/plain');document.execCommand('insertText',false,text);markDirty();});
 $('newsPhotos').onchange=async event=>{
  const token=++photosToken;photosBusy=true;const files=[...event.target.files];
  try{const added=await Promise.all(files.map(pickImage));if(token!==photosToken)return;photos.push(...added);renderPhotos();markDirty();}
  catch(error){if(token===photosToken)$('newsSaveStatus').textContent=error.message;}
  finally{if(token===photosToken){photosBusy=false;$('newsPhotos').value='';}}
 };
 $('newsImage').onchange=async event=>{const token=++imageToken;imageBusy=true;try{const result=await pickImage(event.target.files[0]);if(token!==imageToken)return;imageData=result||'';$('newsImagePreview').src=imageData||safeImage(image);$('newsImagePreview').hidden=!(imageData||image);markDirty();}catch(e){if(token===imageToken)$('newsSaveStatus').textContent=e.message;}finally{if(token===imageToken)imageBusy=false;}};
 $('newsRemoveImage').onclick=()=>{imageToken++;imageBusy=false;image='';imageData='';$('newsImagePreview').hidden=true;$('newsImage').value='';markDirty();};
 $('newsShowPreview').onclick=()=>{const data=read();$('newsPreview').hidden=false;$('newsPreviewTitle').textContent=data.title;$('newsPreviewDate').textContent=newsDate(data.date);$('newsPreviewBody').innerHTML=data.body;renderNewsPhotos($('newsPreviewPhotos'),data.photos);$('newsPreviewImage').src=safeImage(data.image);$('newsPreviewImage').hidden=!data.image;};
 window.addEventListener('beforeunload',event=>{if(dirty){try{localStorage.setItem('ssv_news_draft_'+current,JSON.stringify(read()));}catch{}event.preventDefault();event.returnValue='';}});
}
function safeLinkForEditor(value){try{const url=new URL(value);return ['https:','http:','mailto:'].includes(url.protocol)?url.href:'';}catch{return '';}}

async function uploadPhoto(photo){
 if(!photo.startsWith('data:'))return photo;
 const response=await fetch('/api/upload/news',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filename:crypto.randomUUID()+'.jpg',data:photo})});
 if(!response.ok)throw Error('Foto konnte nicht gespeichert werden.');
 return (await response.json()).url;
}
function renderPhotos(){
 const list=$('newsPhotosList');list.replaceChildren();
 photos.forEach((photo,index)=>{
  const card=document.createElement('div');card.className='news-photo-item';
  const img=document.createElement('img');img.src=safeImage(photo);img.alt=`Foto ${index+1}`;
  const remove=document.createElement('button');remove.type='button';remove.className='btn-secondary';remove.textContent=`Foto ${index+1} entfernen`;
  remove.onclick=()=>{if(saving)return;photos.splice(index,1);renderPhotos();markDirty();};
  card.append(img,remove);list.append(card);
 });
}
