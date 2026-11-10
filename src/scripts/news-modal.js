import * as api from './api.js';
import {sanitizeNews,safeImage,renderNewsPhotos} from './news-content.js';
export function init() {
  const modal = document.getElementById('newsModal');
  if (!modal) return;
  let opened = 0;

  function openNews(card) {
    document.getElementById('nmDate').textContent  = card.dataset.date  || '';
    document.getElementById('nmTitle').textContent = card.dataset.title || '';
    document.getElementById('nmText').innerHTML    = sanitizeNews(card.dataset.text || '');
    const photos = document.createElement('div');
    try { renderNewsPhotos(photos, JSON.parse(card.dataset.photos || '[]'), api.newsImage); } catch {}
    document.getElementById('nmText').append(photos);
    // Titelbild nachladen; bis dahin Symbol und Hintergrund wie bei Beiträgen ohne Bild.
    const token = ++opened;
    document.getElementById('nmIcon').textContent = card.dataset.icon || '';
    document.getElementById('nmImage').style.background = card.dataset.gradient || 'var(--surface2)';
    if (card.dataset.image) api.newsImage(card.dataset.image).then(source => {
      const src = safeImage(source);
      if (!src || token !== opened) return;
      document.getElementById('nmIcon').textContent = '';
      document.getElementById('nmImage').style.background = `url(${JSON.stringify(src)}) center/cover no-repeat`;
    });
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('nm-open');
    document.body.style.overflow = 'hidden';
  }

  function closeNews() {
    modal.classList.remove('nm-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.getElementById('newsModalOverlay').addEventListener('click', closeNews);
  document.getElementById('newsModalClose').addEventListener('click', closeNews);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNews(); });
  document.getElementById('aktuelles')?.addEventListener('click', event => {
    const card=event.target.closest('.news-card');if(card)openNews(card);
  });
  document.getElementById('aktuelles')?.addEventListener('keydown', event => {
    if(event.key==='Enter'||event.key===' '){const card=event.target.closest('.news-card');if(card){event.preventDefault();openNews(card);}}
  });
}
