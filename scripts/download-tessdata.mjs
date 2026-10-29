// One-time setup: downloads the "fast" Tesseract language models (tessdata_fast,
// Apache-2.0) and stores them gzipped in /public/vendor/tessdata so the site can
// serve them itself. Run with: npm run setup:tessdata
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'vendor', 'tessdata');
const base = 'https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main';
export const LANGS = ['eng', 'spa', 'fra', 'deu', 'por', 'ara', 'hin', 'urd', 'ind'];

mkdirSync(out, { recursive: true });
const manifest = {};
for (const lang of LANGS) {
  const target = join(out, `${lang}.traineddata.gz`);
  if (existsSync(target) && !process.argv.includes('--force')) {
    console.log(`${lang}: already present`);
    continue;
  }
  const res = await fetch(`${base}/${lang}.traineddata`);
  if (!res.ok) throw new Error(`Download failed for ${lang}: HTTP ${res.status}`);
  const raw = Buffer.from(await res.arrayBuffer());
  const gz = gzipSync(raw, { level: 9 });
  writeFileSync(target, gz);
  manifest[lang] = { bytes: raw.length, gzBytes: gz.length, sha256: createHash('sha256').update(raw).digest('hex') };
  console.log(`${lang}: ${raw.length} bytes -> ${gz.length} gz`);
}
const lic = await fetch(`${base}/LICENSE`);
if (lic.ok) writeFileSync(join(out, 'LICENSE'), Buffer.from(await lic.arrayBuffer()));
if (Object.keys(manifest).length) writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
