/* News-Bilder liegen getrennt von den Beiträgen unter newsImages/{key}.
 * Ein Beitrag trägt statt des Base64-Bildes nur "db:{key}" (in image und photos).
 * Der Schlüssel ist ein Hash des Bildinhalts: Unveränderte Bilder werden beim
 * Speichern nicht erneut übertragen, und die Beitragsliste bleibt klein.
 * Dateipfade (uploads/…) und URLs bleiben unverändert.
 */
(function(root) {
  const PREFIX = 'db:';
  const DATA_IMAGE = /^data:image\/(png|jpeg|webp|gif);base64,/i;
  const KEY = /^[a-f0-9]{16,64}$/;

  function list(value) { return Array.isArray(value) ? value : Object.values(value || {}); }
  function refKey(value) {
    if (typeof value !== 'string' || !value.startsWith(PREFIX)) return null;
    const key = value.slice(PREFIX.length);
    return KEY.test(key) ? key : null;
  }
  function isDataImage(value) { return typeof value === 'string' && DATA_IMAGE.test(value); }

  // Ersetzt eingebettete Bilder durch Verweise. hash(dataUri) -> Promise<hex>.
  async function extract(items, hash) {
    const images = {};
    async function swap(value) {
      if (!isDataImage(value)) return value;
      const key = await hash(value);
      images[key] = value;
      return PREFIX + key;
    }
    const stripped = await Promise.all(list(items).filter(Boolean).map(async item => {
      const next = {...item};
      if (next.image != null) next.image = await swap(next.image);
      if (next.photos != null) next.photos = await Promise.all(list(next.photos).map(swap));
      return next;
    }));
    return {items: stripped, images};
  }

  // Alle Bildschlüssel, auf die die Beiträge noch verweisen.
  function referenced(items) {
    const keys = new Set();
    list(items).filter(Boolean).forEach(item => {
      [item.image, ...list(item.photos)].forEach(value => { const key = refKey(value); if (key) keys.add(key); });
    });
    return keys;
  }

  root.MatchTrackerNewsImages = {PREFIX, refKey, isDataImage, extract, referenced};
})(globalThis);
