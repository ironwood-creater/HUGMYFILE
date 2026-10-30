import { test, expect, openTool, upload, downloadFrom, fixtureBytes, type Saved } from '../support/test';
import { decode, dimensions, pdfText, pixel, sniff, unzip } from '../support/verify';
import { PDFDict, PDFDocument, PDFName } from 'pdf-lib';
import type { Page } from '@playwright/test';

async function runAndDownload(page: Page, timeout = 120_000): Promise<Saved> {
  await page.getByTestId('run').click();
  await expect(page.getByTestId('done')).toBeVisible({ timeout });
  return downloadFrom(page, () => page.getByTestId('download').first().click());
}

async function pageImageCount(buf: Buffer, index: number): Promise<number> {
  const doc = await PDFDocument.load(buf);
  const xo = doc.getPage(index).node.Resources()?.lookupMaybe(PDFName.of('XObject'), PDFDict);
  return xo ? xo.keys().length : 0;
}

async function waitForPdf(page: Page) {
  await expect(page.getByText(/· \d+ pages?/).first()).toBeVisible({ timeout: 30_000 });
}

async function drawSignature(page: Page) {
  const canvas = page.getByTestId('sig-canvas');
  await expect(canvas).toBeVisible();
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + 40, box.y + box.height * 0.6);
  await page.mouse.down();
  for (let i = 1; i <= 20; i++) {
    await page.mouse.move(box.x + 40 + i * 12, box.y + box.height * (0.6 + 0.25 * Math.sin(i / 2)), { steps: 2 });
  }
  await page.mouse.up();
}

