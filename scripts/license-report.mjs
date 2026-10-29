// Builds the list of every third-party package, font and data file that is
// shipped to visitors, checks that each one has a permissive license, and writes:
//   reports/shipped-licenses.json   (machine-readable report + problems)
//   src/data/licenses.json          (only with --update; feeds the /licenses page)
//
// Run automatically after every build. If a newly shipped package is missing
// from src/data/licenses.json, the build fails and asks you to run
//   npm run licenses:update && npm run build
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const nm = join(root, 'node_modules');
const update = process.argv.includes('--update');

const PERMISSIVE = new Set([
  'MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', '0BSD', 'CC0-1.0', 'OFL-1.1', 'Zlib',
  '(MIT AND Zlib)', '(MIT OR Apache-2.0)', 'BlueOak-1.0.0', 'IJG AND BSD-3-Clause AND Zlib',
]);

// Files served from /public that come from npm packages or downloads (see scripts/setup-assets.mjs).
const PUBLIC_ASSETS = [
  { pkg: 'pdfjs-dist', note: 'PDF rendering worker, CMaps, standard fonts, ICC profile and image decoders (/vendor/pdfjs)' },
  { pkg: 'tesseract.js', note: 'OCR worker script (/vendor/tesseract)' },
  { pkg: 'tesseract.js-core', note: 'Tesseract OCR engine compiled to WebAssembly (/vendor/tesseract/core)' },
  { pkg: '@fontsource/noto-sans', note: 'Noto Sans font files embedded into PDFs you edit (/fonts/pdf)' },
];
// Code generated or injected by build tools that ends up in the pages.
const BUILD_INJECTED = [
  { pkg: 'astro', note: 'Island hydration runtime included in each page' },
  { pkg: 'tailwindcss', note: 'Generated CSS, including the Preflight base styles' },
  { pkg: 'lucide', note: 'Interface icons (SVG paths drawn into pages and tools)' },
];
// Components compiled into shipped packages (WASM codecs, bundled helpers).
const BUNDLED_COMPONENTS = {
  '@jsquash/jpeg': [{ name: 'MozJPEG / libjpeg-turbo', license: 'IJG AND BSD-3-Clause AND Zlib', copyright: 'Copyright (C) 1991-2023 The libjpeg-turbo Project and many others; Mozilla Corporation', url: 'https://github.com/mozilla/mozjpeg' }],
  '@jsquash/webp': [{ name: 'libwebp', license: 'BSD-3-Clause', copyright: 'Copyright (c) 2010, Google Inc.', url: 'https://chromium.googlesource.com/webm/libwebp' }],
  '@jsquash/avif': [
    { name: 'libavif', license: 'BSD-2-Clause', copyright: 'Copyright 2019 Joe Drago. All rights reserved.', url: 'https://github.com/AOMediaCodec/libavif' },
    { name: 'libaom (AV1 codec)', license: 'BSD-2-Clause', copyright: 'Copyright (c) 2016, Alliance for Open Media. All rights reserved.', url: 'https://aomedia.googlesource.com/aom/' },
    { name: 'dav1d (AV1 decoder)', license: 'BSD-2-Clause', copyright: 'Copyright © 2018-2019, VideoLAN and dav1d authors', url: 'https://code.videolan.org/videolan/dav1d' },
  ],
  '@jsquash/png': [{ name: 'png and oxipng Rust crates (Squoosh PNG codec)', license: '(MIT OR Apache-2.0)', copyright: 'Copyright (c) The image-rs Developers; Copyright Google LLC', url: 'https://github.com/GoogleChromeLabs/squoosh' }],
  '@jsquash/resize': [
    { name: 'resize Rust crate', license: 'MIT', copyright: 'Copyright (c) 2015 PistonDevelopers', url: 'https://github.com/PistonDevelopers/resize' },
    { name: 'Squoosh resize', license: 'Apache-2.0', copyright: 'Copyright Google LLC', url: 'https://github.com/GoogleChromeLabs/squoosh' },
  ],
  'pdfjs-dist': [
    { name: 'OpenJPEG', license: 'BSD-2-Clause', copyright: 'Copyright (c) 2002-2014, Universite catholique de Louvain (UCL), Belgium and others', url: 'https://github.com/uclouvain/openjpeg' },
    { name: 'PDFium JBIG2 decoder', license: 'BSD-3-Clause', copyright: 'Copyright 2014 The PDFium Authors', url: 'https://pdfium.googlesource.com/pdfium/' },
    { name: 'qcms', license: 'MIT', copyright: 'Copyright (C) 2009-2024 Mozilla Corporation; Copyright (C) 1998-2007 Marti Maria', url: 'https://github.com/FirefoxGraphics/qcms' },
    { name: 'ICC profile (CGATS001Compat)', license: 'CC0-1.0', copyright: 'Public domain dedication', url: 'https://github.com/mozilla/pdf.js' },
    { name: 'Foxit and Liberation standard font data', license: 'BSD-3-Clause', copyright: 'Copyright 2014 PDFium Authors; Liberation fonts under SIL OFL 1.1', url: 'https://github.com/mozilla/pdf.js/tree/master/external/standard_fonts' },
    { name: 'Adobe CMaps', license: 'BSD-3-Clause', copyright: 'Copyright 1990-2019 Adobe. All rights reserved.', url: 'https://github.com/adobe-type-tools/cmap-resources' },
  ],
  'tesseract.js': [
    { name: 'zlib.js', license: 'MIT', copyright: 'Copyright (c) 2012 imaya', url: 'https://github.com/imaya/zlib.js' },
    { name: 'regenerator-runtime', license: 'MIT', copyright: 'Copyright (c) 2014-present, Facebook, Inc.', url: 'https://github.com/facebook/regenerator' },
    { name: 'buffer', license: 'MIT', copyright: 'Copyright (c) Feross Aboukhadijeh, and other contributors', url: 'https://github.com/feross/buffer' },
    { name: 'ieee754', license: 'BSD-3-Clause', copyright: 'Copyright 2008 Fair Oaks Labs, Inc.', url: 'https://github.com/feross/ieee754' },
    { name: 'bmp-js', license: 'MIT', copyright: 'Copyright (c) 2014 @丝刀口', url: 'https://github.com/shaozilee/bmp-js' },
    { name: 'wasm-feature-detect', license: 'Apache-2.0', copyright: 'Copyright Google Inc.', url: 'https://github.com/GoogleChromeLabs/wasm-feature-detect' },
    { name: 'is-url', license: 'MIT', copyright: 'Copyright (c) 2013 segmentio', url: 'https://github.com/segmentio/is-url' },
  ],
  'tesseract.js-core': [
    { name: 'Tesseract OCR', license: 'Apache-2.0', copyright: 'Copyright Google Inc. and Tesseract contributors', url: 'https://github.com/tesseract-ocr/tesseract' },
    { name: 'Leptonica', license: 'BSD-2-Clause', copyright: 'Copyright (C) 2001-2024 Leptonica', url: 'http://www.leptonica.org' },
  ],
};
const DATA_FILES = [
  {
    name: 'tessdata_fast language models (eng, spa, fra, deu, por, ara, hin, urd, ind)',
    license: 'Apache-2.0',
    copyright: 'Copyright Google Inc. and Tesseract contributors',
    url: 'https://github.com/tesseract-ocr/tessdata_fast',
    note: 'Downloaded once into /vendor/tessdata; each file is fetched only when its language is chosen.',
    licenseFile: join(root, 'public', 'vendor', 'tessdata', 'LICENSE'),
  },
];

