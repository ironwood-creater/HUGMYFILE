// Creates marketing images: logo banners (docs/brand) and real screenshots of
// the site in use (docs/screenshots). Demo files are generated on the fly.
// Requires a fresh build: npm run build && node scripts/make-showcase.mjs
import { chromium } from 'playwright';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as lucide from 'lucide';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const brandDir = join(root, 'docs', 'brand');
const shotDir = join(root, 'docs', 'screenshots');
const demoDir = join(tmpdir(), 'hugmyfile-demo');
for (const d of [brandDir, shotDir]) mkdirSync(d, { recursive: true });
rmSync(demoDir, { recursive: true, force: true });
mkdirSync(demoDir, { recursive: true });

const PORT = 4400;
const BASE = `http://localhost:${PORT}`;
const mark = readFileSync(join(root, 'src/assets/brand/logo-mark.svg'), 'utf8');
const fontData = (w) => readFileSync(join(root, `node_modules/@fontsource/nunito/files/nunito-latin-${w}-normal.woff2`)).toString('base64');
const FONTS = `
  @font-face { font-family: Nunito; font-weight: 400; src: url(data:font/woff2;base64,${fontData(400)}) format('woff2'); }
  @font-face { font-family: Nunito; font-weight: 700; src: url(data:font/woff2;base64,${fontData(700)}) format('woff2'); }
  @font-face { font-family: Nunito; font-weight: 800; src: url(data:font/woff2;base64,${fontData(800)}) format('woff2'); }`;
