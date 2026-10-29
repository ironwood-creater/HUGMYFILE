// PDF operations built on pdf-lib (MIT). These functions are pure: they take
// bytes and return bytes, so they run in our Web Worker and in Node tests alike.
import {
  BlendMode,
  PDFArray,
  PDFCheckBox,
  PDFDict,
  PDFDocument,
  PDFDropdown,
  PDFFont,
  PDFName,
  PDFOptionList,
  PDFPage,
  PDFRadioGroup,
  PDFRawStream,
  PDFRef,
  PDFStream,
  PDFTextField,
  StandardFonts,
  degrees,
  rgb,
} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { zlibSync } from 'fflate';
import { ToolError } from '../errors';
import { normalizeRotation, toPdf, visualSize, type PageBox } from './geometry';
import { checkFormText, checkText, splitRuns, type FontSubset } from './text';
import type { DocInfo, FieldInfo, FieldValues, FormInfo, ImageInput, ImageToPdfOptions, OverlayItem, PageNumberOptions } from './types';

export type FontLoader = (subset: FontSubset, bold: boolean) => Promise<Uint8Array>;

function isEncryptedError(err: unknown): boolean {
  const e = err as { name?: string; constructor?: { name?: string }; message?: string };
  return e?.constructor?.name === 'EncryptedPDFError' || e?.name === 'EncryptedPDFError' || /is encrypted/i.test(e?.message ?? '');
}

/** Opens a PDF for editing, or throws a friendly error for protected or damaged files. */
export async function openDoc(bytes: Uint8Array): Promise<PDFDocument> {
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, { updateMetadata: false, throwOnInvalidObject: false });
  } catch (err) {
    if (isEncryptedError(err)) throw new ToolError('encrypted-pdf');
    throw new ToolError('damaged-pdf', err instanceof Error ? err.message : String(err));
  }
  if (doc.isEncrypted) throw new ToolError('encrypted-pdf');
  let count = 0;
  try {
    count = doc.getPageCount();
    doc.getPages();
  } catch (err) {
    throw new ToolError('damaged-pdf', err instanceof Error ? err.message : String(err));
  }
  if (count === 0) throw new ToolError('damaged-pdf', 'No pages');
  return doc;
}

export function pageBox(page: PDFPage): PageBox {
  const crop = page.getCropBox();
  return { x: crop.x, y: crop.y, width: crop.width, height: crop.height, rotation: normalizeRotation(page.getRotation().angle) };
}

export async function inspect(bytes: Uint8Array): Promise<DocInfo> {
  const doc = await openDoc(bytes);
  return {
    pages: doc.getPages().map((p) => {
      const box = pageBox(p);
      const size = visualSize(box);
      return { width: size.width, height: size.height, rotation: box.rotation };
    }),
  };
}

const save = (doc: PDFDocument) => doc.save({ useObjectStreams: true });

export async function merge(files: Uint8Array[], onProgress?: (v: number) => void): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  for (let i = 0; i < files.length; i++) {
    const src = await openDoc(files[i]!);
    const pages = await out.copyPages(src, src.getPageIndices());
    for (const p of pages) out.addPage(p);
    onProgress?.((i + 1) / files.length);
  }
  return save(out);
}

/** New PDF made of the given pages (0-based, any order, duplicates allowed). */
export async function extract(bytes: Uint8Array, indices: number[]): Promise<Uint8Array> {
  const src = await openDoc(bytes);
  const count = src.getPageCount();
  if (!indices.length || indices.some((i) => i < 0 || i >= count)) throw new ToolError('unknown', 'Page out of range');
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, indices);
  for (const p of pages) out.addPage(p);
  return save(out);
}

export async function splitRanges(bytes: Uint8Array, ranges: number[][], onProgress?: (v: number) => void): Promise<Uint8Array[]> {
  const results: Uint8Array[] = [];
  for (let i = 0; i < ranges.length; i++) {
    results.push(await extract(bytes, ranges[i]!));
    onProgress?.((i + 1) / ranges.length);
  }
  return results;
}

/** Reorders (and drops) pages in place, keeping forms, links and metadata. */
export async function organize(bytes: Uint8Array, order: number[]): Promise<Uint8Array> {
  const doc = await openDoc(bytes);
  const pages = doc.getPages();
  if (!order.length) throw new ToolError('unknown', 'A PDF needs at least one page');
  if (new Set(order).size !== order.length || order.some((i) => i < 0 || i >= pages.length)) throw new ToolError('unknown', 'Invalid page order');
  for (let i = pages.length - 1; i >= 0; i--) doc.removePage(i);
  for (const i of order) doc.addPage(pages[i]!);
  return save(doc);
}