const COPYRIGHT_OVERRIDES = {
  'pdfjs-dist': 'Copyright Mozilla Foundation and pdf.js contributors',
  'tesseract.js': 'Copyright (c) 2016 Jerome Wu, Guillermo Webster, Kevin Kwok and tesseract.js contributors',
  'tesseract.js-core': 'Copyright (c) 2016 Jerome Wu, Guillermo Webster and tesseract.js-core contributors',
  '@jsquash/jpeg': 'Copyright 2020 Google Inc.; jSquash by Jamie Sinclair',
  '@jsquash/png': 'Copyright 2020 Google Inc.; jSquash by Jamie Sinclair',
  '@jsquash/webp': 'Copyright 2020 Google Inc.; jSquash by Jamie Sinclair',
  '@jsquash/avif': 'Copyright 2020 Google Inc.; jSquash by Jamie Sinclair',
  '@jsquash/resize': 'Copyright 2020 Google Inc.; jSquash by Jamie Sinclair',
};

// Some packages declare MIT in package.json but ship no LICENSE file. MIT still
// requires reproducing the notice, so we include the standard text here.
const MIT_TEXT = (holder) => `MIT License

Copyright (c) ${holder}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
const LICENSE_FALLBACK = {
  '@pdf-lib/fontkit': { copyright: 'Copyright (c) 2014 Devon Govett; 2020 Andrew Dillon', text: MIT_TEXT('2014 Devon Govett, 2020 Andrew Dillon') },
};

function packageOf(id) {
  if (id.startsWith('\u0000vite/')) return 'vite';
  if (id.startsWith('\u0000rolldown/') || id.includes('rolldown:runtime')) return 'rolldown';
  const marker = 'node_modules/';
  const at = id.lastIndexOf(marker);
  if (at < 0) return null;
  const rest = id.slice(at + marker.length).split('/');
  return rest[0].startsWith('@') ? `${rest[0]}/${rest[1]}` : rest[0];
}

function readPkg(name) {
  const dir = join(nm, name);
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  let license = typeof pkg.license === 'string' ? pkg.license : pkg.license?.type ?? (pkg.licenses?.map((l) => l.type).join(' OR ') || 'UNKNOWN');
  const licenseFile = readdirSync(dir).find((f) => /^(licen[cs]e|copying)(\.(md|txt))?$/i.test(f));
  const fallback = LICENSE_FALLBACK[name];
  const text = licenseFile ? readFileSync(join(dir, licenseFile), 'utf8').trim() : fallback && license === 'MIT' ? fallback.text : '';
  const found = text.split('\n').find((l) => /^\s*(copyright\s*(\(c\)|©|\d)|\(c\)\s*\d|©)/i.test(l));
  const author = typeof pkg.author === 'string' ? pkg.author : pkg.author?.name;
  const copyright = COPYRIGHT_OVERRIDES[name] ?? fallback?.copyright ?? found ?? (author ? `Copyright (c) ${author}` : `Copyright (c) the ${name} authors`);
  const repo = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url ?? '';
  const url = (pkg.homepage || repo || `https://www.npmjs.com/package/${name}`).replace(/^git\+/, '').replace(/\.git$/, '').replace(/^git:\/\//, 'https://');
  return { name, version: pkg.version, license, copyright: copyright.trim(), url, licenseText: text };
}