const icon = (name, size = 40, color = 'currentColor') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${lucide[name]
    .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`)
    .join('')}</svg>`;
const markSvg = (id) => mark.replaceAll('hmf-arms', id).replace('<svg ', '<svg width="100%" height="100%" ');

// ───────────── Banners ─────────────

function bannerHtml({ width, height, dark }) {
  const bg = dark ? '#171311' : '#fffbf8';
  const fg = dark ? '#f3ece6' : '#2b2420';
  const muted = dark ? '#b9ada3' : '#5e544d';
  const coral = dark ? '#ff8e7c' : '#c2412d';
  const chipBg = dark ? '#10302d' : '#eaf7f5';
  const chipFg = dark ? '#5cc7ba' : '#13615b';
  const chipBorder = dark ? '#1e4a45' : '#a3ded6';
  const blobA = dark ? 'rgba(238,106,85,0.18)' : '#ffe9e3';
  const blobB = dark ? 'rgba(30,140,128,0.18)' : '#cfeeea';
  const tools = [
    ['Image', 'Image'],
    ['FileText', 'PDF'],
    ['QrCode', 'QR Code'],
    ['PenLine', 'Signature'],
    ['ScanText', 'Image to Text'],
  ];
  const scale = height / 500;
  return `<!doctype html><html><head><style>${FONTS}
    * { box-sizing: border-box; }
    body { margin: 0; width: ${width}px; height: ${height}px; overflow: hidden; font-family: Nunito, sans-serif; color: ${fg};
      background: radial-gradient(55% 80% at 8% 15%, ${blobA}, transparent 70%), radial-gradient(45% 75% at 96% 85%, ${blobB}, transparent 70%), ${bg}; }
    .wrap { height: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0 ${90 * scale}px; gap: ${60 * scale}px; }
    .left { display: flex; align-items: center; gap: ${44 * scale}px; }
    .mark { width: ${230 * scale}px; height: ${230 * scale}px; flex: none; filter: drop-shadow(0 ${10 * scale}px ${24 * scale}px rgba(194,65,45,0.18)); }
    .name { font-size: ${104 * scale}px; font-weight: 800; letter-spacing: ${-2 * scale}px; line-height: 1; }
    .name b { color: ${coral}; font-weight: 800; }
    .tag { font-size: ${40 * scale}px; font-weight: 800; margin-top: ${18 * scale}px; letter-spacing: ${-0.5 * scale}px; }
    .sub { font-size: ${24 * scale}px; line-height: 1.35; color: ${muted}; margin-top: ${10 * scale}px; white-space: nowrap; }
    .tools { display: grid; grid-template-columns: repeat(2, auto); gap: ${14 * scale}px; }
    .tool { display: flex; align-items: center; gap: ${12 * scale}px; font-size: ${22 * scale}px; font-weight: 800; padding: ${12 * scale}px ${20 * scale}px;
      border-radius: 999px; background: ${chipBg}; color: ${chipFg}; border: ${2 * scale}px solid ${chipBorder}; white-space: nowrap; }
    .tool:last-child { grid-column: span 2; justify-self: start; }
  </style></head><body><div class="wrap">
    <div class="left">
      <div class="mark">${markSvg(`b${width}${dark ? 'd' : 'l'}`)}</div>
      <div>
        <div class="name">Hug<b>My</b>File</div>
        <div class="tag">Pro features. Free forever.</div>
        <div class="sub">No signup · No watermark<br>Your files never leave your device</div>
      </div>
    </div>
    ${width / height >= 3 ? `<div class="tools">${tools.map(([i, l]) => `<div class="tool">${icon(i, 26 * scale, chipFg)}${l}</div>`).join('')}</div>` : ''}
  </div></body></html>`;
}

function logoHtml({ size, wordmark, dark }) {
  const fg = dark ? '#f3ece6' : '#2b2420';
  const coral = dark ? '#ff8e7c' : '#c2412d';
  if (!wordmark) return `<!doctype html><html><body style="margin:0;background:transparent"><div style="width:${size}px;height:${size}px">${markSvg('lm')}</div></body></html>`;
  return `<!doctype html><html><head><style>${FONTS} body{margin:0;background:transparent;font-family:Nunito}</style></head><body>
    <div id="logo" style="display:inline-flex;align-items:center;gap:${size * 0.18}px;padding:${size * 0.1}px">
      <div style="width:${size}px;height:${size}px">${markSvg('lw')}</div>
      <div style="font-size:${size * 0.56}px;font-weight:800;letter-spacing:-${size * 0.012}px;color:${fg}">Hug<span style="color:${coral}">My</span>File</div>
    </div></body></html>`;
}

// ───────────── Demo files ─────────────

async function drawDemoImages(browser) {
  const page = await browser.newPage();
  await page.setContent(`<html><head><style>${FONTS}</style></head><body></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  const files = await page.evaluate(async () => {
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const toB64 = (c, type, q) =>
      new Promise((resolve) =>
        c.toBlob(async (b) => {
          const buf = new Uint8Array(await b.arrayBuffer());
          let s = '';
          for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
          resolve(btoa(s));
        }, type, q),
      );
    function landscape(w, h, palette) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const g = c.getContext('2d');
      const sky = g.createLinearGradient(0, 0, 0, h * 0.62);
      sky.addColorStop(0, palette.sky[0]);
      sky.addColorStop(1, palette.sky[1]);
      g.fillStyle = sky;
      g.fillRect(0, 0, w, h);
      g.fillStyle = palette.sun;
      g.globalAlpha = 0.95;
      g.beginPath();
      g.arc(w * palette.sunX, h * 0.36, h * 0.09, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 1;
      palette.ridges.forEach((col, k) => {
        g.fillStyle = col;
        g.beginPath();
        g.moveTo(0, h);
        const base = h * (0.42 + k * 0.07);
        for (let x = 0; x <= w; x += w / 14) g.lineTo(x, base - Math.sin(x / (w / (3 + k)) + k) * h * 0.06 - rand() * h * 0.05);
        g.lineTo(w, h);
        g.fill();
      });
      const water = g.createLinearGradient(0, h * 0.66, 0, h);
      water.addColorStop(0, palette.water[0]);
      water.addColorStop(1, palette.water[1]);
      g.fillStyle = water;
      g.fillRect(0, h * 0.66, w, h * 0.34);
      g.strokeStyle = 'rgba(255,255,255,0.35)';
      for (let i = 0; i < 60; i++) {
        const y = h * 0.68 + rand() * h * 0.3;
        const x = rand() * w;
        g.lineWidth = 1 + rand() * 2;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + 20 + rand() * 60, y);
        g.stroke();
      }
      for (let i = 0; i < 18; i++) {
        const x = rand() * w;
        const y = h * (0.62 + rand() * 0.04);
        const s = h * (0.05 + rand() * 0.06);
        g.fillStyle = palette.tree;
        g.beginPath();
        g.moveTo(x, y - s);
        g.lineTo(x - s * 0.35, y);
        g.lineTo(x + s * 0.35, y);
        g.fill();
      }
      const img = g.getImageData(0, 0, w, h);
      for (let i = 0; i < img.data.length; i += 4) {
        const n = (rand() - 0.5) * 18;
        img.data[i] += n;
        img.data[i + 1] += n;
        img.data[i + 2] += n;
      }
      g.putImageData(img, 0, 0);
      return c;
    }
    const sunset = { sky: ['#ff9a6b', '#ffd9a0'], sun: '#fff1c9', sunX: 0.7, ridges: ['#b4637a', '#7b4a6e', '#4a3558'], water: ['#e88c74', '#5d3a5c'], tree: '#2f2238' };
    const lake = { sky: ['#7fb8e8', '#dff1ff'], sun: '#fffbe6', sunX: 0.25, ridges: ['#8fb1c9', '#5f8aa6', '#3f6b52'], water: ['#6fa8c9', '#2c5a73'], tree: '#24452f' };
    const dusk = { sky: ['#3a3f7a', '#e6a0a8'], sun: '#ffe2c7', sunX: 0.5, ridges: ['#6d5a8f', '#4a3f6e', '#2b2747'], water: ['#8a6f9a', '#25223f'], tree: '#1b1830' };
    const meadow = { sky: ['#9bd3e0', '#f4f9e9'], sun: '#fffde8', sunX: 0.82, ridges: ['#a9cf8f', '#7bb06a', '#4f8a4a'], water: ['#9fd0c4', '#4d8f7e'], tree: '#2f5e35' };
    const out = {};
    out['beach-sunset.jpg'] = await toB64(landscape(2400, 1600, sunset), 'image/jpeg', 0.96);
    out['mountain-lake.jpg'] = await toB64(landscape(2000, 1333, lake), 'image/jpeg', 0.96);
    out['evening-hills.jpg'] = await toB64(landscape(1800, 1200, dusk), 'image/jpeg', 0.96);
    out['spring-meadow.png'] = await toB64(landscape(1200, 800, meadow), 'image/png');

    // An illustrated portrait for the passport photo maker.
    const p = document.createElement('canvas');
    p.width = 1200;
    p.height = 1500;
    const pg = p.getContext('2d');
    pg.fillStyle = '#eef1f4';
    pg.fillRect(0, 0, 1200, 1500);
    pg.fillStyle = '#2f5f8a';
    pg.beginPath();
    pg.ellipse(600, 1500, 480, 380, 0, Math.PI, 0);
    pg.fill();
    pg.fillStyle = '#e9b48f';
    pg.fillRect(530, 940, 140, 190);
    pg.fillStyle = '#ffffff';
    pg.beginPath();
    pg.moveTo(520, 1130);
    pg.lineTo(600, 1250);
    pg.lineTo(680, 1130);
    pg.fill();
    pg.fillStyle = '#f2c4a0';
    pg.beginPath();
    pg.ellipse(600, 760, 230, 290, 0, 0, Math.PI * 2);
    pg.fill();
    pg.fillStyle = '#3b2a20';
    pg.beginPath();
    pg.ellipse(600, 560, 250, 170, 0, Math.PI, 0);
    pg.fill();
    pg.beginPath();
    pg.ellipse(600, 545, 245, 110, 0, 0, Math.PI);
    pg.fill();
    pg.fillStyle = '#2b2420';
    for (const x of [515, 685]) {
      pg.beginPath();
      pg.ellipse(x, 760, 22, 15, 0, 0, Math.PI * 2);
      pg.fill();
    }
    pg.strokeStyle = '#3b2a20';
    pg.lineWidth = 10;
    pg.lineCap = 'round';
    for (const x of [515, 685]) {
      pg.beginPath();
      pg.moveTo(x - 45, 700);
      pg.lineTo(x + 45, 695);
      pg.stroke();
    }
    pg.strokeStyle = '#c98b6a';
    pg.lineWidth = 8;
    pg.beginPath();
    pg.moveTo(600, 790);
    pg.lineTo(585, 870);
    pg.lineTo(610, 875);
    pg.stroke();
    pg.strokeStyle = '#a5524a';
    pg.lineWidth = 9;
    pg.beginPath();
    pg.arc(600, 900, 60, 0.2 * Math.PI, 0.8 * Math.PI);
    pg.stroke();
    out['portrait.jpg'] = await toB64(p, 'image/jpeg', 0.95);

    // A printed note for text recognition.
    const n = document.createElement('canvas');
    n.width = 1400;
    n.height = 900;
    const ng = n.getContext('2d');
    ng.fillStyle = '#fbfaf6';
    ng.fillRect(0, 0, 1400, 900);
    ng.fillStyle = '#1d1d1d';
    ng.font = '800 64px Nunito';
    ng.fillText('Team meeting notes', 80, 140);
    ng.font = '400 44px Nunito';
    const lines = [
      'Launch the new website on Monday morning.',
      'Send the welcome email to all subscribers.',
      'Order fresh coffee beans for the office.',
      'Book the meeting room for Friday at 3 pm.',
      'Remember: every file stays on your device.',
    ];
    lines.forEach((l, i) => ng.fillText(`${i + 1}. ${l}`, 80, 250 + i * 90));
    out['meeting-notes.png'] = await toB64(n, 'image/png');
    return out;
  });
  await page.close();
  for (const [name, b64] of Object.entries(files)) writeFileSync(join(demoDir, name), Buffer.from(b64, 'base64'));
}

function wrap(text, font, size, width) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(t, size) > width) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

async function documentPdf(title, sections, { signatureLine = false, accent = rgb(0.76, 0.25, 0.18) } = {}) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([595, 842]);
  let y = 770;
  page.drawRectangle({ x: 0, y: 812, width: 595, height: 30, color: accent });
  page.drawText(title, { x: 56, y, size: 24, font: bold, color: rgb(0.12, 0.1, 0.1) });
  y -= 40;
  for (const [heading, body] of sections) {
    if (y < 160) {
      page = doc.addPage([595, 842]);
      page.drawRectangle({ x: 0, y: 812, width: 595, height: 30, color: accent });
      y = 770;
    }
    page.drawText(heading, { x: 56, y, size: 14, font: bold, color: rgb(0.15, 0.15, 0.15) });
    y -= 22;
    for (const line of wrap(body, font, 11, 483)) {
      page.drawText(line, { x: 56, y, size: 11, font, color: rgb(0.25, 0.25, 0.25) });
      y -= 16;
    }
    y -= 18;
  }
  if (signatureLine) {
    page = doc.addPage([595, 842]);
    page.drawRectangle({ x: 0, y: 812, width: 595, height: 30, color: accent });
    page.drawText('Signatures', { x: 56, y: 770, size: 20, font: bold });
    page.drawText('By signing below, both parties agree to the terms of this agreement.', { x: 56, y: 740, size: 11, font });
    for (const [label, yy] of [['Tenant', 600], ['Landlord', 420]]) {
      page.drawLine({ start: { x: 56, y: yy }, end: { x: 330, y: yy }, thickness: 1, color: rgb(0.4, 0.4, 0.4) });
      page.drawText(`${label} signature`, { x: 56, y: yy - 16, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
      page.drawLine({ start: { x: 380, y: yy }, end: { x: 540, y: yy }, thickness: 1, color: rgb(0.4, 0.4, 0.4) });
      page.drawText('Date', { x: 380, y: yy - 16, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
    }
  }
  return doc.save();
}

async function formPdf() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595, 842]);
  const form = doc.getForm();
  page.drawRectangle({ x: 0, y: 772, width: 595, height: 70, color: rgb(0.07, 0.38, 0.36) });
  page.drawText('Community Garden – Membership Form', { x: 40, y: 798, size: 20, font: bold, color: rgb(1, 1, 1) });
  const label = (t, y) => page.drawText(t, { x: 40, y, size: 11, font: bold });
  label('Full name', 730);
  form.createTextField('fullName').addToPage(page, { x: 40, y: 700, width: 360, height: 22 });
  label('Email address', 670);
  form.createTextField('email').addToPage(page, { x: 40, y: 640, width: 360, height: 22 });
  label('Membership plan', 610);
  const plan = form.createRadioGroup('plan');
  plan.addOptionToPage('Seasonal', page, { x: 40, y: 585, width: 14, height: 14 });
  page.drawText('Seasonal', { x: 60, y: 588, size: 11, font });
  plan.addOptionToPage('Yearly', page, { x: 140, y: 585, width: 14, height: 14 });
  page.drawText('Yearly', { x: 160, y: 588, size: 11, font });
  label('Country', 555);
  const country = form.createDropdown('country');
  country.addOptions(['Canada', 'France', 'Germany', 'India', 'Indonesia', 'Mexico', 'Spain', 'United Kingdom', 'United States']);
  country.addToPage(page, { x: 40, y: 525, width: 200, height: 22 });
  form.createCheckBox('newsletter').addToPage(page, { x: 40, y: 490, width: 14, height: 14 });
  page.drawText('Send me the monthly garden newsletter', { x: 62, y: 493, size: 11, font });
  return doc.save();
}

// Visual top of the "Total due" row, measured from the top of the page (PDF points).
const INVOICE_TOTAL_TOP = 842 - 476 - 15;

async function invoicePdf() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595, 842]);
  const ink = rgb(0.15, 0.15, 0.15);
  const muted = rgb(0.4, 0.4, 0.4);
  const right = (t, x, y, f = font, size = 11) => page.drawText(t, { x: x - f.widthOfTextAtSize(t, size), y, size, font: f, color: ink });
  page.drawRectangle({ x: 0, y: 812, width: 595, height: 30, color: rgb(0.07, 0.38, 0.36) });
  page.drawText('Invoice #2026-031', { x: 56, y: 760, size: 24, font: bold, color: rgb(0.12, 0.1, 0.1) });
  page.drawText('Bright Garden Studio · 8 Orchard Street', { x: 56, y: 736, size: 11, font, color: muted });
  page.drawText('Billed to', { x: 56, y: 696, size: 10, font: bold, color: muted });
  page.drawText('Sam Lee, 4 Harbour Road', { x: 56, y: 680, size: 11, font, color: ink });
  page.drawText('Issued 1 March 2026 · Due 31 March 2026', { x: 330, y: 680, size: 11, font, color: ink });
  page.drawRectangle({ x: 56, y: 626, width: 483, height: 24, color: rgb(0.93, 0.96, 0.95) });
  page.drawText('Description', { x: 66, y: 634, size: 10, font: bold, color: ink });
  right('Qty', 380, 634, bold, 10);
  right('Price', 460, 634, bold, 10);
  right('Amount', 529, 634, bold, 10);
  const rows = [
    ['Logo design', 1, 480],
    ['Website banner set', 3, 120],
    ['Business cards (print-ready)', 1, 150],
    ['Two rounds of revisions', 2, 75],
  ];
  let y = 602;
  let total = 0;
  for (const [name, qty, price] of rows) {
    page.drawText(name, { x: 66, y, size: 11, font, color: ink });
    right(String(qty), 380, y);
    right(`€${price.toFixed(2)}`, 460, y);
    right(`€${(qty * price).toFixed(2)}`, 529, y);
    page.drawLine({ start: { x: 56, y: y - 10 }, end: { x: 539, y: y - 10 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) });
    total += qty * price;
    y -= 28;
  }
  page.drawText('Total due', { x: 390, y: 476, size: 13, font: bold, color: ink });
  right(`€${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 529, 476, bold, 13);
  page.drawText('Please pay by bank transfer within 30 days. Thank you for your business!', { x: 56, y: 380, size: 10, font, color: muted });
  return doc.save();
}

async function makeDemoPdfs() {
  const para = 'This agreement describes the responsibilities of both parties in plain language. Rent is paid on the first day of each month by bank transfer. The tenant keeps the home clean and reports repairs promptly; the landlord carries out repairs within a reasonable time.';
  writeFileSync(
    join(demoDir, 'rental-agreement.pdf'),
    await documentPdf(
      'Residential Rental Agreement',
      [
        ['1. Parties', para],
        ['2. Property', 'The property is the two-bedroom apartment at 12 Willow Lane, including one parking space and the shared garden. ' + para],
        ['3. Term', 'The tenancy starts on the first of the month and runs for twelve months. Either party may end it with two months written notice. ' + para],
        ['4. Rent and deposit', para + ' A deposit equal to one month of rent is held for the full term and returned within thirty days after the tenancy ends.'],
        ['5. Utilities', para],
        ['6. Pets and smoking', 'Small pets are welcome with written consent. Smoking is not permitted inside the property. ' + para],
        ['7. Maintenance', para],
      ],
      { signatureLine: true },
    ),
  );
  writeFileSync(join(demoDir, 'invoice-march.pdf'), await invoicePdf());
  writeFileSync(
    join(demoDir, 'receipts.pdf'),
    await documentPdf(
      'Expense receipts',
      [
        ['Travel', 'Train tickets to the client workshop and back, booked two weeks ahead for the lowest fare. Receipts attached for both directions.'],
        ['Meals', 'Lunch with the project team on the workshop day. One receipt from the café next to the venue.'],
        ['Office supplies', 'Printer paper, sticky notes and two whiteboard markers for the planning session.'],
      ],
      { accent: rgb(0.36, 0.33, 0.3) },
    ),
  );
  writeFileSync(join(demoDir, 'membership-form.pdf'), await formPdf());
}

// ───────────── Screenshots ─────────────

const DESKTOP = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
const MOBILE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const demo = (f) => join(demoDir, f);

async function withPage(browser, opts, fn) {
  const ctx = await browser.newContext({ ...opts, colorScheme: opts.colorScheme ?? 'light' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.warn('page error:', e.message));
  try {
    await fn(page);
  } finally {
    await ctx.close();
  }
}

/** Scrolls so the tool sits just under the sticky header. */
async function focusTool(page, extra = 0) {
  await page.evaluate((extra) => {
    const el = document.querySelector('#tool');
    if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 84 + extra);
  }, extra);
  await page.waitForTimeout(400);
}

/** Puts the top of the editor page `top` px below the top of the window. */
async function placeEditor(page, top) {
  await page.getByTestId('editor-page').evaluate((el, top) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - top), top);
  await page.waitForTimeout(300);
}

/** Drags an editor item so its top-left corner lands at (x, y) PDF points from the page's top-left. */
async function dragItem(page, item, x, y) {
  await placeEditor(page, 80);
  const pageBox = await page.getByTestId('editor-page').boundingBox();
  const box = await item.boundingBox();
  const s = pageBox.width / 595;
  const top = typeof y === 'function' ? y(box.height / s) : y;
  await page.mouse.move(box.x + 4, box.y + 4);
  await page.mouse.down();
  await page.mouse.move(pageBox.x + x * s + 4, pageBox.y + top * s + 4, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(200);
}

const shots = [
  ['01-home', DESKTOP, async (p) => {
    await p.goto(`${BASE}/`);
  }],
  ['02-home-dark', { ...DESKTOP, colorScheme: 'dark' }, async (p) => {
    await p.goto(`${BASE}/`);
  }],
  ['03-home-mobile', MOBILE, async (p) => {
    await p.goto(`${BASE}/`);
  }],
  ['04-compress-image', DESKTOP, async (p) => {
    await p.goto(`${BASE}/compress-image`);
    await p.getByTestId('file-input').setInputFiles(demo('beach-sunset.jpg'));
    await p.getByTestId('run').click();
    await p.getByTestId('done').waitFor({ timeout: 60000 });
    await p.evaluate(() => window.scrollTo(0, 0));
  }],
  ['05-bulk-image-compressor', DESKTOP, async (p) => {
    await p.goto(`${BASE}/bulk-image-compressor`);
    await p.getByTestId('file-input').setInputFiles(['beach-sunset.jpg', 'mountain-lake.jpg', 'evening-hills.jpg', 'spring-meadow.png'].map(demo));
    await p.getByTestId('run').click();
    await p.getByTestId('done').waitFor({ timeout: 120000 });
    await focusTool(p);
  }],
  ['06-passport-photo-maker', DESKTOP, async (p) => {
    await p.goto(`${BASE}/passport-photo-maker`);
    await p.getByTestId('file-input').setInputFiles(demo('portrait.jpg'));
    await p.getByTestId('passport-preview').waitFor();
    await p.getByTestId('passport-preset').selectOption('35x45');
    await p.getByTestId('max-kb').fill('100');
    await p.getByTestId('run').click();
    await p.getByTestId('done').waitFor({ timeout: 60000 });
    await focusTool(p);
  }],
  ['07-qr-code-with-logo', DESKTOP, async (p) => {
    await p.goto(`${BASE}/qr-code-with-logo`);
    await p.getByTestId('qr-url').fill('https://hugmyfile.pages.dev');
    await p.getByTestId('logo-input').setInputFiles(join(root, 'public/icons/icon-512.png'));
    await p.waitForTimeout(900);
    await focusTool(p);
  }],
  ['08-wifi-qr-code-mobile', MOBILE, async (p) => {
    await p.goto(`${BASE}/wifi-qr-code`);
    await p.getByTestId('wifi-ssid').fill('Cozy Café Guests');
    await p.getByTestId('wifi-password').fill('warm-cocoa;2026');
    await p.waitForTimeout(800);
    // Show the whole code with the WiFi fields above it.
    await p.getByTestId('qr-preview').evaluate((el) => {
      const r = el.getBoundingClientRect();
      window.scrollTo(0, r.bottom + window.scrollY - window.innerHeight + 24);
    });
    await p.waitForTimeout(300);
  }],
  ['09-merge-pdf', DESKTOP, async (p) => {
    await p.goto(`${BASE}/merge-pdf`);
    await p.getByTestId('file-input').setInputFiles(['rental-agreement.pdf', 'invoice-march.pdf', 'receipts.pdf'].map(demo));
    await p.getByText('3 pages').first().waitFor();
    await p.waitForTimeout(800);
    await p.evaluate(() => window.scrollTo(0, 0));
  }],
  ['10-sign-pdf', DESKTOP, async (p) => {
    await p.goto(`${BASE}/sign-pdf`);
    await p.getByTestId('file-input').setInputFiles(demo('rental-agreement.pdf'));
    await p.getByTestId('page-thumb').last().click();
    await p.getByTestId('sig-tabs').getByText('Type').click();
    await p.getByTestId('sig-name').fill('Alex Morgan');
    await p.getByRole('button', { name: 'Blue' }).click();
    await p.waitForTimeout(500);
    await p.getByTestId('sig-submit').click();
    const sig = p.locator('[data-testid="overlay-item"][data-kind="image"]');
    await sig.waitFor();
    await p.getByTestId('add-date').click();
    const date = p.locator('[data-testid="overlay-item"][data-kind="text"]').last();
    // The tenant lines sit 242 pt below the top of the page.
    await dragItem(p, date, 384, (h) => 242 - h - 3);
    await dragItem(p, sig, 66, (h) => 242 - h + 8);
    await placeEditor(p, 230);
  }],
  ['11-add-text-to-pdf', DESKTOP, async (p) => {
    await p.goto(`${BASE}/add-text-to-pdf`);
    await p.getByTestId('file-input').setInputFiles(demo('invoice-march.pdf'));
    await p.getByTestId('add-highlight').click();
    await dragItem(p, p.locator('[data-testid="overlay-item"][data-kind="highlight"]'), 378, INVOICE_TOTAL_TOP - 1);
    await p.getByTestId('add-text').click();
    await p.getByTestId('text-input').fill('Paid in full on 12 March – thank you!');
    await p.getByTestId('text-size').fill('16');
    await p.getByLabel('Bold').check();
    await p.locator('input[type="color"]').first().fill('#13615b');
    await dragItem(p, p.locator('[data-testid="overlay-item"][data-kind="text"]'), 56, INVOICE_TOTAL_TOP + 36);
    await focusTool(p, 40);
  }],
  ['12-fill-pdf-form', DESKTOP, async (p) => {
    await p.goto(`${BASE}/fill-pdf-form`);
    await p.getByTestId('file-input').setInputFiles(demo('membership-form.pdf'));
    await p.locator('[data-field="fullName"]').fill('Maria José Fernández');
    await p.locator('[data-field="email"]').fill('maria@example.com');
    await p.locator('[data-field="plan"]').getByLabel('Yearly').check();
    await p.locator('[data-field="country"]').selectOption('Spain');
    await p.locator('[data-field="newsletter"]').check();
    await focusTool(p);
  }],
  ['13-rotate-pdf', DESKTOP, async (p) => {
    await p.goto(`${BASE}/rotate-pdf`);
    await p.getByTestId('file-input').setInputFiles(demo('rental-agreement.pdf'));
    await p.getByTestId('rotate-right').nth(1).click();
    await p.waitForTimeout(900);
    await focusTool(p);
  }],
  ['14-compress-pdf', DESKTOP, async (p) => {
    await p.goto(`${BASE}/compress-pdf`);
    await p.getByTestId('file-input').setInputFiles(demo('rental-agreement.pdf'));
    await p.getByTestId('level-light').waitFor();
    await p.evaluate(() => window.scrollTo(0, 0));
  }],
  ['15-signature-maker', DESKTOP, async (p) => {
    await p.goto(`${BASE}/signature-maker`);
    await p.getByTestId('sig-tabs').getByText('Type').click();
    await p.getByTestId('sig-name').fill('Alex Morgan');
    await p.waitForTimeout(700);
    await p.evaluate(() => window.scrollTo(0, 0));
  }],
  ['16-image-to-text', DESKTOP, async (p) => {
    await p.goto(`${BASE}/image-to-text`);
    await p.getByTestId('file-input').setInputFiles(demo('meeting-notes.png'));
    await p.getByTestId('run').click();
    await p.getByTestId('done').waitFor({ timeout: 180000 });
    await focusTool(p);
  }],
  ['17-compress-image-mobile', MOBILE, async (p) => {
    await p.goto(`${BASE}/compress-image`);
    await p.getByTestId('file-input').setInputFiles(demo('mountain-lake.jpg'));
    await p.getByTestId('run').click();
    await p.getByTestId('done').waitFor({ timeout: 60000 });
    await focusTool(p, -40);
  }],
];

// ───────────── Run ─────────────

// ONLY=10-sign-pdf,11-add-text-to-pdf re-shoots just those screenshots; add "brand" to the list for the banners and logos.
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
const brand = !only || only.includes('brand');
const server = spawn(process.execPath, [join(root, 'tests', 'serve.mjs')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
for (let i = 0; ; i++) {
  const up = await fetch(`${BASE}/`).then((r) => r.ok, () => false);
  if (up) break;
  if (i > 50) throw new Error('The local preview server did not start. Run npm run build first.');
  await new Promise((r) => setTimeout(r, 200));
}
const browser = await chromium.launch();
try {
  // Banners and logo files.
  const banners = [
    ['banner-1500x500.png', 1500, 500, false],
    ['banner-1500x500-dark.png', 1500, 500, true],
    ['banner-1200x300.png', 1200, 300, false],
    ['banner-1280x640.png', 1280, 640, false],
  ];
  for (const [name, width, height, dark] of brand ? banners : []) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
    await page.setContent(bannerHtml({ width, height, dark }));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(brandDir, name) });
    await page.close();
  }
  const logos = [['logo-mark-1024.png', false, false], ['logo-horizontal.png', true, false], ['logo-horizontal-dark-mode.png', true, true]];
  for (const [name, wordmark, dark] of brand ? logos : []) {
    const size = wordmark ? 240 : 1024;
    const page = await browser.newPage({ viewport: { width: wordmark ? 1400 : size, height: wordmark ? 400 : size }, deviceScaleFactor: 1 });
    await page.setContent(logoHtml({ size, wordmark, dark }));
    await page.evaluate(() => document.fonts.ready);
    const target = wordmark ? page.locator('#logo') : page.locator('body > div');
    await target.screenshot({ path: join(brandDir, name), omitBackground: true });
    await page.close();
  }
  writeFileSync(join(brandDir, 'logo-mark.svg'), mark);

  await drawDemoImages(browser);
  await makeDemoPdfs();
  for (const [name, opts, fn] of shots.filter(([n]) => !only || only.includes(n))) {
    await withPage(browser, opts, async (page) => {
      await fn(page);
      await page.screenshot({ path: join(shotDir, `${name}.png`) });
    });
    console.log('screenshot', name);
  }
} finally {
  await browser.close();
  server.kill();
}
console.log(`Brand images in docs/brand, screenshots in docs/screenshots`);
