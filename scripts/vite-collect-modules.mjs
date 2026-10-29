// Vite/Rolldown plugin: records every source module and asset that ends up in
// the browser bundles (page scripts and Web Workers), so scripts/license-report.mjs
// can prove that only permissively licensed code is shipped to visitors.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const outDir = join(process.cwd(), 'reports', 'tmp');
const outFile = join(outDir, 'shipped-modules.json');
const collected = new Set();

export function collectShippedModules(kind) {
  return {
    name: `hmf-collect-shipped-modules-${kind}`,
    buildStart() {
      if (kind === 'client' && this.environment?.name === 'client') collected.clear();
    },
    generateBundle(_options, bundle) {
      const env = this.environment?.name;
      // Server-side chunks only produce HTML, so they are not shipped. Assets (CSS,
      // fonts, WASM) from every environment end up in dist/ and are recorded.
      const shipsChunks = kind === 'worker' || !env || env === 'client';
      for (const item of Object.values(bundle)) {
        if (item.type === 'chunk') {
          if (!shipsChunks) continue;
          for (const id of item.moduleIds ?? Object.keys(item.modules ?? {})) collected.add(id);
        } else {
          for (const name of item.originalFileNames ?? []) collected.add(name);
        }
      }
      mkdirSync(outDir, { recursive: true });
      const previous = existsSync(outFile) ? JSON.parse(readFileSync(outFile, 'utf8')) : [];
      const merged = new Set([...previous, ...collected]);
      writeFileSync(outFile, JSON.stringify([...merged].sort(), null, 2));
    },
  };
}

export function resetShippedModules() {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, '[]');
}
