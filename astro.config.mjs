// @ts-check
import { defineConfig, passthroughImageService } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';
import { SITE_URL } from './src/config.ts';
import { collectShippedModules, resetShippedModules } from './scripts/vite-collect-modules.mjs';

if (process.argv.includes('build')) resetShippedModules();

const versionOf = (/** @type {string} */ pkg) =>
  JSON.parse(readFileSync(new URL(`./node_modules/${pkg}/package.json`, import.meta.url), 'utf8')).version;

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'auto' },
  image: { service: passthroughImageService() },
  i18n: { defaultLocale: 'en', locales: ['en'] },
  // Pages start loading when a link is hovered or focused (same-site pages only), so they open almost instantly.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [
    preact(),
    sitemap({
      filter: (page) => !page.endsWith('/404') && !page.endsWith('/404/'),
    }),
  ],
  vite: {
    plugins: [tailwindcss(), collectShippedModules('client')],
    define: {
      __PDFJS_VERSION__: JSON.stringify(versionOf('pdfjs-dist')),
      __TESSERACT_VERSION__: JSON.stringify(versionOf('tesseract.js')),
    },
    optimizeDeps: {
      exclude: ['@jsquash/jpeg', '@jsquash/png', '@jsquash/webp', '@jsquash/avif', '@jsquash/resize'],
    },
    worker: { format: 'es', plugins: () => [collectShippedModules('worker')] },
    build: { chunkSizeWarningLimit: 1500 },
  },
});
