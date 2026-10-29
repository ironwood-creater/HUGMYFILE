import { test, expect } from '../support/test';

test.describe('site shell', () => {
  test('homepage shows every tool and search filters them', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Pro features. Free forever.');
    const cards = page.locator('.tool-item');
    await expect(cards).toHaveCount(39);
    await page.getByLabel('Search all tools').fill('merge');
    await expect(page.locator('.tool-item:not([hidden])')).toHaveCount(1);
    await expect(page.locator('.tool-item:not([hidden])')).toContainText('Merge PDF');
    await page.getByLabel('Search all tools').fill('qr wifi');
    await expect(page.locator('.tool-item:not([hidden])').filter({ hasText: 'WiFi QR Code' })).toHaveCount(1);
    await expect(page.locator('.tool-item:not([hidden])').filter({ hasText: 'Compress Image' })).toHaveCount(0);
    await page.getByLabel('Search all tools').fill('zzzz-nothing');
    await expect(page.locator('#no-results')).toBeVisible();
  });

  test('navigation menu opens on desktop and phone', async ({ page }) => {
    await page.goto('/');
    const width = page.viewportSize()?.width ?? 1280;
    if (width < 768) {
      await page.getByRole('button', { name: 'Menu' }).click();
      const mobileNav = page.locator('#mobile-nav');
      await expect(mobileNav).toBeVisible();
      await mobileNav.getByText('PDF', { exact: true }).click();
      await expect(mobileNav.getByRole('link', { name: 'Merge PDF' })).toBeVisible();
    } else {
      const dd = page.locator('details.nav-dd').filter({ has: page.locator('summary', { hasText: /^PDF$/ }) });
      await dd.locator('summary').click();
      await expect(dd.getByRole('link', { name: 'Merge PDF' })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dd.getByRole('link', { name: 'Merge PDF' })).toBeHidden();
    }
  });

  test('theme toggle switches to dark mode', async ({ page }) => {
    await page.goto('/');
    const before = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    await page.locator('#theme-toggle').click();
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(!before);
  });

  for (const [path, heading] of [
    ['/about', 'About HugMyFile'],
    ['/contact', 'Contact us'],
    ['/privacy-policy', 'Privacy Policy'],
    ['/terms', 'Terms of Use'],
  ] as const) {
    test(`${path} renders`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveText(heading);
    });
  }

  test('contact page shows the coming-soon note while no email is set', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByTestId('contact-coming-soon')).toBeVisible();
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  });

  test('privacy policy states that files are never uploaded', async ({ page }) => {
    await page.goto('/privacy-policy');
    await expect(page.locator('main')).toContainText('Your files are never uploaded');
    await expect(page.locator('main')).toContainText('cookies');
    await expect(page.locator('main')).toContainText('consent');
  });

  test('terms include the signature and ownership rules', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.locator('main')).toContainText('Only create and use your own signature. Using someone else’s signature is illegal.');
    await expect(page.locator('main')).toContainText('files that you own');
    await expect(page.locator('main')).toContainText('not directed at children under 13');
  });

  test('unknown pages show the friendly 404', async ({ page }) => {
    const res = await page.goto('/this-page-does-not-exist');
    expect(res?.status()).toBe(404);
    await expect(page.locator('h1')).toContainText('couldn’t find that page');
  });

  test('robots.txt and sitemap point at SITE_URL', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Sitemap: https://hugmyfile.pages.dev/sitemap-index.xml');
    const sitemap = await (await request.get('/sitemap-0.xml')).text();
    expect(sitemap).toContain('https://hugmyfile.pages.dev/about');
    expect(sitemap).not.toContain('/404');
  });

  test('footer carries the trademark notice', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer')).toContainText('All trademarks belong to their respective owners. HugMyFile is not affiliated with them.');
  });

  test('ads are off: no ad slots or ad scripts are rendered', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.ad-slot')).toHaveCount(0);
    expect(await page.content()).not.toContain('googlesyndication');
    const res = await page.request.get('/ads.txt');
    expect(res.status()).toBe(404);
  });
});

test('licenses page lists shipped libraries with their licenses', async ({ page }) => {
  await page.goto('/licenses');
  await expect(page.locator('h1')).toHaveText('Open-source credits');
  const entries = page.getByTestId('license-entry');
  expect(await entries.count()).toBeGreaterThan(5);
  await expect(page.locator('main')).toContainText('pdfjs-dist');
  await expect(page.locator('main')).toContainText('tessdata_fast');
  await expect(page.locator('main')).not.toContainText('GPL');
});