const modulesFile = join(root, 'reports', 'tmp', 'shipped-modules.json');
if (!existsSync(modulesFile)) {
  console.error('license-report: run "npm run build" first (reports/tmp/shipped-modules.json is missing).');
  process.exit(1);
}
const ids = JSON.parse(readFileSync(modulesFile, 'utf8'));
const bundled = new Set(ids.map(packageOf).filter(Boolean));
for (const a of [...PUBLIC_ASSETS, ...BUILD_INJECTED]) bundled.add(a.pkg);

const notes = Object.fromEntries([...PUBLIC_ASSETS, ...BUILD_INJECTED].map((a) => [a.pkg, a.note]));
const packages = [...bundled].sort().map((name) => {
  const info = readPkg(name);
  return { ...info, note: notes[name] ?? '', components: BUNDLED_COMPONENTS[name] ?? [] };
});

const problems = [];
for (const p of packages) {
  if (!PERMISSIVE.has(p.license)) problems.push(`${p.name}@${p.version} has a non-permissive or unknown license: ${p.license}`);
  if (!p.licenseText) problems.push(`${p.name}@${p.version} has no LICENSE file to reproduce`);
  for (const c of p.components) if (!PERMISSIVE.has(c.license)) problems.push(`${c.name} (inside ${p.name}) has license ${c.license}`);
}
for (const d of DATA_FILES) if (!PERMISSIVE.has(d.license)) problems.push(`${d.name} has license ${d.license}`);

const pageData = {
  packages: packages.map(({ licenseText, ...rest }) => ({ ...rest, licenseText })),
  data: DATA_FILES.map(({ licenseFile, ...rest }) => ({ ...rest, licenseText: existsSync(licenseFile) ? readFileSync(licenseFile, 'utf8').trim() : '' })),
};

const pageFile = join(root, 'src', 'data', 'licenses.json');
if (update) {
  writeFileSync(pageFile, JSON.stringify(pageData, null, 2) + '\n');
  console.log(`license-report: wrote ${packages.length} packages to src/data/licenses.json`);
} else {
  const listed = existsSync(pageFile) ? new Set(JSON.parse(readFileSync(pageFile, 'utf8')).packages.map((p) => `${p.name}@${p.version}`)) : new Set();
  for (const p of packages) {
    if (!listed.has(`${p.name}@${p.version}`)) problems.push(`${p.name}@${p.version} is shipped but missing from the /licenses page. Run: npm run licenses:update && npm run build`);
  }
}

mkdirSync(join(root, 'reports'), { recursive: true });
writeFileSync(
  join(root, 'reports', 'shipped-licenses.json'),
  JSON.stringify({ packages: packages.map(({ licenseText, ...p }) => p), data: DATA_FILES.map(({ licenseFile, ...d }) => d), problems }, null, 2) + '\n',
);
const counts = packages.reduce((acc, p) => ((acc[p.license] = (acc[p.license] ?? 0) + 1), acc), {});
console.log(`license-report: ${packages.length} shipped packages`, counts);
if (problems.length) console.log('license-report problems:\n' + problems.map((p) => ` - ${p}`).join('\n'));
