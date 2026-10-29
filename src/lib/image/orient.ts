// Decoding helpers shared by the page and the worker.
import { ToolError } from '../errors';
import { ORIENTATION_PROBE_JPEG, base64ToBytes, orientationSwapsAxes, orientationTransform, readJpegOrientation } from './exif';
import { sniffImage } from './formats';

let probe: Promise<boolean> | null = null;

export async function decodeBitmap(blob: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(blob, { imageOrientation: 'from-image', premultiplyAlpha: 'none' });
  } catch (err) {
    // Older engines reject unknown option values with a TypeError; retry without options.
    if (err instanceof TypeError) return createImageBitmap(blob);
    throw err;
  }
}

/** True if createImageBitmap already applies EXIF orientation in this browser. */
export function browserAppliesOrientation(): Promise<boolean> {
  probe ??= (async () => {
    try {
      const blob = new Blob([base64ToBytes(ORIENTATION_PROBE_JPEG) as BlobPart], { type: 'image/jpeg' });
      const bmp = await decodeBitmap(blob);
      const applied = bmp.width === 1 && bmp.height === 2;
      bmp.close();
      return applied;
    } catch {
      return true;
    }
  })();
  return probe;
}

/**
 * Page-side: opens a photo upright (EXIF orientation applied) and scaled so its
 * longest side is at most maxSide. Returns a canvas ready to draw from.
 */
export async function loadUprightCanvas(file: Blob, maxSide: number): Promise<HTMLCanvasElement> {
  const head = new Uint8Array(await file.slice(0, 256 * 1024).arrayBuffer());
  const format = sniffImage(head);
  let source: ImageBitmap | HTMLImageElement;
  let sw: number;
  let sh: number;
  try {
    const bmp = await decodeBitmap(file);
    source = bmp;
    sw = bmp.width;
    sh = bmp.height;
  } catch {
    try {
      const img = await loadImg(file);
      source = img;
      sw = img.naturalWidth;
      sh = img.naturalHeight;
    } catch {
      throw new ToolError(format === 'heic' ? 'heic-unsupported' : 'decode-failed');
    }
  }
  const orientation = format === 'jpeg' && 'close' in source ? readJpegOrientation(head) : 1;
  const manual = orientation !== 1 && !(await browserAppliesOrientation());
  const uw = manual && orientationSwapsAxes(orientation) ? sh : sw;
  const uh = manual && orientationSwapsAxes(orientation) ? sw : sh;
  const scale = Math.min(1, maxSide / Math.max(uw, uh));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(uw * scale));
  canvas.height = Math.max(1, Math.round(uh * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ToolError('out-of-memory');
  ctx.imageSmoothingQuality = 'high';
  ctx.scale(scale, scale);
  if (manual) ctx.transform(...orientationTransform(orientation, uw, uh));
  ctx.drawImage(source, 0, 0);
  if ('close' in source) source.close();
  return canvas;
}

function loadImg(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('decode failed'));
    };
    img.src = url;
  });
}
