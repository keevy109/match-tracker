// Keep small website images inside the existing Realtime Database records.
// No Storage bucket or second set of write permissions is required.
export const MAX_IMAGE_LENGTH = 128 * 1024;
export function validateImage(subpath, dataUrl) {
  if (!/^(kader|trainer)\/(portraits|detail)$|^vereine\/badges$/.test(subpath)) throw new Error('Ungültiges Bildziel.');
  if (typeof dataUrl !== 'string' || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(dataUrl)) {
    throw new Error('Bitte ein PNG-, JPEG- oder WebP-Bild auswählen.');
  }
  if (dataUrl.length > 14 * 1024 * 1024) throw new Error('Bitte ein Bild unter 10 MB auswählen.');
}
export async function prepareImage(subpath, dataUrl, {
  decode = source => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Das Bild konnte nicht gelesen werden.'));
    image.src = source;
  }),
  makeCanvas = () => document.createElement('canvas'),
} = {}) {
  validateImage(subpath, dataUrl);
  const image = await decode(dataUrl);
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (!width || !height) throw new Error('Das Bild konnte nicht gelesen werden.');
  const bound = subpath.endsWith('/detail') ? 1400 : 640;
  let scale = Math.min(1, bound / Math.max(width, height));
  if (scale === 1 && dataUrl.length <= MAX_IMAGE_LENGTH) return dataUrl;
  const canvas = makeCanvas();
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Die Bildverarbeitung ist in diesem Browser nicht verfügbar.');
  for (let step = 0; step < 8; step++) {
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.7, 0.55]) {
      // WebP preserves transparency; browsers without WebP encoding return PNG.
      const encoded = canvas.toDataURL('image/webp', quality);
      if (/^data:image\/(webp|png);base64,/.test(encoded) && encoded.length <= MAX_IMAGE_LENGTH) return encoded;
    }
    scale *= 0.75;
  }
  throw new Error('Das Bild ist zu detailreich. Bitte einen kleineren Ausschnitt wählen.');
}