/** Adds a clockwise rotation (multiple of 90°) to each page. */
export async function rotate(bytes: Uint8Array, add: number[]): Promise<Uint8Array> {
  const doc = await openDoc(bytes);
  doc.getPages().forEach((page, i) => {
    const extra = add[i] ?? 0;
    if (extra % 360 !== 0) page.setRotation(degrees(normalizeRotation(page.getRotation().angle + extra)));
  });
  return save(doc);
}

function parseHex(color: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  const n = m ? parseInt(m[1]!, 16) : 0;
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

export async function addPageNumbers(bytes: Uint8Array, o: PageNumberOptions): Promise<Uint8Array> {
  const doc = await openDoc(bytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const first = Math.max(1, Math.min(pages.length, Math.round(o.fromPage))) - 1;
  const total = o.startAt + (pages.length - 1 - first);
  pages.forEach((page, i) => {
    if (i < first) return;
    const n = o.startAt + (i - first);
    const text = o.format.replace(/\{n\}/g, String(n)).replace(/\{total\}/g, String(total));
    const box = pageBox(page);
    const { width: vw, height: vh } = visualSize(box);
    const tw = font.widthOfTextAtSize(text, o.size);
    const vx = o.position.endsWith('left') ? o.margin : o.position.endsWith('right') ? vw - o.margin - tw : (vw - tw) / 2;
    const vy = o.position.startsWith('top') ? o.margin + o.size * 0.75 : vh - o.margin;
    const p = toPdf(box, vx, vy);
    page.drawText(text, { x: p.x, y: p.y, size: o.size, font, color: parseHex(o.color), rotate: degrees(box.rotation) });
  });
  return save(doc);
}

const PAPER: Record<'a4' | 'letter', [number, number]> = { a4: [595.28, 841.89], letter: [612, 792] };

export async function imagesToPdf(images: ImageInput[], o: ImageToPdfOptions, onProgress?: (v: number) => void): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < images.length; i++) {
    const img = images[i]!;
    const embedded = img.kind === 'png' ? await doc.embedPng(img.bytes) : await doc.embedJpg(img.bytes);
    // Treat image pixels as 96 per inch for "fit to image" pages.
    const iw = embedded.width * 0.75;
    const ih = embedded.height * 0.75;
    let pw: number;
    let ph: number;
    if (o.size === 'fit') {
      pw = iw + o.margin * 2;
      ph = ih + o.margin * 2;
    } else {
      const [a, b] = PAPER[o.size];
      const landscape = o.orientation === 'landscape' || (o.orientation === 'auto' && iw > ih);
      pw = landscape ? b : a;
      ph = landscape ? a : b;
    }
    const page = doc.addPage([pw, ph]);
    const scale = o.size === 'fit' ? 1 : Math.min((pw - o.margin * 2) / iw, (ph - o.margin * 2) / ih, 1e9);
    const w = iw * scale;
    const h = ih * scale;
    page.drawImage(embedded, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
    onProgress?.((i + 1) / images.length);
  }
  return save(doc);
}

/** Builds a PDF whose pages are the given JPEG images (used by medium/strong compression). */
export async function imagePagesPdf(pages: { jpg: Uint8Array; width: number; height: number }[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (const p of pages) {
    const page = doc.addPage([p.width, p.height]);
    const img = await doc.embedJpg(p.jpg);
    page.drawImage(img, { x: 0, y: 0, width: p.width, height: p.height });
  }
  return save(doc);
}

/** Removes objects nothing points to (left behind by earlier edits). */
function dropUnreferenced(doc: PDFDocument) {
  const ctx = doc.context;
  const seen = new Set<string>();
  const stack: unknown[] = [ctx.trailerInfo.Root, ctx.trailerInfo.Info];
  while (stack.length) {
    const obj = stack.pop();
    if (!obj) continue;
    if (obj instanceof PDFRef) {
      const key = obj.toString();
      if (seen.has(key)) continue;
      seen.add(key);
      stack.push(ctx.lookup(obj));
    } else if (obj instanceof PDFDict) {
      for (const [, v] of obj.entries()) stack.push(v);
    } else if (obj instanceof PDFArray) {
      for (let i = 0; i < obj.size(); i++) stack.push(obj.get(i));
    } else if (obj instanceof PDFStream) {
      stack.push(obj.dict);
    }
  }
  for (const [ref] of ctx.enumerateIndirectObjects()) if (!seen.has(ref.toString())) ctx.delete(ref);
}

/**
 * "Light" compression: keeps text, links and forms. Compresses uncompressed
 * streams, drops unused objects and re-saves with object streams.
 */
export async function compressLight(bytes: Uint8Array): Promise<Uint8Array> {
  const doc = await openDoc(bytes);
  for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;
    if (obj.dict.has(PDFName.of('Filter'))) continue;
    const type = obj.dict.get(PDFName.of('Type'));
    if (type === PDFName.of('XRef') || type === PDFName.of('ObjStm')) continue;
    const raw = obj.getContents();
    if (raw.length < 64) continue;
    const packed = zlibSync(raw, { level: 9 });
    if (packed.length >= raw.length) continue;
    const dict = obj.dict.clone(doc.context);
    dict.set(PDFName.of('Filter'), PDFName.of('FlateDecode'));
    dict.delete(PDFName.of('DecodeParms'));
    doc.context.assign(ref, PDFRawStream.of(dict, packed));
  }
  dropUnreferenced(doc);
  return save(doc);
}

// ───────────── Text with embedded Noto Sans ─────────────

class Fonts {
  private cache = new Map<string, Promise<PDFFont>>();
  constructor(
    private doc: PDFDocument,
    private load: FontLoader,
  ) {
    doc.registerFontkit(fontkit);
  }
  get(subset: FontSubset, bold: boolean): Promise<PDFFont> {
    const key = `${subset}-${bold}`;
    let f = this.cache.get(key);
    if (!f) {
      f = this.load(subset, bold).then((bytes) => this.doc.embedFont(bytes, { subset: true }));
      this.cache.set(key, f);
    }
    return f;
  }
}

async function drawRuns(page: PDFPage, fonts: Fonts, text: string, o: { x: number; y: number; size: number; bold: boolean; color: ReturnType<typeof rgb>; rotation: number }) {
  const rad = (o.rotation * Math.PI) / 180;
  let x = o.x;
  let y = o.y;
  for (const run of splitRuns(text)) {
    const font = await fonts.get(run.subset, o.bold);
    page.drawText(run.text, { x, y, size: o.size, font, color: o.color, rotate: degrees(o.rotation) });
    const w = font.widthOfTextAtSize(run.text, o.size);
    x += w * Math.cos(rad);
    y += w * Math.sin(rad);
  }
}

/** Noto Sans vertical metrics (per em) used to place text exactly where the editor shows it. */
export const NOTO_ASCENT = 1.069;
export const NOTO_DESCENT = 0.293;

/** Distance from the top of a CSS line box to the baseline, for a given line-height. */
export function baselineOffset(size: number, lineHeight: number): number {
  return ((lineHeight - (NOTO_ASCENT + NOTO_DESCENT)) / 2 + NOTO_ASCENT) * size;
}

export async function applyOverlays(bytes: Uint8Array, items: OverlayItem[], loadFont: FontLoader): Promise<Uint8Array> {
  for (const item of items) {
    if (item.kind === 'text' && checkText(item.text)) throw new ToolError('unsupported-script');
  }
  const doc = await openDoc(bytes);
  const fonts = new Fonts(doc, loadFont);
  const pages = doc.getPages();
  for (const item of items) {
    const page = pages[item.page];
    if (!page) continue;
    const box = pageBox(page);
    const rot = degrees(box.rotation);
    const bottomLeft = toPdf(box, item.x, item.y + item.h);
    switch (item.kind) {
      case 'text': {
        const lines = item.text.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
          if (!lines[i]) continue;
          const vy = item.y + i * item.size * item.lineHeight + baselineOffset(item.size, item.lineHeight);
          const p = toPdf(box, item.x, vy);
          await drawRuns(page, fonts, lines[i]!, { x: p.x, y: p.y, size: item.size, bold: item.bold, color: parseHex(item.color), rotation: box.rotation });
        }
        break;
      }
      case 'image': {
        const img = item.format === 'png' ? await doc.embedPng(item.bytes) : await doc.embedJpg(item.bytes);
        page.drawImage(img, { x: bottomLeft.x, y: bottomLeft.y, width: item.w, height: item.h, rotate: rot });
        break;
      }
      case 'whiteout':
        page.drawRectangle({ x: bottomLeft.x, y: bottomLeft.y, width: item.w, height: item.h, rotate: rot, color: rgb(1, 1, 1), borderWidth: 0 });
        break;
      case 'highlight':
        page.drawRectangle({ x: bottomLeft.x, y: bottomLeft.y, width: item.w, height: item.h, rotate: rot, color: parseHex(item.color), opacity: 0.4, blendMode: BlendMode.Multiply, borderWidth: 0 });
        break;
      case 'rect':
        page.drawRectangle({
          x: bottomLeft.x,
          y: bottomLeft.y,
          width: item.w,
          height: item.h,
          rotate: rot,
          color: item.fill ? parseHex(item.fill) : undefined,
          opacity: item.opacity,
          borderColor: item.stroke ? parseHex(item.stroke) : undefined,
          borderWidth: item.stroke ? item.strokeWidth : 0,
          borderOpacity: item.opacity,
        });
        break;
      case 'ellipse': {
        const c = toPdf(box, item.x + item.w / 2, item.y + item.h / 2);
        page.drawEllipse({
          x: c.x,
          y: c.y,
          xScale: item.w / 2,
          yScale: item.h / 2,
          rotate: rot,
          color: item.fill ? parseHex(item.fill) : undefined,
          opacity: item.opacity,
          borderColor: item.stroke ? parseHex(item.stroke) : undefined,
          borderWidth: item.stroke ? item.strokeWidth : 0,
          borderOpacity: item.opacity,
        });
        break;
      }
    }
  }
  return save(doc);
}

