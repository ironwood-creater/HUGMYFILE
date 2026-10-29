// Image pipeline that runs inside a Web Worker:
// decode → fix orientation → respect canvas limits → resize → encode (or hit a target size).
import { ToolError } from '../errors';
import type { HandlerContext } from '../workerHost';
import { sniffImage, type ImageFormat, type OutputFormat } from './formats';
import { orientationSwapsAxes, orientationTransform, readJpegOrientation } from './exif';
import { browserAppliesOrientation, decodeBitmap } from './orient';
import { decodeWithCodec, encodeAvif, encodeJpeg, encodePngLossless, encodePngReduced, encodeWebp, resizeImageData } from './codecs';

/** iOS Safari refuses canvases above ~16.7 million pixels. */
export const SAFE_CANVAS_PIXELS = 16_777_216;

export interface ResizeSpec {
  /** Leave one side out to keep the aspect ratio. */
  width?: number;
  height?: number;
  /** stretch: exact size, may distort; cover: fill and crop; contain: fit inside with background. */
  fit: 'stretch' | 'cover' | 'contain';
}

export interface ImageJob {
  output: OutputFormat | 'same';
  quality: number;
  /** For PNG output: 0 = lossless, otherwise the maximum number of colors (2–256). */
  pngColors?: number;
  dither?: boolean;
  resize?: ResizeSpec;
  scalePercent?: number;
  /** Encode so the file is at most this many bytes. */
  targetBytes?: number;
  /** For target sizes: never change the pixel size, only the quality. */
  keepDimensions?: boolean;
  /** Fill for transparent areas when the output can't store transparency. */
  background?: string;
  keepOriginalIfLarger?: boolean;
  avifSpeed?: number;
}

export interface PixelSource {
  data: ArrayBuffer;
  width: number;
  height: number;
}

export interface ProcessRequest {
  blob?: Blob;
  pixels?: PixelSource;
  /** Format of the original file when pixels were decoded by the page. */
  formatHint?: ImageFormat;
  job: ImageJob;
}

export interface ImageResult {
  buffer: ArrayBuffer;
  format: OutputFormat;
  width: number;
  height: number;
  inputWidth: number;
  inputHeight: number;
  inputFormat: ImageFormat;
  quality?: number;
  keptOriginal?: boolean;
  notes: string[];
}

function canvasWorks(width: number, height: number): boolean {
  try {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.fillStyle = '#000';
    ctx.fillRect(width - 1, height - 1, 1, 1);
    const ok = ctx.getImageData(width - 1, height - 1, 1, 1).data[3] === 255;
    canvas.width = 1;
    canvas.height = 1;
    return ok;
  } catch {
    return false;
  }
}

/** Largest size (same aspect ratio) that the browser can actually draw. */
export function safeSize(width: number, height: number, probe: (w: number, h: number) => boolean = canvasWorks): { width: number; height: number; scaled: boolean } {
  if (width * height <= SAFE_CANVAS_PIXELS) return { width, height, scaled: false };
  if (probe(width, height)) return { width, height, scaled: false };
  let scale = Math.sqrt(SAFE_CANVAS_PIXELS / (width * height));
  for (let i = 0; i < 6; i++) {
    const w = Math.max(1, Math.floor(width * scale));
    const h = Math.max(1, Math.floor(height * scale));
    if (probe(w, h)) return { width: w, height: h, scaled: true };
    scale *= 0.8;
  }
  throw new ToolError('out-of-memory', 'Canvas too large');
}

function hasTransparency(img: ImageData): boolean {
  const d = img.data;
  for (let i = 3; i < d.length; i += 4) if (d[i]! < 255) return true;
  return false;
}

function parseColor(color: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return [255, 255, 255];
  const n = parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Composites transparent pixels over a solid color (in place). */
export function flatten(img: ImageData, color = '#ffffff'): void {
  const [br, bg, bb] = parseColor(color);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3]!;
    if (a === 255) continue;
    const f = a / 255;
    d[i] = Math.round(d[i]! * f + br * (1 - f));
    d[i + 1] = Math.round(d[i + 1]! * f + bg * (1 - f));
    d[i + 2] = Math.round(d[i + 2]! * f + bb * (1 - f));
    d[i + 3] = 255;
  }
}

function crop(img: ImageData, sx: number, sy: number, sw: number, sh: number): ImageData {
  const out = new Uint8ClampedArray(sw * sh * 4);
  for (let y = 0; y < sh; y++) {
    const from = ((y + sy) * img.width + sx) * 4;
    out.set(img.data.subarray(from, from + sw * 4), y * sw * 4);
  }
  return new ImageData(out, sw, sh);
}

