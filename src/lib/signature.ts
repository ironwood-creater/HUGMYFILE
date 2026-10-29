// Canvas helpers for signatures: trimming empty space, rendering typed names in
// handwriting fonts, and turning a white paper background transparent.

export const HANDWRITING_FONTS = [
  { id: 'caveat', family: 'Caveat', label: 'Caveat', weight: 600 },
  { id: 'dancing', family: 'Dancing Script', label: 'Dancing Script', weight: 600 },
  { id: 'great-vibes', family: 'Great Vibes', label: 'Great Vibes', weight: 400 },
  { id: 'sacramento', family: 'Sacramento', label: 'Sacramento', weight: 400 },
] as const;
export type HandwritingFont = (typeof HANDWRITING_FONTS)[number]['id'];

/** Bounding box of pixels that are not (almost) fully transparent. */
export function contentBounds(data: Uint8ClampedArray, width: number, height: number, alphaThreshold = 8) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3]! > alphaThreshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/** Returns a new canvas cropped to the content, with a small transparent margin. */
export function trimCanvas(source: HTMLCanvasElement, padding = 8): HTMLCanvasElement | null {
  const ctx = source.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  const { width, height } = source;
  const bounds = contentBounds(ctx.getImageData(0, 0, width, height).data, width, height);
  if (!bounds) return null;
  const out = document.createElement('canvas');
  out.width = bounds.w + padding * 2;
  out.height = bounds.h + padding * 2;
  out.getContext('2d')!.drawImage(source, bounds.x, bounds.y, bounds.w, bounds.h, padding, padding, bounds.w, bounds.h);
  return out;
}

/** Draws a typed name in a handwriting font onto a transparent canvas. */
export async function renderTypedSignature(text: string, fontId: HandwritingFont, color: string, size = 120): Promise<HTMLCanvasElement | null> {
  const font = HANDWRITING_FONTS.find((f) => f.id === fontId)!;
  const css = `${font.weight} ${size}px "${font.family}"`;
  try {
    await document.fonts.load(css, text);
  } catch {
    /* the browser will fall back to another font */
  }
  const measure = document.createElement('canvas').getContext('2d')!;
  measure.font = css;
  const w = Math.ceil(measure.measureText(text).width + size);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, w);
  canvas.height = Math.ceil(size * 1.8);
  const ctx = canvas.getContext('2d')!;
  ctx.font = css;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, canvas.height / 2);
  return trimCanvas(canvas, Math.round(size * 0.08));
}

/** Makes near-white pixels transparent (for photos of signatures on paper). */
export function removeWhiteBackground(canvas: HTMLCanvasElement, threshold = 215): void {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.299 * d[i]! + 0.587 * d[i + 1]! + 0.114 * d[i + 2]!;
    if (lum >= threshold) d[i + 3] = 0;
    else if (lum > threshold - 40) d[i + 3] = Math.round((d[i + 3]! * (threshold - lum)) / 40);
  }
  ctx.putImageData(img, 0, 0);
}

export function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG export failed'))), 'image/png'));
}
