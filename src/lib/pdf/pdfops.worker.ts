import { expose } from '../workerHost';
import * as ops from './ops';
import type { FontSubset } from './text';
import type { FieldValues, ImageInput, ImageToPdfOptions, OverlayItem, PageNumberOptions } from './types';

const fontCache = new Map<string, Promise<Uint8Array>>();
const loadFont: ops.FontLoader = (subset: FontSubset, bold: boolean) => {
  const key = `${subset}-${bold}`;
  let p = fontCache.get(key);
  if (!p) {
    p = fetch(`/fonts/pdf/noto-sans-${subset}-${bold ? 700 : 400}-normal.woff`).then(async (r) => {
      if (!r.ok) throw new Error(`Font download failed (${r.status})`);
      return new Uint8Array(await r.arrayBuffer());
    });
    fontCache.set(key, p);
  }
  return p;
};

const done = (bytes: Uint8Array) => ({ result: bytes, transfer: [bytes.buffer as ArrayBuffer] });

expose({
  async inspect(p: { bytes: Uint8Array }) {
    return { result: await ops.inspect(p.bytes) };
  },
  async merge(p: { files: Uint8Array[] }, ctx) {
    return done(await ops.merge(p.files, (v) => ctx.progress(v, 'Merging…')));
  },
  async extract(p: { bytes: Uint8Array; indices: number[] }) {
    return done(await ops.extract(p.bytes, p.indices));
  },
  async split(p: { bytes: Uint8Array; ranges: number[][] }, ctx) {
    const parts = await ops.splitRanges(p.bytes, p.ranges, (v) => ctx.progress(v, 'Splitting…'));
    return { result: parts, transfer: parts.map((b) => b.buffer as ArrayBuffer) };
  },
  async organize(p: { bytes: Uint8Array; order: number[] }) {
    return done(await ops.organize(p.bytes, p.order));
  },
  async rotate(p: { bytes: Uint8Array; add: number[] }) {
    return done(await ops.rotate(p.bytes, p.add));
  },
  async numbers(p: { bytes: Uint8Array; options: PageNumberOptions }) {
    return done(await ops.addPageNumbers(p.bytes, p.options));
  },
  async imagesToPdf(p: { images: ImageInput[]; options: ImageToPdfOptions }, ctx) {
    return done(await ops.imagesToPdf(p.images, p.options, (v) => ctx.progress(v, 'Building your PDF…')));
  },
  async imagePagesPdf(p: { pages: { jpg: Uint8Array; width: number; height: number }[] }) {
    return done(await ops.imagePagesPdf(p.pages));
  },
  async compressLight(p: { bytes: Uint8Array }) {
    return done(await ops.compressLight(p.bytes));
  },
  async overlays(p: { bytes: Uint8Array; items: OverlayItem[] }) {
    return done(await ops.applyOverlays(p.bytes, p.items, loadFont));
  },
  async readForm(p: { bytes: Uint8Array }) {
    return { result: await ops.readForm(p.bytes) };
  },
  async fillForm(p: { bytes: Uint8Array; values: FieldValues; flatten: boolean }) {
    return done(await ops.fillForm(p.bytes, p.values, p.flatten, loadFont));
  },
});
