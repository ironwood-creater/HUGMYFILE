import { test, expect } from '../support/test';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

// Visits every page of the site. The shared guard fails the test if anything is
// requested from another domain or if a page throws an error.
const DIST = join(process.cwd(), 'dist');
const paths = readdirSync(DIST)
  .filter((f) => f.endsWith('.html'))
  .map((f) => (f === 'index.html' ? '/' : `/${f.replace(/\.html$/, '')}`));

test.describe('privacy: every page loads only from this site', () => {
  for (const path of paths) {
    test(`${path} makes no third-party requests and stores nothing`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      // Interact a little so lazy code paths start too.
      await page.mouse.move(10, 10);
      await page.waitForTimeout(300);
      const stored = await page.evaluate(() => ({ cookies: document.cookie, local: Object.keys(localStorage), session: Object.keys(sessionStorage) }));
      expect(stored).toEqual({ cookies: '', local: [], session: [] });
      // No ad code or analytics while their flags are off.
      const html = await page.content();
      expect(html).not.toContain('googlesyndication');
      expect(html).not.toContain('cloudflareinsights');
    });
  }
});
