// Page-side API for the image engine. Heavy work runs in image.worker.ts; if the
// worker can't decode a file (for example HEIC outside Safari's worker support,
// or browsers without OffscreenCanvas), the page decodes it and hands over pixels.
import { ToolError } from '../errors';
import { WorkerClient, type ProgressFn } from '../workerClient';
import type { ImageJob, ImageResult, PixelSource } from './engine';
import { MIME, sniffFile, type ImageFormat, type OutputFormat } from './formats';

export type { ImageJob, ImageResult } from './engine';

export const SAFE_CANVAS_PIXELS = 16_777_216;

export interface ProcessedImage extends ImageResult {
  blob: Blob;
}

export class ImageEngine {
  private client = new WorkerClient(() => new Worker(new URL('./image.worker.ts', import.meta.url), { type: 'module' }));

  async process(file: Blob, job: ImageJob, onProgress?: ProgressFn): Promise<ProcessedImage> {
    let result: ImageResult;
    try {
      result = await this.client.call<ImageResult>('process', { blob: file, job }, { onProgress });
    } catch (err) {
      if (!(err instanceof ToolError) || (err.code !== 'decode-failed' && err.code !== 'heic-unsupported')) throw err;
      // Second chance: let the page decode it (uses the browser's full image support).
      onProgress?.(0.08, 'Opening your image…');
      const formatHint = await sniffFile(file);
      let pixels: PixelSource;
      try {
        pixels = await decodeOnPage(file);
      } catch {
        throw new ToolError(formatHint === 'heic' ? 'heic-unsupported' : 'decode-failed');
      }
      result = await this.client.call<ImageResult>('process', { pixels, formatHint, job }, { onProgress, transfer: [pixels.data] });
    }
    return { ...result, blob: new Blob([result.buffer], { type: MIME[result.format] }) };
  }

  async encodePixels(pixels: PixelSource, format: OutputFormat, quality: number, targetBytes?: number, onProgress?: ProgressFn): Promise<{ blob: Blob; quality: number }> {
    const out = await this.client.call<{ buffer: ArrayBuffer; quality: number }>(
      'encodePixels',
      { pixels, format, quality, targetBytes },
      { onProgress, transfer: [pixels.data] },
    );
    return { blob: new Blob([out.buffer], { type: MIME[format] }), quality: out.quality };
  }

  cancel(): void {
    this.client.cancel();
  }

  dispose(): void {
    this.client.dispose();
  }
}

function loadImageElement(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ToolError('decode-failed'));
    };
    img.src = url;
  });
}

/** Opens an image with the browser's own decoder on the page and returns RGBA pixels. */
export async function decodeOnPage(file: Blob, maxPixels = SAFE_CANVAS_PIXELS): Promise<PixelSource> {
  let source: ImageBitmap | HTMLImageElement;
  let width: number;
  let height: number;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    source = bmp;
    width = bmp.width;
    height = bmp.height;
  } catch {
    const img = await loadImageElement(file);
    source = img;
    width = img.naturalWidth;
    height = img.naturalHeight;
  }
  if (!width || !height) throw new ToolError('decode-failed');
  const scale = width * height > maxPixels ? Math.sqrt(maxPixels / (width * height)) : 1;
  const w = Math.max(1, Math.floor(width * scale));
  const h = Math.max(1, Math.floor(height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new ToolError('out-of-memory');
  ctx.drawImage(source, 0, 0, w, h);
  if ('close' in source) source.close();
  const data = ctx.getImageData(0, 0, w, h).data;
  canvas.width = 1;
  canvas.height = 1;
  return { data: data.buffer as ArrayBuffer, width: w, height: h };
}

export function formatOf(file: File): Promise<ImageFormat> {
  return sniffFile(file);
}