/** Loads pixels from a file (or pre-decoded pixels), upright and within canvas limits. */
async function loadPixels(req: ProcessRequest, notes: string[]): Promise<{ img: ImageData; format: ImageFormat; width: number; height: number }> {
  if (req.pixels) {
    const { data, width, height } = req.pixels;
    return { img: new ImageData(new Uint8ClampedArray(data), width, height), format: req.formatHint ?? 'unknown', width, height };
  }
  const blob = req.blob!;
  const head = new Uint8Array(await blob.slice(0, 256 * 1024).arrayBuffer());
  const format = sniffImage(head);
  if (typeof OffscreenCanvas === 'undefined') throw new ToolError('decode-failed', 'no-offscreen-canvas');

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await decodeBitmap(blob);
  } catch {
    if (format === 'webp' || format === 'avif') {
      const img = await decodeWithCodec(format, await blob.arrayBuffer());
      return { img, format, width: img.width, height: img.height };
    }
    throw new ToolError(format === 'heic' ? 'heic-unsupported' : 'decode-failed', 'Could not decode image');
  }

  const orientation = format === 'jpeg' ? readJpegOrientation(head) : 1;
  const manual = orientation !== 1 && !(await browserAppliesOrientation());
  const uprightW = manual && orientationSwapsAxes(orientation) ? bitmap.height : bitmap.width;
  const uprightH = manual && orientationSwapsAxes(orientation) ? bitmap.width : bitmap.height;

  const safe = safeSize(uprightW, uprightH);
  if (safe.scaled) {
    notes.push(
      `This image is very large (${uprightW}×${uprightH}). To stay within your browser’s limits we worked at ${safe.width}×${safe.height}.`,
    );
  }
  const canvas = new OffscreenCanvas(safe.width, safe.height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new ToolError('out-of-memory', 'No 2D context');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const s = safe.width / uprightW;
  ctx.scale(s, s);
  if (manual) ctx.transform(...orientationTransform(orientation, uprightW, uprightH));
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const img = ctx.getImageData(0, 0, safe.width, safe.height);
  canvas.width = 1;
  canvas.height = 1;
  return { img, format, width: uprightW, height: uprightH };
}

function pickOutput(job: ImageJob, input: ImageFormat, transparent: boolean): OutputFormat {
  if (job.output !== 'same') return job.output;
  if (input === 'jpeg' || input === 'png' || input === 'webp' || input === 'avif') return input;
  return transparent ? 'png' : 'jpeg';
}

async function encode(img: ImageData, format: OutputFormat, job: ImageJob, quality: number): Promise<ArrayBuffer> {
  switch (format) {
    case 'jpeg':
      return encodeJpeg(img, quality);
    case 'webp':
      return encodeWebp(img, quality);
    case 'avif':
      return encodeAvif(img, quality, job.avifSpeed ?? 7);
    case 'png':
      return job.pngColors ? encodePngReduced(img, job.pngColors, job.dither ?? false) : encodePngLossless(img);
  }
}

async function resizeTo(img: ImageData, spec: ResizeSpec, background: string): Promise<ImageData> {
  const ratio = img.width / img.height;
  const W = Math.max(1, Math.round(spec.width ?? (spec.height ?? img.height) * ratio));
  const H = Math.max(1, Math.round(spec.height ?? (spec.width ?? img.width) / ratio));
  if (spec.fit === 'stretch' || (img.width * H === img.height * W)) return resizeImageData(img, W, H);
  const srcRatio = img.width / img.height;
  const dstRatio = W / H;
  if (spec.fit === 'cover') {
    let sw = img.width;
    let sh = img.height;
    if (srcRatio > dstRatio) sw = Math.round(img.height * dstRatio);
    else sh = Math.round(img.width / dstRatio);
    const cropped = crop(img, Math.floor((img.width - sw) / 2), Math.floor((img.height - sh) / 2), sw, sh);
    return resizeImageData(cropped, W, H);
  }
  // contain: scale to fit inside, then center on a background.
  const scale = Math.min(W / img.width, H / img.height);
  const iw = Math.max(1, Math.round(img.width * scale));
  const ih = Math.max(1, Math.round(img.height * scale));
  const inner = await resizeImageData(img, iw, ih);
  const out = new ImageData(W, H);
  const [r, g, b] = parseColor(background);
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i] = r;
    out.data[i + 1] = g;
    out.data[i + 2] = b;
    out.data[i + 3] = background === 'transparent' ? 0 : 255;
  }
  const ox = Math.floor((W - iw) / 2);
  const oy = Math.floor((H - ih) / 2);
  for (let y = 0; y < ih; y++) out.data.set(inner.data.subarray(y * iw * 4, (y + 1) * iw * 4), ((y + oy) * W + ox) * 4);
  return out;
}

/**
 * Finds the highest quality that fits under targetBytes. If even the minimum
 * quality is too big, scales the image down step by step until it fits.
 */
