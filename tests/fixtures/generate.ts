// Creates every test fixture from scratch, so the repository never needs to
// ship binary test files. Images are drawn with Chromium's canvas (driven by
// Playwright), PDFs are built with pdf-lib.
//
//   node tests/fixtures/generate.ts          (skips if already generated)
//   node tests/fixtures/generate.ts --force

import { chromium } from 'playwright';
import { PDFDocument, StandardFonts, rgb, degrees, PDFName, PDFNumber } from 'pdf-lib';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const FIXTURE_DIR = join(here, 'files');
const VERSION = 5;

function insertExifOrientation(jpeg: Buffer, orientation: number): Buffer {
  // APP1 "Exif" segment with a single IFD0 entry: Orientation (0x0112), SHORT.
  const tiff = Buffer.alloc(8 + 2 + 12 + 4);
  tiff.write('II', 0, 'ascii');
  tiff.writeUInt16LE(42, 2);
  tiff.writeUInt32LE(8, 4);
  tiff.writeUInt16LE(1, 8);
  tiff.writeUInt16LE(0x0112, 10);
  tiff.writeUInt16LE(3, 12);
  tiff.writeUInt32LE(1, 14);
  tiff.writeUInt16LE(orientation, 18);
  tiff.writeUInt16LE(0, 20);
  tiff.writeUInt32LE(0, 22);
  const payload = Buffer.concat([Buffer.from('Exif\0\0', 'binary'), tiff]);
  const header = Buffer.alloc(4);
  header.writeUInt16BE(0xffe1, 0);
  header.writeUInt16BE(payload.length + 2, 2);
  return Buffer.concat([jpeg.subarray(0, 2), header, payload, jpeg.subarray(2)]);
}

function encryptedPdf(): Buffer {
  // A tiny hand-written PDF whose trailer references an /Encrypt dictionary.
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>',
    `<< /Filter /Standard /V 2 /R 3 /Length 128 /P -3904 /O <${'5a'.repeat(32)}> /U <${'a5'.repeat(32)}> >>`,
  ];
  let out = '%PDF-1.7\n%\xE2\xE3\xCF\xD3\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(out, 'latin1'));
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = Buffer.byteLength(out, 'latin1');
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) out += `${String(o).padStart(10, '0')} 00000 n \n`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Encrypt 4 0 R /ID [<${'11'.repeat(16)}> <${'11'.repeat(16)}>] >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