// ───────────── Forms ─────────────

export async function readForm(bytes: Uint8Array): Promise<FormInfo> {
  const doc = await openDoc(bytes);
  const form = doc.getForm();
  const xfa = form.hasXFA();
  const fields: FieldInfo[] = [];
  for (const field of form.getFields()) {
    const base = { name: field.getName(), readOnly: field.isReadOnly(), options: [] as string[], multiline: false, multiSelect: false };
    if (field instanceof PDFTextField) {
      fields.push({ ...base, type: 'text', value: field.getText() ?? '', multiline: field.isMultiline(), maxLength: field.getMaxLength() });
    } else if (field instanceof PDFCheckBox) {
      fields.push({ ...base, type: 'checkbox', value: field.isChecked() });
    } else if (field instanceof PDFRadioGroup) {
      fields.push({ ...base, type: 'radio', value: field.getSelected() ?? '', options: field.getOptions() });
    } else if (field instanceof PDFDropdown) {
      fields.push({ ...base, type: 'dropdown', value: field.getSelected()[0] ?? '', options: field.getOptions() });
    } else if (field instanceof PDFOptionList) {
      fields.push({ ...base, type: 'optionlist', value: field.getSelected(), options: field.getOptions(), multiSelect: field.isMultiselect() });
    }
  }
  return { fields, xfa };
}

