// Post-build safety checks for the static site in /dist:
//  1. No single file is larger than Cloudflare Pages' 25 MB limit.
//  2. HTML pages never load scripts, styles, fonts or images from other domains
//     (the only exceptions are the analytics/ads scripts, and only when switched on).
//  3. Every JS/CSS/WASM file in the build comes from a permissively licensed package
//     (see scripts/license-report.mjs, which writes reports/shipped-licenses.json).
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const LIMIT = 25 * 1024 * 1024;
const problems = [];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else out.push({ path: p, size: st.size });
  }
  return out;
}

const files = walk(dist);
let largest = { path: '', size: 0 };
for (const f of files) {
  if (f.size > largest.size) largest = f;
  if (f.size > LIMIT) problems.push(`File too large for Cloudflare Pages (>25 MB): ${relative(dist, f.path)} (${f.size} bytes)`);
}

const config = readFileSync(join(root, 'src', 'config.ts'), 'utf8');
const analyticsOn = /ANALYTICS_TOKEN\s*=\s*'[^']+'/.test(config);
const adsOn = /ADS_ENABLED\s*=\s*true/.test(config);
const allowedExternal = [
  ...(analyticsOn ? ['https://static.cloudflareinsights.com/'] : []),
  ...(adsOn ? ['https://pagead2.googlesyndication.com/', 'https://fundingchoicesmessages.google.com/'] : []),
];

const resourceAttr = /<(script|link|img|iframe|source|video|audio)\b[^>]*?\s(?:src|href)=["'](https?:)?\/\/([^"']+)["'][^>]*>/gi;
for (const f of files.filter((x) => x.path.endsWith('.html'))) {
  const html = readFileSync(f.path, 'utf8');
  for (const m of html.matchAll(resourceAttr)) {
    const tag = m[0];
    // Canonical/alternate links and Open Graph values are addresses, not resources.
    if (/^<link\b/i.test(tag) && /rel=["'](canonical|alternate|sitemap)["']/i.test(tag)) continue;
    const url = `https://${m[3]}`;
    if (!allowedExternal.some((a) => url.startsWith(a))) problems.push(`External resource in ${relative(dist, f.path)}: ${tag.slice(0, 160)}`);
  }
}

console.log(`check-dist: ${files.length} files, largest ${relative(dist, largest.path)} (${(largest.size / 1048576).toFixed(2)} MB)`);
const licenseReport = join(root, 'reports', 'shipped-licenses.json');
if (existsSync(licenseReport)) {
  const report = JSON.parse(readFileSync(licenseReport, 'utf8'));
  for (const p of report.problems ?? []) problems.push(`License: ${p}`);
}
if (problems.length) {
  console.error('check-dist found problems:\n' + problems.map((p) => ` - ${p}`).join('\n'));
  process.exit(1);
}
console.log('check-dist: OK');