test.describe('PDF tools', () => {
  test('merge-pdf combines files in the chosen order', async ({ page }) => {
    await openTool(page, 'merge-pdf');
    await upload(page, ['doc3.pdf', 'docB.pdf']);
    await expect(page.getByTestId('merge-item')).toHaveCount(2);
    await expect(page.getByText('3 pages')).toBeVisible();
    await expect(page.getByText('2 pages')).toBeVisible();
    let out = await runAndDownload(page);
    expect(out.name).toBe('merged.pdf');
    let text = await pdfText(out.buf);
    expect(text).toHaveLength(5);
    expect(text[0]).toContain('HugMyFile test page 1');
    expect(text[3]).toContain('Second document page 1');

    // Move the second file to the top and merge again.
    await page.getByTestId('merge-item').nth(1).getByTestId('move-up').click();
    out = await runAndDownload(page);
    text = await pdfText(out.buf);
    expect(text[0]).toContain('Second document page 1');
    expect(text[2]).toContain('HugMyFile test page 1');
  });

  test('split-pdf splits by ranges into a ZIP', async ({ page }) => {
    await openTool(page, 'split-pdf');
    await upload(page, 'doc3.pdf');
    await waitForPdf(page);
    await page.getByTestId('ranges').fill('1-2, 3');
    const out = await runAndDownload(page);
    expect(sniff(out.buf)).toBe('zip');
    const files = unzip(out.buf);
    expect(Object.keys(files).sort()).toEqual(['doc3-page-3.pdf', 'doc3-pages-1-2.pdf']);
    expect((await PDFDocument.load(files['doc3-pages-1-2.pdf']!)).getPageCount()).toBe(2);
    expect((await pdfText(files['doc3-page-3.pdf']!))[0]).toContain('test page 3');
  });

  test('split-pdf separates every page', async ({ page }) => {
    await openTool(page, 'split-pdf');
    await upload(page, 'doc3.pdf');
    await waitForPdf(page);
    await page.getByTestId('split-mode').getByText('Every page').click();
    const out = await runAndDownload(page);
    const files = unzip(out.buf);
    expect(Object.keys(files)).toHaveLength(3);
    for (const buf of Object.values(files)) expect((await PDFDocument.load(buf)).getPageCount()).toBe(1);
  });

  test('split-pdf extracts selected pages into one PDF', async ({ page }) => {
    await openTool(page, 'split-pdf');
    await upload(page, 'doc3.pdf');
    await waitForPdf(page);
    await page.getByTestId('split-mode').getByText('Extract pages').click();
    await page.getByTestId('page-thumb').nth(0).click();
    await page.getByTestId('page-thumb').nth(2).click();
    const out = await runAndDownload(page);
    const text = await pdfText(out.buf);
    expect(text).toHaveLength(2);
    expect(text[0]).toContain('test page 1');
    expect(text[1]).toContain('test page 3');
  });

  test('compress-pdf light keeps text extractable and shrinks a bloated file', async ({ page }) => {
    await openTool(page, 'compress-pdf');
    await upload(page, 'bloated.pdf');
    await waitForPdf(page);
    const out = await runAndDownload(page);
    expect(out.buf.length).toBeLessThan(fixtureBytes('bloated.pdf').length);
    const text = await pdfText(out.buf);
    expect(text).toHaveLength(3);
    expect(text[0]).toContain('Bloated test page 1 line 0');
  });

  for (const level of ['medium', 'strong'] as const) {
    test(`compress-pdf ${level} produces a smaller valid PDF`, async ({ page }) => {
      test.setTimeout(180_000);
      await openTool(page, 'compress-pdf');
      await upload(page, 'photos.pdf');
      await waitForPdf(page);
      await page.getByTestId(`level-${level}`).check();
      const out = await runAndDownload(page, 170_000);
      expect(sniff(out.buf)).toBe('pdf');
      expect(out.buf.length).toBeLessThan(fixtureBytes('photos.pdf').length);
      const doc = await PDFDocument.load(out.buf);
      expect(doc.getPageCount()).toBe(2);
      expect(await pageImageCount(out.buf, 0)).toBe(1);
    });
  }

  test('compress-pdf offers the original when the result would not be smaller', async ({ page }) => {
    await openTool(page, 'compress-pdf');
    await upload(page, 'doc3.pdf');
    await waitForPdf(page);
    await page.getByTestId('level-medium').check();
    await page.getByTestId('run').click();
    await expect(page.getByTestId('not-smaller')).toBeVisible({ timeout: 60_000 });
    const out = await downloadFrom(page, () => page.getByTestId('download-original').click());
    expect(out.buf.equals(fixtureBytes('doc3.pdf'))).toBe(true);
  });

  test('rotate-pdf rotates single pages and all pages', async ({ page }) => {
    await openTool(page, 'rotate-pdf');
    await upload(page, 'doc3.pdf');
    await waitForPdf(page);
    await page.getByTestId('rotate-right').first().click();
    await page.getByTestId('rotate-all-left').click();
    const out = await runAndDownload(page);
    const doc = await PDFDocument.load(out.buf);
    expect(doc.getPages().map((p) => p.getRotation().angle)).toEqual([0, 270, 270]);
  });

  test('reorder-pdf-pages moves pages', async ({ page }) => {
    await openTool(page, 'reorder-pdf-pages');
    await upload(page, 'doc3.pdf');
    await waitForPdf(page);
    const third = page.locator('[data-testid="page-card"][data-page="3"]');
    await third.getByTestId('move-earlier').click();
    await third.getByTestId('move-earlier').click();
    const out = await runAndDownload(page);
    const text = await pdfText(out.buf);
    expect(text.map((t) => t.match(/test page (\d)/)?.[1])).toEqual(['3', '1', '2']);
  });

  test('delete-pdf-pages removes the chosen page', async ({ page }) => {
    await openTool(page, 'delete-pdf-pages');
    await upload(page, 'doc3.pdf');
    await waitForPdf(page);
    await page.locator('[data-testid="page-card"][data-page="2"]').getByTestId('page-thumb').click();
    const out = await runAndDownload(page);
    const text = await pdfText(out.buf);
    expect(text.map((t) => t.match(/test page (\d)/)?.[1])).toEqual(['1', '3']);
  });

  test('add-page-numbers-to-pdf writes readable numbers', async ({ page }) => {
    await openTool(page, 'add-page-numbers-to-pdf');
    await upload(page, 'doc3.pdf');
    await waitForPdf(page);
    await page.getByTestId('format').selectOption('Page {n} of {total}');
    const out = await runAndDownload(page);
    const text = await pdfText(out.buf);
    expect(text[0]).toContain('Page 1 of 3');
    expect(text[1]).toContain('Page 2 of 3');
    expect(text[2]).toContain('Page 3 of 3');
  });

  test('add-page-numbers-to-pdf can skip the first page and start at 5', async ({ page }) => {
    await openTool(page, 'add-page-numbers-to-pdf');
    await upload(page, 'doc3.pdf');
    await waitForPdf(page);
    await page.getByTestId('from-page').fill('2');
    await page.getByTestId('start-at').fill('5');
    const out = await runAndDownload(page);
    const text = await pdfText(out.buf);
    const original = await pdfText(fixtureBytes('doc3.pdf'));
    expect(text[0]).toBe(original[0]);
    expect(text[1]).toMatch(/\b5\b/);
    expect(text[2]).toMatch(/\b6\b/);
  });

  test('jpg-to-pdf turns images into pages (upright)', async ({ page }) => {
    await openTool(page, 'jpg-to-pdf');
    await upload(page, ['photo-small.jpg', 'transparent.png', 'exif6.jpg']);
    await expect(page.getByTestId('image-item')).toHaveCount(3);
    const out = await runAndDownload(page);
    const doc = await PDFDocument.load(out.buf);
    expect(doc.getPageCount()).toBe(3);
    const [p1, , p3] = doc.getPages();
    expect(p1!.getWidth()).toBeGreaterThan(p1!.getHeight()); // landscape photo → landscape page
    expect(p3!.getHeight()).toBeGreaterThan(p3!.getWidth()); // EXIF-rotated photo is upright (portrait)
    for (let i = 0; i < 3; i++) expect(await pageImageCount(out.buf, i)).toBe(1);
  });

  test('pdf-to-jpg converts every page into a ZIP of JPGs', async ({ page }) => {
    await openTool(page, 'pdf-to-jpg');
    await upload(page, 'doc3.pdf');
    await waitForPdf(page);
    const out = await runAndDownload(page);
    const files = unzip(out.buf);
    expect(Object.keys(files).sort()).toEqual(['doc3-page-1.jpg', 'doc3-page-2.jpg', 'doc3-page-3.jpg']);
    for (const buf of Object.values(files)) {
      expect(sniff(buf)).toBe('jpeg');
      const d = dimensions(buf);
      expect(Math.abs(d.width - 1240)).toBeLessThanOrEqual(2);
      expect(Math.abs(d.height - 1754)).toBeLessThanOrEqual(2);
    }
    // The page is rendered correctly: white paper with dark title text near the top left.
    const img = await decode(files['doc3-page-1.jpg']!);
    expect(Math.min(...pixel(img, 20, 20).slice(0, 3))).toBeGreaterThan(245);
    let dark = 0;
    for (let y = 160; y < 230; y += 2) for (let x = 120; x < 700; x += 2) if (pixel(img, x, y)[0] < 100) dark++;
    expect(dark).toBeGreaterThan(200);
  });

  test('pdf-to-png converts a chosen page', async ({ page }) => {
    await openTool(page, 'pdf-to-png');
    await upload(page, 'doc3.pdf');
    await waitForPdf(page);
    await page.getByText('Choose pages').click();
    await page.getByTestId('pages-input').fill('2');
    await page.getByTestId('dpi').getByText('Screen (72 DPI)').click();
    const out = await runAndDownload(page);
    expect(out.name).toBe('doc3-page-2.png');
    expect(sniff(out.buf)).toBe('png');
    expect(dimensions(out.buf)).toEqual({ width: 595, height: 842 });
  });

  test('sign-pdf places a drawn signature, name and date', async ({ page }) => {
    await openTool(page, 'sign-pdf');
    await upload(page, 'doc3.pdf');
    await expect(page.getByText('It is not a certified digital signature.')).toBeVisible();
    await drawSignature(page);
    await page.getByTestId('sig-submit').click();
    await expect(page.locator('[data-testid="overlay-item"][data-kind="image"]')).toHaveCount(1);
    await page.getByTestId('add-name').click();
    await page.getByTestId('text-input').fill('Jane Doe');
    await page.getByTestId('add-date').click();
    const out = await runAndDownload(page);
    expect(out.name).toBe('doc3-signed.pdf');
    expect(await pageImageCount(out.buf, 0)).toBe(1);
    const text = await pdfText(out.buf);
    expect(text[0]).toContain('Jane Doe');
    expect(text[0]).toContain(String(new Date().getFullYear()));
  });

  test('sign-pdf accepts a typed signature on page 2', async ({ page }) => {
    await openTool(page, 'sign-pdf');
    await upload(page, 'doc3.pdf');
    await page.getByTestId('sig-tabs').getByText('Type').click();
    await page.getByTestId('sig-name').fill('Jane Doe');
    await page.getByTestId('page-thumb').nth(1).click();
    await page.getByTestId('sig-submit').click();
    await expect(page.locator('[data-testid="overlay-item"][data-kind="image"]')).toHaveCount(1);
    const out = await runAndDownload(page);
    expect(await pageImageCount(out.buf, 0)).toBe(0);
    expect(await pageImageCount(out.buf, 1)).toBe(1);
  });

  test('sign-pdf shows a friendly message for Arabic text', async ({ page }) => {
    await openTool(page, 'sign-pdf');
    await upload(page, 'doc3.pdf');
    await page.getByTestId('add-name').click();
    await page.getByTestId('text-input').fill('مرحبا');
    await expect(page.getByTestId('script-error')).toContainText('not supported yet');
    await expect(page.getByTestId('run')).toBeDisabled();
  });

  test('add-text-to-pdf adds text, shapes, highlight, whiteout and an image', async ({ page }) => {
    await openTool(page, 'add-text-to-pdf');
    await upload(page, 'doc3.pdf');
    await page.getByTestId('add-text').click();
    await page.getByTestId('text-input').fill('Hello from HugMyFile – Ñandú ÁÉÍ');
    await page.getByTestId('add-whiteout').click();
    await page.getByTestId('add-highlight').click();
    await page.getByTestId('add-rect').click();
    await page.getByTestId('add-ellipse').click();
    await upload(page, 'logo.png', 'add-image');
    await expect(page.getByTestId('overlay-item')).toHaveCount(6);
    // The page preview is drawn upright on white paper.
    await expect
      .poll(() => page.evaluate(() => {
        const c = document.querySelector<HTMLCanvasElement>('[data-testid=editor-page] canvas')!;
        return Array.from(c.getContext('2d')!.getImageData(4, 4, 1, 1).data);
      }))
      .toEqual([255, 255, 255, 255]);
    // Undo removes the last item, then we add it back.
    await page.getByTestId('undo').click();
    await expect(page.getByTestId('overlay-item')).toHaveCount(5);
    await upload(page, 'logo.png', 'add-image');
    await expect(page.getByTestId('overlay-item')).toHaveCount(6);
    const out = await runAndDownload(page);
    const text = await pdfText(out.buf);
    expect(text[0]).toContain('Hello from HugMyFile – Ñandú ÁÉÍ');
    expect(await pageImageCount(out.buf, 0)).toBe(1);
  });

  test('add-text-to-pdf keeps the text frame around bold and Cyrillic text', async ({ page }) => {
    await openTool(page, 'add-text-to-pdf');
    await upload(page, 'doc3.pdf');
    await page.getByTestId('add-text').click();
    const item = page.locator('[data-testid="overlay-item"][data-kind="text"]');
    const overflow = () => item.locator('span').first().evaluate((el) => el.scrollWidth - el.clientWidth);
    await page.getByTestId('text-input').fill('Paid in full – thank you!');
    await page.getByLabel('Bold').check();
    await expect.poll(overflow).toBeLessThanOrEqual(1);
    await page.getByTestId('text-input').fill('Оплачено полностью – спасибо!');
    await expect.poll(overflow).toBeLessThanOrEqual(1);
  });

  test('add-text-to-pdf shows a friendly message for Hindi text', async ({ page }) => {
    await openTool(page, 'add-text-to-pdf');
    await upload(page, 'doc3.pdf');
    await page.getByTestId('add-text').click();
    await page.getByTestId('text-input').fill('नमस्ते');
    await expect(page.getByTestId('script-error')).toContainText('not supported yet');
    await expect(page.getByTestId('run')).toBeDisabled();
  });

  test('fill-pdf-form fills every field type', async ({ page }) => {
    await openTool(page, 'fill-pdf-form');
    await upload(page, 'form.pdf');
    await expect(page.getByTestId('form-fields')).toBeVisible();
    await page.locator('[data-field="fullName"]').fill('José Müller');
    await page.locator('[data-field="agree"]').check();
    await page.locator('[data-field="plan"]').getByLabel('pro').check();
    await page.locator('[data-field="country"]').selectOption('Germany');
    const out = await runAndDownload(page);
    const form = (await PDFDocument.load(out.buf)).getForm();
    expect(form.getTextField('fullName').getText()).toBe('José Müller');
    expect(form.getCheckBox('agree').isChecked()).toBe(true);
    expect(form.getRadioGroup('plan').getSelected()).toBe('pro');
    expect(form.getDropdown('country').getSelected()).toEqual(['Germany']);
  });

  test('fill-pdf-form can flatten the answers', async ({ page }) => {
    await openTool(page, 'fill-pdf-form');
    await upload(page, 'form.pdf');
    await page.locator('[data-field="fullName"]').fill('José Müller');
    await page.getByTestId('flatten').check();
    const out = await runAndDownload(page);
    expect((await PDFDocument.load(out.buf)).getForm().getFields()).toHaveLength(0);
    expect((await pdfText(out.buf))[0]).toContain('José Müller');
  });

  test('fill-pdf-form explains when a PDF has no fields, and rejects unsupported scripts', async ({ page }) => {
    await openTool(page, 'fill-pdf-form');
    await upload(page, 'doc3.pdf');
    await expect(page.getByTestId('no-fields')).toBeVisible();
    await expect(page.getByTestId('no-fields').getByRole('link', { name: 'Add Text to PDF' })).toBeVisible();
    await page.getByTestId('start-over').click();
    await upload(page, 'form.pdf');
    await page.locator('[data-field="fullName"]').fill('خوش آمدید');
    await expect(page.getByTestId('script-error')).toContainText('not supported yet');
  });

  const SINGLE_PDF_TOOLS = [
    'split-pdf',
    'compress-pdf',
    'rotate-pdf',
    'reorder-pdf-pages',
    'delete-pdf-pages',
    'add-page-numbers-to-pdf',
    'pdf-to-jpg',
    'pdf-to-png',
    'sign-pdf',
    'add-text-to-pdf',
    'fill-pdf-form',
  ];
  for (const slug of SINGLE_PDF_TOOLS) {
    test(`${slug} shows a friendly error for protected and damaged PDFs`, async ({ page }) => {
      await openTool(page, slug);
      await upload(page, 'encrypted.pdf');
      await expect(page.getByTestId('error')).toHaveText('This PDF is protected or damaged, so we can’t open it.');
      await upload(page, 'corrupted.pdf');
      await expect(page.getByTestId('error')).toHaveText('This PDF is protected or damaged, so we can’t open it.');
      // The tool still works afterwards.
      await upload(page, 'doc3.pdf');
      await expect(page.getByTestId('error')).toHaveCount(0);
    });
  }

  test('merge-pdf flags protected and damaged files and blocks merging', async ({ page }) => {
    await openTool(page, 'merge-pdf');
    await upload(page, ['doc3.pdf', 'encrypted.pdf', 'corrupted.pdf']);
    await expect(page.getByTestId('item-error')).toHaveCount(2);
    await expect(page.getByTestId('item-error').first()).toHaveText('This PDF is protected or damaged, so we can’t open it.');
    await expect(page.getByTestId('run')).toBeDisabled();
  });
});
