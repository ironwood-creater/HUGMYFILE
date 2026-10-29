import { test, expect } from '../support/test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Reads the built pages straight from dist/, so these checks cover every page.
const DIST = join(process.cwd(), 'dist');
const SITE = 'https://hugmyfile.pages.dev';
const pages = readdirSync(DIST)
  .filter((f) => f.endsWith('.html') && f !== '404.html')
  .map((f) => ({ file: f, path: f === 'index.html' ? '/' : `/${f.replace(/\.html$/, '')}`, html: readFileSync(join(DIST, f), 'utf8') }));

const get = (html: string, re: RegExp) => re.exec(html)?.[1]?.trim() ?? '';
const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const title = (html: string) => decode(get(html, /<title>([^<]*)<\/title>/));
const description = (html: string) => decode(get(html, /<meta name="description" content="([^"]*)"/));
const h1s = (html: string) => [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => m[1]!.replace(/<[^>]+>/g, '').trim());
const jsonLd = (html: string) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]!));

const TOOL_SLUGS = [
  'compress-image', 'compress-image-to-20kb', 'compress-image-to-50kb', 'compress-image-to-100kb', 'compress-image-to-200kb',
  'bulk-image-compressor', 'resize-image', 'png-to-jpg', 'jpg-to-png', 'png-to-webp', 'jpg-to-webp', 'webp-to-jpg', 'webp-to-png',
  'jpg-to-avif', 'heic-to-jpg', 'passport-photo-maker', 'merge-pdf', 'split-pdf', 'compress-pdf', 'rotate-pdf', 'reorder-pdf-pages',
  'delete-pdf-pages', 'add-page-numbers-to-pdf', 'jpg-to-pdf', 'pdf-to-jpg', 'pdf-to-png', 'sign-pdf', 'add-text-to-pdf', 'fill-pdf-form',
  'qr-code-generator', 'wifi-qr-code', 'whatsapp-qr-code', 'email-qr-code', 'phone-qr-code', 'vcard-qr-code', 'qr-code-with-logo',
  'signature-maker', 'image-to-text', 'pdf-to-text',
];

