import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { PDFDocument, StandardFonts, degrees } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  addPageNumbers,
  applyOverlays,
  baselineOffset,
  compressLight,
  extract,
  fillForm,
  imagesToPdf,
  inspect,
  merge,
  openDoc,
  organize,
  readForm,
  rotate,
  type FontLoader,
} from '../../src/lib/pdf/ops';
import { checkText, checkFormText, splitRuns } from '../../src/lib/pdf/text';
import { ToolError } from '../../src/lib/errors';

const loadFont: FontLoader = async (subset, bold) =>
  new Uint8Array(readFileSync(`node_modules/@fontsource/noto-sans/files/noto-sans-${subset}-${bold ? 700 : 400}-normal.woff`));

async function makePdf(pages: number, rotation = 0, label = 'Page'): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pages; i++) {
    const p = doc.addPage([595, 842]);
    p.drawText(`${label} ${i}`, { x: 50, y: 780, size: 20, font });
    if (rotation) p.setRotation(degrees(rotation));
  }
  return doc.save();
}

async function texts(bytes: Uint8Array): Promise<string[]> {
  const task = pdfjs.getDocument({ data: bytes.slice(), verbosity: 0 });
  const doc = await task.promise;
  const out: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const tc = await (await doc.getPage(i)).getTextContent();
    out.push(tc.items.map((it) => ('str' in it ? it.str : '')).join(' ').replace(/\s+/g, ' ').trim());
  }
  await task.destroy();
  return out;
}

function encryptedPdf(): Uint8Array {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>',
    `<< /Filter /Standard /V 2 /R 3 /Length 128 /P -3904 /O <${'5a'.repeat(32)}> /U <${'a5'.repeat(32)}> >>`,
  ];
  let out = '%PDF-1.7\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) out += `${String(o).padStart(10, '0')} 00000 n \n`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Encrypt 4 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}

describe('opening PDFs', () => {
  it('reports encrypted PDFs', async () => {
    await expect(openDoc(encryptedPdf())).rejects.toMatchObject({ code: 'encrypted-pdf' });
  });
  it('reports damaged PDFs', async () => {
    const good = await makePdf(3);
    await expect(openDoc(good.slice(0, 200))).rejects.toBeInstanceOf(ToolError);
    await expect(openDoc(new TextEncoder().encode('not a pdf at all'))).rejects.toMatchObject({ code: 'damaged-pdf' });
  });
});

describe('page operations', () => {
  it('merges in order', async () => {
    const out = await merge([await makePdf(2, 0, 'A'), await makePdf(1, 0, 'B')]);
    expect(await texts(out)).toEqual(['A 1', 'A 2', 'B 1']);
  });
  it('extracts and reorders pages', async () => {
    const src = await makePdf(3);
    expect(await texts(await extract(src, [2, 0]))).toEqual(['Page 3', 'Page 1']);
    expect(await texts(await organize(src, [2, 0, 1]))).toEqual(['Page 3', 'Page 1', 'Page 2']);
    expect(await texts(await organize(src, [0, 2]))).toEqual(['Page 1', 'Page 3']);
  });
  it('rotates pages clockwise', async () => {
    const out = await rotate(await makePdf(2, 90), [90, 270]);
    const info = await inspect(out);
    expect(info.pages.map((p) => p.rotation)).toEqual([180, 0]);
  });
  it('adds page numbers that can be read back', async () => {
    const out = await addPageNumbers(await makePdf(3), { position: 'bottom-center', format: 'Page {n} of {total}', size: 12, startAt: 1, fromPage: 1, margin: 24, color: '#000000' });
    const t = await texts(out);
    expect(t[0]).toContain('Page 1 of 3');
    expect(t[2]).toContain('Page 3 of 3');
  });
  it('builds a PDF from images', async () => {
    const png = readFileSync('src/assets/brand/../../../public/icons/icon-192.png');
    const out = await imagesToPdf([{ bytes: new Uint8Array(png), kind: 'png' }, { bytes: new Uint8Array(png), kind: 'png' }], { size: 'a4', orientation: 'auto', margin: 20 });
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(2);
    expect(Math.round(doc.getPage(0).getWidth())).toBe(595);
  });
});

describe('light compression', () => {
  it('compresses uncompressed streams and keeps text', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595, 842]);
    const font = doc.context.register(doc.context.obj({ Type: 'Font', Subtype: 'Type1', BaseFont: 'Helvetica' }));
    let ops = '';
    for (let i = 0; i < 50; i++) ops += `BT /F1 10 Tf 40 ${800 - i * 12} Td (Repeated line ${i} of text that compresses well.) Tj ET\n`;
    const { PDFName } = await import('pdf-lib');
    page.node.set(PDFName.of('Contents'), doc.context.register(doc.context.stream(ops)));
    page.node.setFontDictionary(PDFName.of('F1'), font);
    const bytes = await doc.save({ useObjectStreams: false });
    const out = await compressLight(bytes);
    expect(out.length).toBeLessThan(bytes.length);
    expect((await texts(out))[0]).toContain('Repeated line 0 of text');
  });
});

