// WebAssembly codecs (jSquash, Apache-2.0), loaded lazily inside our own worker.
// All builds used here are single-threaded, so no cross-origin isolation is needed.
import type { AVIFModule } from '@jsquash/avif/codec/enc/avif_enc';

let avifModule: Promise<AVIFModule> | null = null;
let resizeReady: Promise<unknown> | null = null;

export async function encodeJpeg(img: ImageData, quality: number): Promise<ArrayBuffer> {
  const { default: encode } = await import('@jsquash/jpeg/encode');
  return encode(img, { quality: clampQ(quality), progressive: true, optimize_coding: true });
}

export async function encodeWebp(img: ImageData, quality: number): Promise<ArrayBuffer> {
  const { default: encode } = await import('@jsquash/webp/encode');
  return encode(img, { quality: clampQ(quality), method: 4 });
}

export async function encodeAvif(img: ImageData, quality: number, speed = 7): Promise<ArrayBuffer> {
  if (!avifModule) {
    // Import the single-threaded encoder directly (the package would otherwise
    // pick a multi-threaded build when SharedArrayBuffer is available).
    avifModule = Promise.all([
      import('@jsquash/avif/codec/enc/avif_enc.js'),
      import('@jsquash/avif/utils.js'),
    ]).then(([factory, utils]) => utils.initEmscriptenModule(factory.default) as Promise<AVIFModule>);
  }
  const module = await avifModule;
  const { defaultOptions } = await import('@jsquash/avif/meta.js');
  const out = module.encode(new Uint8Array(img.data.buffer, img.data.byteOffset, img.data.byteLength), img.width, img.height, {
    ...defaultOptions,
    quality: clampQ(quality),
    speed,
  });
  if (!out) throw new Error('AVIF encoding failed');
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer;
}

export async function encodePngLossless(img: ImageData): Promise<ArrayBuffer> {
  const { default: encode } = await import('@jsquash/png/encode');
  return encode(img);
}

export async function encodePngReduced(img: ImageData, colors: number, dither: boolean): Promise<ArrayBuffer> {
  const { quantize, encodeIndexedPng } = await import('./quantize');
  const q = quantize(img.data, img.width, img.height, colors, dither);
  const bytes = encodeIndexedPng(q, img.width, img.height);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

/** High-quality Lanczos3 resize in linear light with premultiplied alpha. */
export async function resizeImageData(img: ImageData, width: number, height: number): Promise<ImageData> {
  if (img.width === width && img.height === height) return img;
  const mod = await import('@jsquash/resize/lib/resize/pkg/squoosh_resize.js');
  resizeReady ??= mod.default();
  await resizeReady;
  const out = mod.resize(new Uint8Array(img.data.buffer, img.data.byteOffset, img.data.byteLength), img.width, img.height, width, height, 3, true, true);
  const data = new Uint8ClampedArray(out.byteLength);
  data.set(out);
  return new ImageData(data, width, height);
}

/** Decoders used only when the browser itself can't read a WebP or AVIF file. */
export async function decodeWithCodec(format: 'webp' | 'avif', buffer: ArrayBuffer): Promise<ImageData> {
  if (format === 'webp') {
    const { default: decode } = await import('@jsquash/webp/decode');
    return decode(buffer);
  }
  const { default: decode } = await import('@jsquash/avif/decode');
  const out = await decode(buffer);
  if (!out) throw new Error('AVIF decoding failed');
  return out as ImageData;
}

function clampQ(q: number): number {
  return Math.max(1, Math.min(100, Math.round(q)));
}
