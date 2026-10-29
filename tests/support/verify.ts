// Node-side checks for files the tools produce.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';
import { unzipSync } from 'fflate';
import { PDFDocument } from 'pdf-lib';

const require = createRequire(import.meta.url);

export type Format = 'jpeg' | 'png' | 'webp' | 'avif' | 'pdf' | 'zip' | 'svg' | 'unknown';

export function sniff(buf: Buffer): Format {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (buf.toString('ascii', 4, 8) === 'ftyp' && /^avi[fs]/.test(buf.toString('ascii', 8, 12))) return 'avif';
  if (buf.toString('ascii', 0, 5) === '%PDF-') return 'pdf';
  if (buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04) return 'zip';
  if (/^\s*(<\?xml[^>]*>\s*)?<svg[\s>]/.test(buf.toString('utf8', 0, 300))) return 'svg';
  return 'unknown';
}

/** Width/height straight from the file headers (no decoding). */
export function dimensions(buf: Buffer): { width: number; height: number } {
  const fmt = sniff(buf);
  if (fmt === 'png') return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  if (fmt === 'jpeg') {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) throw new Error('Bad JPEG marker');
      const marker = buf[i + 1]!;
      const len = buf.readUInt16BE(i + 2);
      if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
    throw new Error('No SOF in JPEG');
  }
  if (fmt === 'webp') {
    const chunk = buf.toString('ascii', 12, 16);
    if (chunk === 'VP8X') return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
    if (chunk === 'VP8L') {
      const b = buf.readUInt32LE(21);
      return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
    }
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (fmt === 'avif') {
    const idx = buf.indexOf('ispe');
    if (idx < 0) throw new Error('No ispe box in AVIF');
    return { width: buf.readUInt32BE(idx + 8), height: buf.readUInt32BE(idx + 12) };
  }
  throw new Error(`Cannot read dimensions of ${fmt}`);
}

let codecsReady: Promise<void> | null = null;
async function initCodecs() {
  codecsReady ??= (async () => {
    const g = globalThis as unknown as { ImageData?: unknown };
    g.ImageData ??= class {
      data: Uint8ClampedArray;
      width: number;
      height: number;
      constructor(data: Uint8ClampedArray, width: number, height: number) {
        this.data = data;
        this.width = width;
        this.height = height;
      }
    };
    const wasm = (p: string) => WebAssembly.compile(readFileSync(require.resolve(p)));
    const jpeg = await import('@jsquash/jpeg/decode.js');
    await jpeg.init(await wasm('@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm'));
    const webp = await import('@jsquash/webp/decode.js');
    await webp.init(await wasm('@jsquash/webp/codec/dec/webp_dec.wasm'));
    const avif = await import('@jsquash/avif/decode.js');
    await avif.init(await wasm('@jsquash/avif/codec/dec/avif_dec.wasm'));
  })();
  return codecsReady;
}

export interface Pixels {
  width: number;
  height: number;
  data: Uint8ClampedArray | Uint8Array;
}

/** Fully decodes an image to RGBA pixels. */
export async function decode(buf: Buffer): Promise<Pixels> {
  const fmt = sniff(buf);
  if (fmt === 'png') {
    const png = PNG.sync.read(buf);
    return { width: png.width, height: png.height, data: png.data };
  }
  await initCodecs();
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  if (fmt === 'jpeg') return (await import('@jsquash/jpeg/decode.js')).default(ab) as unknown as Promise<Pixels>;
  if (fmt === 'webp') return (await import('@jsquash/webp/decode.js')).default(ab) as unknown as Promise<Pixels>;
  if (fmt === 'avif') {
    const out = await (await import('@jsquash/avif/decode.js')).default(ab);
    if (!out) throw new Error('AVIF decode failed');
    return out as unknown as Pixels;
  }
  throw new Error(`Cannot decode ${fmt}`);
}

export function pixel(img: Pixels, x: number, y: number): [number, number, number, number] {
  const i = (y * img.width + x) * 4;
  return [img.data[i]!, img.data[i + 1]!, img.data[i + 2]!, img.data[i + 3]!];
}

export function unzip(buf: Buffer): Record<string, Buffer> {
  const files = unzipSync(new Uint8Array(buf));
  return Object.fromEntries(Object.entries(files).map(([k, v]) => [k, Buffer.from(v)]));
}

export async function loadPdf(buf: Buffer) {
  return PDFDocument.load(buf);
}

/** Text of every page, extracted with pdf.js (like a PDF reader would). */
export async function pdfText(buf: Buffer): Promise<string[]> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = pdfjs.getDocument({ data: new Uint8Array(buf), verbosity: 0, useSystemFonts: false });
  const doc = await task.promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((it) => ('str' in it ? it.str : '')).join(' ').replace(/\s+/g, ' ').trim());
  }
  await task.destroy();
  return pages;
}

export function decodeQr(png: Buffer): string | null {
  const img = PNG.sync.read(png);
  const res = jsQR(new Uint8ClampedArray(img.data.buffer, img.data.byteOffset, img.data.length), img.width, img.height);
  return res ? res.data : null;
}