describe('text placement on rotated pages', () => {
  for (const rotation of [0, 90, 180, 270]) {
    it(`places text exactly where the editor shows it (rotation ${rotation})`, async () => {
      const src = await makePdf(1, rotation);
      const out = await applyOverlays(src, [{ kind: 'text', page: 0, x: 100, y: 200, w: 200, h: 30, text: 'Hello Ñandú', size: 24, color: '#112233', bold: false, lineHeight: 1.25 }], loadFont);
      const task = pdfjs.getDocument({ data: out.slice(), verbosity: 0 });
      const doc = await task.promise;
      const page = await doc.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const tc = await page.getTextContent();
      const item = tc.items.find((it) => 'str' in it && it.str.startsWith('Hello')) as { transform: number[] } | undefined;
      expect(item, 'text found').toBeTruthy();
      const m = pdfjs.Util.transform(viewport.transform, item!.transform);
      // Upright: horizontal baseline running left to right on screen.
      expect(m[0]).toBeGreaterThan(0);
      expect(Math.abs(m[1]!)).toBeLessThan(0.01);
      expect(m[4]).toBeCloseTo(100, 0);
      expect(m[5]).toBeCloseTo(200 + baselineOffset(24, 1.25), 0);
      const all = tc.items.map((it) => ('str' in it ? it.str : '')).join('');
      expect(all).toContain('Hello Ñandú');
      await task.destroy();
    });
  }
});

describe('forms', () => {
  it('reads and fills text, checkbox, radio and dropdown fields', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595, 842]);
    const form = doc.getForm();
    form.createTextField('fullName').addToPage(page, { x: 50, y: 700, width: 300, height: 24 });
    form.createCheckBox('agree').addToPage(page, { x: 50, y: 650, width: 18, height: 18 });
    const plan = form.createRadioGroup('plan');
    plan.addOptionToPage('basic', page, { x: 50, y: 600, width: 18, height: 18 });
    plan.addOptionToPage('pro', page, { x: 100, y: 600, width: 18, height: 18 });
    const country = form.createDropdown('country');
    country.addOptions(['Canada', 'Germany']);
    country.addToPage(page, { x: 50, y: 550, width: 200, height: 24 });
    const bytes = await doc.save();

    const info = await readForm(bytes);
    expect(info.xfa).toBe(false);
    expect(info.fields.map((f) => [f.name, f.type])).toEqual([
      ['fullName', 'text'],
      ['agree', 'checkbox'],
      ['plan', 'radio'],
      ['country', 'dropdown'],
    ]);

    const filled = await fillForm(bytes, { fullName: 'José Müller', agree: true, plan: 'pro', country: 'Germany' }, false, loadFont);
    const back = (await PDFDocument.load(filled)).getForm();
    expect(back.getTextField('fullName').getText()).toBe('José Müller');
    expect(back.getCheckBox('agree').isChecked()).toBe(true);
    expect(back.getRadioGroup('plan').getSelected()).toBe('pro');
    expect(back.getDropdown('country').getSelected()).toEqual(['Germany']);

    const flat = await fillForm(bytes, { fullName: 'José Müller', agree: true, plan: 'pro', country: 'Germany' }, true, loadFont);
    expect((await PDFDocument.load(flat)).getForm().getFields()).toHaveLength(0);
    expect((await texts(flat))[0]).toContain('José Müller');
  });
});

describe('script support', () => {
  it('accepts Latin, Greek and Cyrillic text', () => {
    expect(checkText('Ça va? Ñandú Straße ação Ελληνικά Привет')).toBeNull();
  });
  it('rejects Arabic, Urdu and Hindi', () => {
    expect(checkText('مرحبا')).toBe('complex-script');
    expect(checkText('خوش آمدید')).toBe('complex-script');
    expect(checkText('नमस्ते')).toBe('complex-script');
  });
  it('rejects characters without a font', () => {
    expect(checkText('你好')).toBe('unsupported-characters');
    expect(checkText('🙂')).toBe('unsupported-characters');
  });
  it('limits form fields to the Latin font', () => {
    expect(checkFormText('José')).toBeNull();
    expect(checkFormText('Łódź')).toBe('unsupported-characters');
  });
  it('splits text into font runs', () => {
    expect(splitRuns('Hi Привет').map((r) => r.subset)).toEqual(['latin', 'cyrillic']);
  });
});
