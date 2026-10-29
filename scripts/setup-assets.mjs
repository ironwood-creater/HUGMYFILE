// Copies self-hosted runtime assets from node_modules into /public/vendor.
// Runs automatically before every build (npm "prebuild"), so the copies always
// match the installed package versions. Nothing here is fetched from the internet.
import { cpSync, existsSync, mkdirSync, rmSync, readdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const nm = join(root, 'node_modules');
const pub = join(root, 'public');
const versionOf = (pkg) => JSON.parse(readFileSync(join(nm, pkg, 'package.json'), 'utf8')).version;

function fresh(dir) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}
function copy(from, to) {
  if (!existsSync(from)) throw new Error(`Missing asset: ${from}`);
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
}

// pdf.js (legacy build for wide browser support)
const pdfjs = join(nm, 'pdfjs-dist');
// Versioned folders let us cache these files "forever" without ever mixing versions.
fresh(join(pub, 'vendor', 'pdfjs'));
const pdfOut = join(pub, 'vendor', 'pdfjs', versionOf('pdfjs-dist'));
mkdirSync(pdfOut, { recursive: true });
copy(join(pdfjs, 'legacy', 'build', 'pdf.worker.min.mjs'), join(pdfOut, 'pdf.worker.min.mjs'));
copy(join(pdfjs, 'cmaps'), join(pdfOut, 'cmaps'));
copy(join(pdfjs, 'standard_fonts'), join(pdfOut, 'standard_fonts'));
copy(join(pdfjs, 'iccs'), join(pdfOut, 'iccs'));
mkdirSync(join(pdfOut, 'wasm'), { recursive: true });
for (const f of ['jbig2.wasm', 'openjpeg.wasm', 'qcms_bg.wasm', 'jbig2_nowasm_fallback.js', 'openjpeg_nowasm_fallback.js']) {
  copy(join(pdfjs, 'wasm', f), join(pdfOut, 'wasm', f));
}
copy(join(pdfjs, 'LICENSE'), join(pdfOut, 'LICENSE'));
for (const f of readdirSync(join(pdfjs, 'wasm')).filter((f) => f.startsWith('LICENSE'))) {
  copy(join(pdfjs, 'wasm', f), join(pdfOut, 'wasm', f));
}

// tesseract.js worker + single-threaded LSTM-only cores (language data lives in /public/vendor/tessdata)
fresh(join(pub, 'vendor', 'tesseract'));
const tessOut = join(pub, 'vendor', 'tesseract', versionOf('tesseract.js'));
mkdirSync(tessOut, { recursive: true });
copy(join(nm, 'tesseract.js', 'dist', 'worker.min.js'), join(tessOut, 'worker.min.js'));
copy(join(nm, 'tesseract.js', 'LICENSE.md'), join(tessOut, 'LICENSE-tesseract.js.md'));
for (const f of ['tesseract-core-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js', 'tesseract-core-relaxedsimd-lstm.wasm.js']) {
  copy(join(nm, 'tesseract.js-core', f), join(tessOut, 'core', f));
}
copy(join(nm, 'tesseract.js-core', 'LICENSE'), join(tessOut, 'core', 'LICENSE'));

// Noto Sans subsets for writing text into PDFs (embedded with fontkit)
const fontOut = join(pub, 'fonts', 'pdf');
fresh(fontOut);
for (const subset of ['latin', 'latin-ext', 'greek', 'cyrillic', 'vietnamese']) {
  for (const weight of ['400', '700']) {
    const name = `noto-sans-${subset}-${weight}-normal.woff`;
    copyFileSync(join(nm, '@fontsource', 'noto-sans', 'files', name), join(fontOut, name));
  }
}
copy(join(nm, '@fontsource', 'noto-sans', 'LICENSE'), join(fontOut, 'LICENSE-NotoSans.txt'));

console.log('Self-hosted assets copied to /public/vendor and /public/fonts/pdf');
