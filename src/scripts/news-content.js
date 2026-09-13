export function safeLink(value) {
  try { const url = new URL(value, window.location.href); return ['http:','https:','mailto:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
export function safeImage(value) {
  if (!value) return '';
  if (/^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(value)) return value;
  try { const url = new URL(value, window.location.href); return ['http:','https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
export function sanitizeNews(html) {
  const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
  const allowed = new Set(['P','BR','STRONG','B','EM','I','U','H2','H3','UL','OL','LI','BLOCKQUOTE','A','DIV']);
  function clean(parent) {
    for (const node of [...parent.childNodes]) {
      if (node.nodeType === 3) continue;
      if (node.nodeType !== 1) { node.remove(); continue; }
      if (['SCRIPT','STYLE','IFRAME','OBJECT','SVG','MATH','TEMPLATE'].includes(node.tagName)) { node.remove(); continue; }
      clean(node);
      if (!allowed.has(node.tagName)) { node.replaceWith(...node.childNodes); continue; }
      const href = node.tagName === 'A' ? safeLink(node.getAttribute('href') || '') : '';
      for (const attr of [...node.attributes]) node.removeAttribute(attr.name);
      if (href) { node.setAttribute('href', href); node.setAttribute('rel','noopener noreferrer'); }
    }
  }
  clean(doc.body);
  return doc.body.innerHTML;
}
export function newsDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? new Date(value+'T12:00:00').toLocaleDateString('de-DE',{day:'2-digit',month:'long',year:'numeric'}) : '';
}
export function plainText(html) { const doc=new DOMParser().parseFromString(html,'text/html');return doc.body.textContent.trim(); }
