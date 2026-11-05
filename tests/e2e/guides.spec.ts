import { test, expect } from '../support/test';
import { GUIDES } from '../../src/data/guides';

const SITE = 'https://hugmyfile.pages.dev';
const jsonLd = (html: string) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]!));

test.describe('guides', () => {
  test('the guides page lists every guide, and each guide opens with its answer, steps, tools and FAQ', async ({ page }) => {
    const res = await page.goto('/guides');
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveText('Guides');
    await expect(page.getByTestId('guide-list').getByTestId('guide-card')).toHaveCount(GUIDES.length);
    for (const guide of GUIDES) {
      await page.getByTestId('guide-list').getByRole('link', { name: new RegExp(guide.title.replace(/[()]/g, '\\$&')) }).click();
      await expect(page).toHaveURL(new RegExp(`/guides/${guide.slug}$`));
      await expect(page.locator('h1')).toHaveText(guide.title);
      await expect(page.getByTestId('quick-answer')).toBeVisible();
      expect(await page.getByTestId('guide-content').locator('h2').count()).toBeGreaterThanOrEqual(3);
      expect(await page.getByTestId('guide-content').locator('ol li').count()).toBeGreaterThanOrEqual(3);
      for (const slug of guide.tools) await expect(page.getByTestId('guide-tools').locator(`a[href="/${slug}"]`)).toHaveCount(1);
      await expect(page.getByTestId('faq').locator('details')).toHaveCount(guide.faqs.length);
      await expect(page.locator('main')).toContainText('min read');
      await page.goto('/guides');
    }
  });

  test('every link inside the guides leads to a working page', async ({ request }) => {
    const links = new Set<string>();
    for (const guide of GUIDES) {
      const html = await (await request.get(`/guides/${guide.slug}`)).text();
      const main = /<main[\s\S]*<\/main>/.exec(html)?.[0] ?? '';
      for (const m of main.matchAll(/href="(\/[^"#]*)/g)) links.add(m[1]!);
    }
    expect(links.size).toBeGreaterThan(10);
    for (const link of links) expect((await request.get(link)).status(), link).toBe(200);
  });

  test('guides carry Article, breadcrumb and FAQ structured data', async ({ request }) => {
    for (const guide of GUIDES) {
      const data = jsonLd(await (await request.get(`/guides/${guide.slug}`)).text());
      const article = data.find((d) => d['@type'] === 'Article');
      expect(article.headline).toBe(guide.title);
      expect(article.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(article.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(article.mainEntityOfPage).toBe(`${SITE}/guides/${guide.slug}`);
      const crumbs = data.find((d) => d['@type'] === 'BreadcrumbList');
      expect(crumbs.itemListElement.map((i: { name: string }) => i.name)).toEqual(['Home', 'Guides', guide.title]);
      expect(data.find((d) => d['@type'] === 'FAQPage').mainEntity).toHaveLength(guide.faqs.length);
    }
  });

  test('tool pages link to the guides that use them', async ({ page }) => {
    await page.goto('/compress-pdf');
    await expect(page.getByTestId('tool-guides').locator('a[href="/guides/reduce-pdf-size-on-iphone"]')).toBeVisible();
    await page.goto('/sign-pdf');
    await expect(page.getByTestId('tool-guides').locator('a[href="/guides/sign-pdf-without-printing"]')).toBeVisible();
    await page.goto('/qr-code-generator');
    await expect(page.getByTestId('tool-guides')).toHaveCount(0);
  });

  test('guides can be reached from the homepage, the menu and the footer', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-guides').getByTestId('guide-card')).toHaveCount(3);
    await expect(page.getByTestId('home-guides').getByRole('link', { name: 'See all guides' })).toHaveAttribute('href', '/guides');
    await expect(page.locator('footer a[href="/guides"]')).toBeVisible();
    if ((page.viewportSize()?.width ?? 0) < 768) {
      await page.getByRole('button', { name: 'Menu' }).click();
      await page.locator('#mobile-nav a[href="/guides"]').click();
    } else {
      await page.locator('header nav:not(#mobile-nav) a[href="/guides"]').click();
    }
    await expect(page).toHaveURL(/\/guides$/);
    await expect(page.locator('header a[href="/guides"][aria-current="page"]').first()).toBeAttached();
  });
});
