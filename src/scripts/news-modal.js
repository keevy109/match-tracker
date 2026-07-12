export function init() {
  const modal = document.getElementById('newsModal');
  if (!modal) return;

  function openNews(card) {
    document.getElementById('nmDate').textContent  = card.dataset.date  || '';
    document.getElementById('nmTitle').textContent = card.dataset.title || '';
    document.getElementById('nmText').innerHTML    = card.dataset.text  || '';
    const hasImg = !!card.dataset.image;
    document.getElementById('nmIcon').textContent  = hasImg ? '' : (card.dataset.icon || '');
    document.getElementById('nmImage').style.background = hasImg
      ? `url('${card.dataset.image}') center/cover no-repeat`
      : (card.dataset.gradient || 'var(--surface2)');
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
  document.querySelectorAll('.news-card').forEach(card => {
    card.addEventListener('click', () => openNews(card));
  });
}
