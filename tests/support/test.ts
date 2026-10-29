import { test as base, expect, type Page, type Download } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const FIXTURES = join(process.cwd(), 'tests', 'fixtures', 'files');
export const fixture = (name: string) => join(FIXTURES, name);
export const fixtureBytes = (name: string) => readFileSync(fixture(name));

/**
 * Every test automatically:
 *  - fails if the page requests anything from a domain other than the local test server
 *    (proves files and data never leave the device, and that all assets are self-hosted);
 *  - fails on uncaught JavaScript errors.
 */
export const test = base.extend<{ guard: void }>({
  guard: [
    async ({ page }, use) => {
      const external: string[] = [];
      const pageErrors: string[] = [];
      page.on('request', (req) => {
        const url = new URL(req.url());
        if (url.protocol === 'data:' || url.protocol === 'blob:' || url.protocol === 'about:') return;
        if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') external.push(req.url());
      });
      page.on('pageerror', (err) => pageErrors.push(`${err.name}: ${err.message}`));
      await use();
      expect(external, 'requests to other domains').toEqual([]);
      expect(pageErrors, 'uncaught page errors').toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

export async function openTool(page: Page, slug: string) {
  await page.goto(`/${slug}`);
  await expect(page.locator('h1')).toBeVisible();
  // Wait until the Preact island is interactive.
  await page.locator('astro-island:not([ssr])').first().waitFor({ state: 'attached', timeout: 30_000 });
}

export async function upload(page: Page, names: string | string[], testId = 'file-input') {
  const list = (Array.isArray(names) ? names : [names]).map(fixture);
  await page.getByTestId(testId).setInputFiles(list);
}

export interface Saved {
  name: string;
  buf: Buffer;
}

export async function saveDownload(download: Download): Promise<Saved> {
  const path = await download.path();
  if (!path) throw new Error('Download failed: ' + (await download.failure()));
  return { name: download.suggestedFilename(), buf: readFileSync(path) };
}

/** Clicks something that triggers a download and returns the downloaded file. */
export async function downloadFrom(page: Page, click: () => Promise<unknown>, timeout = 120_000): Promise<Saved> {
  const [download] = await Promise.all([page.waitForEvent('download', { timeout }), click()]);
  return saveDownload(download);
}