test.describe('SEO and content checks (all pages)', () => {
  test('every required page exists', () => {
    const built = new Set(pages.map((p) => p.path));
    for (const slug of TOOL_SLUGS) expect(built, slug).toContain(`/${slug}`);
    for (const p of ['/', '/about', '/contact', '/privacy-policy', '/terms', '/licenses']) expect(built).toContain(p);
    expect(readdirSync(DIST)).toContain('404.html');
  });

  test('titles, descriptions and H1s are present and unique', () => {
    const titles = new Map<string, string>();
    const descs = new Map<string, string>();
    const headings = new Map<string, string>();
    for (const p of pages) {
      const t = title(p.html);
      const d = description(p.html);
      const h = h1s(p.html);
      expect(t, `${p.path} title`).not.toBe('');
      expect(t.length, `${p.path} title length: ${t}`).toBeLessThan(60);
      expect(d.length, `${p.path} description length`).toBeGreaterThan(50);
      expect(d.length, `${p.path} description length`).toBeLessThan(160);
      expect(h, `${p.path} has exactly one H1`).toHaveLength(1);
      expect(titles.get(t), `duplicate title ${t}`).toBeUndefined();
      expect(descs.get(d), `duplicate description on ${p.path}`).toBeUndefined();
      expect(headings.get(h[0]!), `duplicate H1 on ${p.path}`).toBeUndefined();
      titles.set(t, p.path);
      descs.set(d, p.path);
      headings.set(h[0]!, p.path);
    }
  });

  test('tool pages end their title with "| HugMyFile" and have unique FAQ and how-to content', () => {
    const faqSets = new Map<string, string>();
    const introSets = new Map<string, string>();
    for (const slug of TOOL_SLUGS) {
      const p = pages.find((x) => x.path === `/${slug}`)!;
      expect(title(p.html), slug).toMatch(/\| HugMyFile$/);
      const faqQs = [...p.html.matchAll(/<summary[^>]*>\s*<span>([^<]+)<\/span>/g)].map((m) => m[1]!);
      expect(faqQs.length, `${slug} FAQ count`).toBeGreaterThanOrEqual(4);
      expect(faqQs.length, `${slug} FAQ count`).toBeLessThanOrEqual(6);
      const steps = /<ol data-testid="how-to">([\s\S]*?)<\/ol>/.exec(p.html)?.[1] ?? '';
      const stepCount = (steps.match(/<li/g) ?? []).length;
      expect(stepCount, `${slug} how-to steps`).toBeGreaterThanOrEqual(3);
      expect(stepCount, `${slug} how-to steps`).toBeLessThanOrEqual(5);
      const faqKey = faqQs.join('|');
      expect(faqSets.get(faqKey), `${slug} FAQ duplicates another page`).toBeUndefined();
      faqSets.set(faqKey, slug);
      const intro = /<article[^>]*data-testid="tool-content"[^>]*>\s*<p>([\s\S]*?)<\/p>/.exec(p.html)?.[1] ?? '';
      expect(intro.length, `${slug} intro`).toBeGreaterThan(80);
      expect(introSets.get(intro), `${slug} intro duplicates another page`).toBeUndefined();
      introSets.set(intro, slug);
      expect(p.html, `${slug} related tools`).toContain('data-testid="related-tools"');
      expect(p.html, `${slug} badge`).toContain('Runs on your device');
    }
  });

  test('canonical URLs, Open Graph and Twitter tags use SITE_URL', () => {
    for (const p of pages) {
      const canonical = get(p.html, /<link rel="canonical" href="([^"]+)"/);
      expect(canonical, p.path).toBe(p.path === '/' ? `${SITE}/` : `${SITE}${p.path}`);
      expect(get(p.html, /<meta property="og:url" content="([^"]+)"/)).toBe(canonical);
      expect(get(p.html, /<meta property="og:image" content="([^"]+)"/)).toBe(`${SITE}/og-image.png`);
      expect(p.html).toContain('<meta name="twitter:card" content="summary_large_image"');
      expect(p.html).toContain('rel="manifest" href="/site.webmanifest"');
      expect(p.html).toContain('rel="apple-touch-icon"');
    }
  });

  test('structured data: Organization everywhere; SoftwareApplication, BreadcrumbList and FAQPage on tools', () => {
    for (const p of pages) {
      const types = jsonLd(p.html).map((d) => d['@type']);
      expect(types, p.path).toContain('Organization');
    }
    for (const slug of TOOL_SLUGS) {
      const p = pages.find((x) => x.path === `/${slug}`)!;
      const data = jsonLd(p.html);
      const types = data.map((d) => d['@type']);
      expect(types, slug).toEqual(expect.arrayContaining(['SoftwareApplication', 'BreadcrumbList', 'FAQPage']));
      const app = data.find((d) => d['@type'] === 'SoftwareApplication');
      expect(app.offers.price).toBe('0');
      expect(app.url).toBe(`${SITE}/${slug}`);
      const faq = data.find((d) => d['@type'] === 'FAQPage');
      expect(faq.mainEntity.length).toBeGreaterThanOrEqual(4);
    }
  });

  test('sitemap lists every page except 404', async ({ request }) => {
    const xml = await (await request.get('/sitemap-0.xml')).text();
    for (const p of pages) expect(xml, p.path).toContain(`<loc>${p.path === '/' ? `${SITE}/` : `${SITE}${p.path}`}</loc>`);
    expect(xml).not.toContain('404');
  });

  test('web app manifest is named HugMyFile', async ({ request }) => {
    const manifest = await (await request.get('/site.webmanifest')).json();
    expect(manifest.name).toBe('HugMyFile');
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });
});
