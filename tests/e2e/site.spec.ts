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

  test('header menus stay on screen and every tool can be reached on tablets and short laptops', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 768, 'desktop header menus');
    for (const size of [{ width: 768, height: 1024 }, { width: 1366, height: 768 }, { width: 1024, height: 640 }]) {
      await page.setViewportSize(size);
      await page.goto('/');
      const summaries = page.locator('details.nav-dd > summary');
      for (let i = 0; i < (await summaries.count()); i++) {
        await summaries.nth(i).click();
        const panel = page.locator('details.nav-dd[open] .nav-dd-panel');
        const box = (await panel.boundingBox())!;
        expect(box.x, `menu ${i} at ${size.width}px starts on screen`).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width, `menu ${i} at ${size.width}px ends on screen`).toBeLessThanOrEqual(size.width);
        const last = panel.getByRole('link').last();
        await last.scrollIntoViewIfNeeded();
        const linkBox = (await last.boundingBox())!;
        expect(linkBox.y + linkBox.height, `last tool in menu ${i} reachable at ${size.width}×${size.height}`).toBeLessThanOrEqual(size.height);
        await page.keyboard.press('Escape');
      }
    }
  });

  test('a menu opens on mouse hover, stays open when clicked, and closes when the mouse leaves', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 768, 'desktop header menus');
    await page.goto('/');
    const dd = page.locator('details.nav-dd').filter({ has: page.locator('summary', { hasText: /^PDF$/ }) });
    const link = dd.getByRole('link', { name: 'Merge PDF' });
    await dd.locator('summary').hover();
    await expect(link).toBeVisible();
    await dd.locator('summary').click();
    await expect(link).toBeVisible();
    await page.mouse.move(5, (page.viewportSize()?.height ?? 700) - 5);
    await expect(link).toBeHidden();
  });

  test('the phone menu opens the current section, keeps the page still and closes with Escape', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone menu');
    await page.goto('/merge-pdf');
    await page.getByRole('button', { name: 'Menu' }).click();
    const mobileNav = page.locator('#mobile-nav');
    await expect(mobileNav.locator('details[open] > summary')).toHaveText(['PDF']);
    await expect(mobileNav.getByRole('link', { name: 'Merge PDF' })).toHaveAttribute('aria-current', 'page');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden');
    await page.keyboard.press('Escape');
    await expect(mobileNav).toBeHidden();
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('visible');
  });

  test('the header marks the section of the current tool', async ({ page }) => {
    await page.goto('/merge-pdf');
    await expect(page.locator('header a[aria-current="page"][href="/merge-pdf"]').first()).toBeAttached();
    await page.goto('/');
    await expect(page.locator('header a[aria-current="page"]')).toHaveCount(0);
  });

  test('category chips glide to their section below the header, even after a search hid it', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Search all tools').fill('merge');
    await expect(page.locator('#qr')).toBeHidden();
    await page.locator('a[data-jump][href="#qr"]').click();
    await expect(page.getByLabel('Search all tools')).toHaveValue('');
    await expect(page.locator('#qr')).toBeVisible();
    await expect(page).toHaveURL(/#qr$/);
    await expect
      .poll(() => page.evaluate(() => {
        const heading = document.querySelector('#qr h2')!.getBoundingClientRect();
        const header = document.querySelector('header')!.getBoundingClientRect();
        return heading.top >= header.bottom && heading.top < window.innerHeight / 2;
      }))
      .toBe(true);
  });

  test('hovering or focusing a link starts loading that page early', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 768, 'hover needs a mouse');
    const fetched: string[] = [];
    page.on('request', (req) => fetched.push(new URL(req.url()).pathname));
    await page.goto('/');
    await page.locator('.tool-item a[href="/merge-pdf"]').hover();
    await expect
      .poll(async () => fetched.includes('/merge-pdf') || (await page.locator('link[rel="prefetch"][href$="/merge-pdf"]').count()) > 0)
      .toBe(true);
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

test('no page scrolls sideways on a small 320px phone', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 768, 'phone projects only');
  const sitemap = await (await page.request.get('/sitemap-0.xml')).text();
  const paths = [...sitemap.matchAll(/<loc>https?:\/\/[^/<]+([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
  expect(paths.length).toBeGreaterThan(40);
  await page.setViewportSize({ width: 320, height: 640 });
  for (const path of [...paths, '/this-page-does-not-exist']) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${path} is wider than the screen`).toBeLessThanOrEqual(0);
  }
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
