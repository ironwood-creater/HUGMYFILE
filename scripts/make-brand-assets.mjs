// Renders the logo into favicons, app icons and the Open Graph image using the
// Chromium that Playwright drives. Run once with: npm run brand
// Output files are committed in /public, so builds never need a browser.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const mark = readFileSync(join(root, 'src/assets/brand/logo-mark.svg'), 'utf8');
const font = (w) =>
  `data:font/woff2;base64,${readFileSync(join(root, `node_modules/@fontsource/nunito/files/nunito-latin-${w}-normal.woff2`)).toString('base64')}`;

mkdirSync(join(pub, 'icons'), { recursive: true });
copyFileSync(join(root, 'src/assets/brand/logo-mark.svg'), join(pub, 'favicon.svg'));

const browser = await chromium.launch();

async function renderIcon(size, { background = 'transparent', padding = 0, radius = 0 } = {}) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  const inner = size - padding * 2;
  await page.setContent(`<html><body style="margin:0;background:transparent">
    <div style="width:${size}px;height:${size}px;background:${background};border-radius:${radius}px;display:grid;place-items:center">
      <div style="width:${inner}px;height:${inner}px">${mark.replace('<svg ', '<svg width="100%" height="100%" ')}</div>
    </div></body></html>`);
  const png = await page.screenshot({ omitBackground: background === 'transparent', type: 'png' });
  await page.close();
  return png;
}

// ICO file that wraps PNG images (supported by all current browsers).
function ico(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const dir = Buffer.alloc(16 * pngs.length);
  let offset = 6 + dir.length;
  pngs.forEach(({ size, data }, i) => {
    const o = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, o);
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1);
    dir.writeUInt8(0, o + 2);
    dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4);
    dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(data.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += data.length;
  });
  return Buffer.concat([header, dir, ...pngs.map((p) => p.data)]);
}

const icoPngs = [];
for (const size of [16, 32, 48]) icoPngs.push({ size, data: await renderIcon(size) });
writeFileSync(join(pub, 'favicon.ico'), ico(icoPngs));
writeFileSync(join(pub, 'icons', 'icon-192.png'), await renderIcon(192, { background: '#fffbf8', padding: 14, radius: 40 }));
writeFileSync(join(pub, 'icons', 'icon-512.png'), await renderIcon(512, { background: '#fffbf8', padding: 36, radius: 108 }));
writeFileSync(join(pub, 'icons', 'icon-maskable-512.png'), await renderIcon(512, { background: '#fffbf8', padding: 96 }));
writeFileSync(join(pub, 'apple-touch-icon.png'), await renderIcon(180, { background: '#fffbf8', padding: 18 }));

// Open Graph image, designed as a tiny HTML page.
const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await og.setContent(`<!doctype html><html><head><style>
  @font-face { font-family: Nunito; font-weight: 400; src: url(${font(400)}) format('woff2'); }
  @font-face { font-family: Nunito; font-weight: 800; src: url(${font(800)}) format('woff2'); }
  body { margin:0; width:1200px; height:630px; font-family: Nunito, sans-serif; color:#2b2420;
    background: radial-gradient(60% 70% at 10% 10%, #ffe9e3, transparent 70%), radial-gradient(50% 60% at 95% 15%, #cfeeea, transparent 70%), #fffbf8; }
  .wrap { box-sizing:border-box; height:100%; padding:72px 80px; display:flex; flex-direction:column; justify-content:space-between; }
  .brand { display:flex; align-items:center; gap:22px; font-size:64px; font-weight:800; letter-spacing:-1px; }
  .brand b { color:#c2412d; font-weight:800; }
  h1 { font-size:68px; line-height:1.05; margin:0; font-weight:800; letter-spacing:-1.5px; max-width:900px; }
  p { font-size:32px; margin:18px 0 0; color:#5e544d; max-width:950px; }
  .chips { display:flex; gap:14px; flex-wrap:wrap; }
  .chip { font-size:26px; font-weight:800; padding:10px 22px; border-radius:999px; background:#eaf7f5; color:#13615b; border:2px solid #a3ded6; }
</style></head><body><div class="wrap">
  <div class="brand"><div style="width:110px;height:110px">${mark.replace('<svg ', '<svg width="100%" height="100%" ')}</div><span>Hug<b>My</b>File</span></div>
  <div><h1>Pro features. Free forever.</h1><p>Image, PDF, QR, signature and text tools that run on your device.</p></div>
  <div class="chips"><span class="chip">Runs on your device</span><span class="chip">Free</span><span class="chip">No signup</span><span class="chip">No watermark</span></div>
</div></body></html>`);
await og.evaluate(() => document.fonts.ready);
writeFileSync(join(pub, 'og-image.png'), await og.screenshot({ type: 'png' }));
await browser.close();
console.log('Brand assets written to /public');