async function drawImages() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<html><body></body></html>');
  const result = await page.evaluate(async () => {
    let seed = 42;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    function photo(w: number, h: number, opaque = true) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const g = c.getContext('2d')!;
      if (opaque) {
        const sky = g.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, '#7fb8e8');
        sky.addColorStop(0.6, '#f7d6b8');
        sky.addColorStop(1, '#5d8a4a');
        g.fillStyle = sky;
        g.fillRect(0, 0, w, h);
      }
      g.fillStyle = '#ffcf5a';
      g.beginPath();
      g.arc(w * 0.75, h * 0.25, Math.min(w, h) * 0.1, 0, Math.PI * 2);
      g.fill();
      for (let i = 0; i < 160; i++) {
        g.fillStyle = `hsla(${Math.floor(rand() * 360)},60%,${30 + rand() * 40}%,${0.25 + rand() * 0.5})`;
        g.beginPath();
        g.ellipse(rand() * w, h * 0.4 + rand() * h * 0.6, 10 + rand() * w * 0.08, 6 + rand() * h * 0.06, rand() * 3, 0, Math.PI * 2);
        g.fill();
      }
      // Fine noise makes the image behave like a real camera photo for compression.
      const img = g.getImageData(0, 0, w, h);
      for (let i = 0; i < img.data.length; i += 4) {
        const n = (rand() - 0.5) * 28;
        img.data[i] = Math.max(0, Math.min(255, img.data[i]! + n));
        img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1]! + n));
        img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2]! + n));
      }
      g.putImageData(img, 0, 0);
      return c;
    }
    const toB64 = (c: HTMLCanvasElement, type: string, q?: number) =>
      new Promise<string>((resolve) =>
        c.toBlob(async (b) => {
          const buf = new Uint8Array(await b!.arrayBuffer());
          let s = '';
          for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
          resolve(btoa(s));
        }, type, q),
      );

    const out: Record<string, string> = {};
    out['photo.jpg'] = await toB64(photo(1600, 1200), 'image/jpeg', 0.95);
    out['photo-small.jpg'] = await toB64(photo(480, 360), 'image/jpeg', 0.9);
    out['photo.png'] = await toB64(photo(800, 600), 'image/png');
    out['photo.webp'] = await toB64(photo(800, 600), 'image/webp', 0.9);
    out['large.jpg'] = await toB64(photo(4000, 2500), 'image/jpeg', 0.9);

    // Transparent PNG/WebP: left half fully transparent, right half a solid coral block.
    const t = document.createElement('canvas');
    t.width = 400;
    t.height = 300;
    const tg = t.getContext('2d')!;
    tg.fillStyle = '#e0523c';
    tg.fillRect(200, 0, 200, 300);
    tg.fillStyle = 'rgba(19,97,91,0.5)';
    tg.fillRect(220, 40, 120, 120);
    out['transparent.png'] = await toB64(t, 'image/png');
    out['transparent.webp'] = await toB64(t, 'image/webp', 0.9);

    // EXIF test image: 600x400 stored sideways. Top-left corner (stored) is pure red.
    const e = document.createElement('canvas');
    e.width = 600;
    e.height = 400;
    const eg = e.getContext('2d')!;
    eg.fillStyle = '#2050c0';
    eg.fillRect(0, 0, 600, 400);
    eg.fillStyle = '#ff0000';
    eg.fillRect(0, 0, 150, 100);
    out['exif6-raw.jpg'] = await toB64(e, 'image/jpeg', 0.92);

    // OCR: big, clear printed words.
    const o = document.createElement('canvas');
    o.width = 1400;
    o.height = 420;
    const og = o.getContext('2d')!;
    og.fillStyle = '#ffffff';
    og.fillRect(0, 0, 1400, 420);
    og.fillStyle = '#111111';
    og.font = 'bold 80px Arial, Helvetica, "DejaVu Sans", sans-serif';
    og.textBaseline = 'top';
    og.fillText('The quick brown fox', 60, 70);
    og.fillText('jumps over the lazy dog', 60, 230);
    out['ocr.png'] = await toB64(o, 'image/png');

    // A simple logo for QR tests.
    const l = document.createElement('canvas');
    l.width = 200;
    l.height = 200;
    const lg = l.getContext('2d')!;
    lg.fillStyle = '#c2412d';
    lg.beginPath();
    lg.arc(100, 100, 96, 0, Math.PI * 2);
    lg.fill();
    lg.fillStyle = '#ffffff';
    lg.font = 'bold 120px Arial, sans-serif';
    lg.textAlign = 'center';
    lg.textBaseline = 'middle';
    lg.fillText('H', 100, 108);
    out['logo.png'] = await toB64(l, 'image/png');

    // A transparent "signature" image for the upload option of Sign PDF.
    const s = document.createElement('canvas');
    s.width = 500;
    s.height = 160;
    const sg = s.getContext('2d')!;
    sg.strokeStyle = '#1a237e';
    sg.lineWidth = 6;
    sg.lineCap = 'round';
    sg.beginPath();
    sg.moveTo(30, 110);
    sg.bezierCurveTo(90, 10, 140, 150, 200, 70);
    sg.bezierCurveTo(250, 10, 300, 140, 360, 60);
    sg.bezierCurveTo(400, 20, 440, 120, 470, 90);
    sg.stroke();
    out['signature.png'] = await toB64(s, 'image/png');
    return out;
  });
  await browser.close();
  return Object.fromEntries(Object.entries(result).map(([k, v]) => [k, Buffer.from(v, 'base64')]));
}

async function textPdf(pages: number, label: (i: number) => string, size: [number, number]) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pages; i++) {
    const page = doc.addPage(size);
    page.drawText(label(i), { x: 60, y: size[1] - 100, size: 28, font, color: rgb(0.1, 0.1, 0.1) });
    page.drawText('This page was generated for automated tests.', { x: 60, y: size[1] - 150, size: 14, font });
  }
  return Buffer.from(await doc.save());
}

async function formPdf() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]);
  const form = doc.getForm();
  page.drawText('Membership form', { x: 50, y: 780, size: 24, font });
  page.drawText('Full name', { x: 50, y: 720, size: 12, font });
  const name = form.createTextField('fullName');
  name.addToPage(page, { x: 50, y: 690, width: 300, height: 24 });
  page.drawText('I agree to the rules', { x: 80, y: 650, size: 12, font });
  const agree = form.createCheckBox('agree');
  agree.addToPage(page, { x: 50, y: 645, width: 18, height: 18 });
  page.drawText('Plan: basic / pro', { x: 50, y: 610, size: 12, font });
  const plan = form.createRadioGroup('plan');
  plan.addOptionToPage('basic', page, { x: 50, y: 580, width: 18, height: 18 });
  plan.addOptionToPage('pro', page, { x: 120, y: 580, width: 18, height: 18 });
  page.drawText('Country', { x: 50, y: 545, size: 12, font });
  const country = form.createDropdown('country');
  country.addOptions(['Canada', 'Germany', 'India', 'Mexico']);
  country.addToPage(page, { x: 50, y: 515, width: 200, height: 24 });
  return Buffer.from(await doc.save());
}