export async function fillForm(bytes: Uint8Array, values: FieldValues, flatten: boolean, loadFont: FontLoader): Promise<Uint8Array> {
  for (const v of Object.values(values)) {
    if (typeof v === 'string' && checkFormText(v)) throw new ToolError('unsupported-script');
  }
  const doc = await openDoc(bytes);
  const form = doc.getForm();
  if (form.hasXFA()) form.deleteXFA();
  for (const field of form.getFields()) {
    const name = field.getName();
    if (!(name in values) || field.isReadOnly()) continue;
    const v = values[name]!;
    if (field instanceof PDFTextField && typeof v === 'string') {
      const max = field.getMaxLength();
      field.setText(max !== undefined ? v.slice(0, max) : v);
    } else if (field instanceof PDFCheckBox) {
      if (v === true) field.check();
      else field.uncheck();
    } else if (field instanceof PDFRadioGroup && typeof v === 'string') {
      if (v) field.select(v);
      else field.clear();
    } else if (field instanceof PDFDropdown && typeof v === 'string') {
      if (v) field.select(v);
      else field.clear();
    } else if (field instanceof PDFOptionList && Array.isArray(v)) {
      if (v.length) field.select(v);
      else field.clear();
    }
  }
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(await loadFont('latin', false), { subset: true });
  form.updateFieldAppearances(font);
  if (flatten) form.flatten();
  return save(doc);
}