export async function encodeToTarget(
  source: ImageData,
  format: 'jpeg' | 'webp',
  targetBytes: number,
  options: { keepDimensions: boolean; minQuality?: number; maxQuality?: number },
  ctx?: HandlerContext,
): Promise<{ buffer: ArrayBuffer; quality: number; width: number; height: number }> {
  const enc = (img: ImageData, q: number) => (format === 'jpeg' ? encodeJpeg(img, q) : encodeWebp(img, q));
  const maxQ = options.maxQuality ?? 92;
  const minQ = options.keepDimensions ? 1 : (options.minQuality ?? 40);
  let current = source;
  let attempt = 0;
  while (true) {
    attempt++;
    ctx?.progress(Math.min(0.95, 0.2 + attempt * 0.08), `Finding the best quality (${current.width}×${current.height})…`);
    const high = await enc(current, maxQ);
    if (high.byteLength <= targetBytes) return { buffer: high, quality: maxQ, width: current.width, height: current.height };
    const low = await enc(current, minQ);
    if (low.byteLength <= targetBytes) {
      let lo = minQ;
      let hi = maxQ;
      let best = low;
      let bestQ = minQ;
      while (hi - lo > 1) {
        const mid = Math.floor((lo + hi) / 2);
        const out = await enc(current, mid);
        if (out.byteLength <= targetBytes) {
          lo = mid;
          best = out;
          bestQ = mid;
        } else hi = mid;
      }
      return { buffer: best, quality: bestQ, width: current.width, height: current.height };
    }
    if (options.keepDimensions) {
      throw new ToolError(
        'target-impossible',
        'Too large at lowest quality',
        `Even at the lowest quality this image is ${Math.ceil(low.byteLength / 1000)} KB at ${current.width}×${current.height} pixels. Allow resizing, or choose a larger target.`,
      );
    }
    // Shrink the pixel size in proportion to how far off we are (never less than 10% per step).
    const ratio = Math.min(0.9, Math.max(0.35, Math.sqrt(targetBytes / low.byteLength) * 0.95));
    const w = Math.round(current.width * ratio);
    const h = Math.round(current.height * ratio);
    if (w < 16 || h < 16) {
      throw new ToolError('target-impossible', 'Target too small', `We couldn’t get this image under ${Math.round(targetBytes / 1000)} KB. Please choose a larger target size.`);
    }
    current = await resizeImageData(current, w, h);
  }
}

export async function processImage(req: ProcessRequest, ctx: HandlerContext): Promise<ImageResult> {
  const notes: string[] = [];
  const job = req.job;
  ctx.progress(0.05, 'Opening your image…');
  const loaded = await loadPixels(req, notes);
  let img = loaded.img;
  const transparent = hasTransparency(img);
  const format = pickOutput(job, loaded.format, transparent);
  const background = job.background ?? '#ffffff';

  if (job.resize) {
    ctx.progress(0.15, 'Resizing…');
    img = await resizeTo(img, job.resize, transparent && format !== 'jpeg' ? 'transparent' : background);
  } else if (job.scalePercent && job.scalePercent !== 100) {
    ctx.progress(0.15, 'Resizing…');
    const s = job.scalePercent / 100;
    img = await resizeImageData(img, Math.max(1, Math.round(loaded.width * s)), Math.max(1, Math.round(loaded.height * s)));
  }

  if (format === 'jpeg' && transparent) {
    flatten(img, background);
    notes.push('Transparent areas were filled with white, because JPG can’t store transparency.');
  }

  let buffer: ArrayBuffer;
  let quality: number | undefined = job.quality;
  let width = img.width;
  let height = img.height;
  if (job.targetBytes && (format === 'jpeg' || format === 'webp')) {
    const out = await encodeToTarget(img, format, job.targetBytes, { keepDimensions: !!job.keepDimensions }, ctx);
    buffer = out.buffer;
    quality = out.quality;
    if (out.width !== width) notes.push(`To fit the size limit we reduced the image to ${out.width}×${out.height} pixels.`);
    width = out.width;
    height = out.height;
  } else {
    ctx.progress(0.4, format === 'avif' ? 'Encoding AVIF (this one takes a little longer)…' : 'Compressing…');
    buffer = await encode(img, format, job, job.quality);
  }

  if (job.keepOriginalIfLarger && req.blob && format === loaded.format && !job.resize && !job.scalePercent && !notes.some((n) => n.includes('very large'))) {
    if (buffer.byteLength >= req.blob.size) {
      return {
        buffer: await req.blob.arrayBuffer(),
        format,
        width,
        height,
        inputWidth: loaded.width,
        inputHeight: loaded.height,
        inputFormat: loaded.format,
        keptOriginal: true,
        notes: ['This image was already well optimized, so we kept your original. Try a lower quality or another format for a smaller file.'],
      };
    }
  }

  ctx.progress(1, 'Done');
  return { buffer, format, width, height, inputWidth: loaded.width, inputHeight: loaded.height, inputFormat: loaded.format, quality, notes };
}

/** Encodes already-prepared pixels (used by the passport photo maker). */
export async function encodePixels(
  pixels: PixelSource,
  format: OutputFormat,
  quality: number,
  targetBytes: number | undefined,
  ctx: HandlerContext,
): Promise<{ buffer: ArrayBuffer; quality: number }> {
  const img = new ImageData(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height);
  if (targetBytes && (format === 'jpeg' || format === 'webp')) {
    const out = await encodeToTarget(img, format, targetBytes, { keepDimensions: true, maxQuality: 95 }, ctx);
    return { buffer: out.buffer, quality: out.quality };
  }
  return { buffer: await encode(img, format, { output: format, quality }, quality), quality };
}