async function rotatedPdf() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]);
  page.drawText('Rotated source page', { x: 60, y: 760, size: 24, font });
  page.setRotation(degrees(90));
  return Buffer.from(await doc.save());
}

async function imagePdf(image: Buffer, kind: 'png' | 'jpg', pages: number) {
  const doc = await PDFDocument.create();
  const embedded = kind === 'png' ? await doc.embedPng(image) : await doc.embedJpg(image);
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage([595, 842]);
    const scale = Math.min(515 / embedded.width, 760 / embedded.height);
    page.drawImage(embedded, { x: 40, y: 842 - 40 - embedded.height * scale, width: embedded.width * scale, height: embedded.height * scale });
  }
  return Buffer.from(await doc.save());
}

async function bloatedPdf() {
  // Uncompressed content streams and no object streams: "light" compression should shrink it.
  const doc = await PDFDocument.create();
  const fontRef = doc.context.obj({ Type: 'Font', Subtype: 'Type1', BaseFont: 'Helvetica' });
  for (let p = 1; p <= 3; p++) {
    const page = doc.addPage([595, 842]);
    let ops = '';
    for (let line = 0; line < 60; line++) {
      ops += `BT /F1 10 Tf 40 ${800 - line * 12} Td (Bloated test page ${p} line ${line} with plenty of repeated words to compress well.) Tj ET\n`;
    }
    const stream = doc.context.stream(ops);
    page.node.set(PDFName.of('Contents'), doc.context.register(stream));
    page.node.setFontDictionary(PDFName.of('F1'), doc.context.register(fontRef));
    page.node.set(PDFName.of('UserUnit'), PDFNumber.of(1));
  }
  return Buffer.from(await doc.save({ useObjectStreams: false }));
}

export async function generateFixtures(force = false) {
  const stamp = join(FIXTURE_DIR, `.version-${VERSION}`);
  if (!force && existsSync(stamp)) return;
  mkdirSync(FIXTURE_DIR, { recursive: true });
  const images = await drawImages();
  for (const [name, buf] of Object.entries(images)) if (name !== 'exif6-raw.jpg') writeFileSync(join(FIXTURE_DIR, name), buf);
  writeFileSync(join(FIXTURE_DIR, 'exif6.jpg'), insertExifOrientation(images['exif6-raw.jpg']!, 6));

  const doc3 = await textPdf(3, (i) => `HugMyFile test page ${i}`, [595, 842]);
  writeFileSync(join(FIXTURE_DIR, 'doc3.pdf'), doc3);
  writeFileSync(join(FIXTURE_DIR, 'docB.pdf'), await textPdf(2, (i) => `Second document page ${i}`, [612, 792]));
  writeFileSync(join(FIXTURE_DIR, 'form.pdf'), await formPdf());
  writeFileSync(join(FIXTURE_DIR, 'rotated.pdf'), await rotatedPdf());
  writeFileSync(join(FIXTURE_DIR, 'encrypted.pdf'), encryptedPdf());
  writeFileSync(join(FIXTURE_DIR, 'corrupted.pdf'), doc3.subarray(0, 200));
  writeFileSync(join(FIXTURE_DIR, 'scanned.pdf'), await imagePdf(images['ocr.png']!, 'png', 1));
  writeFileSync(join(FIXTURE_DIR, 'photos.pdf'), await imagePdf(images['large.jpg']!, 'jpg', 2));
  writeFileSync(join(FIXTURE_DIR, 'bloated.pdf'), await bloatedPdf());

  // Not a real HEIC: just the file-type box followed by junk, enough to look like HEIC.
  const heic = Buffer.alloc(4096, 7);
  heic.writeUInt32BE(24, 0);
  heic.write('ftypheic', 4, 'ascii');
  heic.writeUInt32BE(0, 12);
  heic.write('mif1heic', 16, 'ascii');
  writeFileSync(join(FIXTURE_DIR, 'fake.heic'), heic);

  writeFileSync(stamp, new Date().toISOString());
  console.log(`Fixtures written to ${FIXTURE_DIR}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await generateFixtures(process.argv.includes('--force'));
  // Print sizes for a quick sanity check.
  for (const name of ['photo.jpg', 'large.jpg', 'exif6.jpg', 'doc3.pdf', 'photos.pdf', 'bloated.pdf']) {
    console.log(name, readFileSync(join(FIXTURE_DIR, name)).length);
  }
}
