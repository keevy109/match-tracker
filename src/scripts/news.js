import * as api from './api.js';
import {sanitizeNews,safeImage,newsDate} from './news-content.js';
export async function init() {
  const grid=document.getElementById('newsGrid');if(!grid)return;
  try {
    const items=await api.load('news');grid.replaceChildren();
    items.filter(n=>n.published!==false).sort((a,b)=>(b.date||'').localeCompare(a.date||'')).forEach(n=>{
      const card=document.createElement('article');card.className='news-card';card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label',n.title);
      Object.assign(card.dataset,{date:newsDate(n.date),title:n.title,text:sanitizeNews(n.body),image:safeImage(n.image),photos:JSON.stringify(n.photos||[]),icon:n.icon||'📰'});
      const picture=document.createElement('div');picture.className='news-image';
      if(card.dataset.image)picture.style.backgroundImage=`url(${JSON.stringify(card.dataset.image)})`;else picture.textContent=n.icon||'📰';
      picture.style.backgroundSize='cover';picture.style.backgroundPosition='center';
      const body=document.createElement('div');body.className='news-body';
      for(const [cls,text] of [['news-date',newsDate(n.date)],['news-title',n.title],['news-excerpt',n.excerpt||'']]){const el=document.createElement('div');el.className=cls;el.textContent=text;body.append(el);}
      card.append(picture,body);grid.append(card);
    });
    if(!grid.children.length)grid.textContent='Noch keine Neuigkeiten veröffentlicht.';
  } catch {grid.textContent='Neuigkeiten konnten nicht geladen werden.';}
}
