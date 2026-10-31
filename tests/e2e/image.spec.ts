import { test, expect, openTool, upload, downloadFrom, fixtureBytes, type Saved } from '../support/test';
import { decode, dimensions, pixel, sniff, unzip } from '../support/verify';
import type { Page } from '@playwright/test';

async function runAndWait(page: Page, timeout = 120_000) {
  await page.getByTestId('run').click();
  await expect(page.getByTestId('done')).toBeVisible({ timeout });
}

async function downloadFirst(page: Page): Promise<Saved> {
  return downloadFrom(page, () => page.getByTestId('download').first().click());
}

test.describe('image tools', () => {
  test('compress-image makes a JPG smaller and keeps it valid', async ({ page }) => {
    await openTool(page, 'compress-image');
    await upload(page, 'photo.jpg');
    await runAndWait(page);
    const out = await downloadFirst(page);
    expect(out.name).toBe('photo-compressed.jpg');
    expect(sniff(out.buf)).toBe('jpeg');
    expect(out.buf.length).toBeLessThan(fixtureBytes('photo.jpg').length);
    const img = await decode(out.buf);
    expect([img.width, img.height]).toEqual([1600, 1200]);
  });

  test('compress-image shrinks a PNG by reducing colors', async ({ page }) => {
    await openTool(page, 'compress-image');
    await upload(page, 'photo.png');
    await expect(page.locator('#png-colors')).toBeVisible();
    await runAndWait(page);
    const out = await downloadFirst(page);
    expect(sniff(out.buf)).toBe('png');
    expect(out.buf.length).toBeLessThan(fixtureBytes('photo.png').length);
    const img = await decode(out.buf);
    expect([img.width, img.height]).toEqual([800, 600]);
  });

  test('compress-image handles a 10-megapixel JPG without crashing', async ({ page }) => {
    test.setTimeout(240_000);
    await openTool(page, 'compress-image');
    await upload(page, 'large.jpg');
    await runAndWait(page, 200_000);
    const out = await downloadFirst(page);
    expect(sniff(out.buf)).toBe('jpeg');
    expect(dimensions(out.buf)).toEqual({ width: 4000, height: 2500 });
    expect(out.buf.length).toBeLessThan(fixtureBytes('large.jpg').length);
  });

  for (const kb of [20, 50, 100, 200]) {
    test(`compress-image-to-${kb}kb produces a file under ${kb} KB`, async ({ page }) => {
      test.setTimeout(180_000);
      await openTool(page, `compress-image-to-${kb}kb`);
      await upload(page, kb === 100 ? 'large.jpg' : 'photo.jpg');
      await expect(page.getByTestId('target-kb')).toHaveValue(String(kb));
      await runAndWait(page, 170_000);
      const out = await downloadFirst(page);
      expect(sniff(out.buf)).toBe('jpeg');
      expect(out.buf.length).toBeLessThanOrEqual(kb * 1000);
      const img = await decode(out.buf);
      expect(img.width).toBeGreaterThan(50);
    });
  }

  test('compress-to-KB explains when the target is impossible at the exact size', async ({ page }) => {
    test.setTimeout(180_000);
    await openTool(page, 'compress-image-to-20kb');
    await upload(page, 'large.jpg');
    await page.getByTestId('target-kb').fill('5');
    await page.getByTestId('keep-dimensions').check();
    await page.getByTestId('run').click();
    await expect(page.getByTestId('item-error')).toContainText('Even at the lowest quality', { timeout: 170_000 });
  });

  test('bulk-image-compressor returns a ZIP with every file', async ({ page }) => {
    test.setTimeout(180_000);
    await openTool(page, 'bulk-image-compressor');
    await upload(page, ['photo.jpg', 'photo.png', 'photo.webp']);
    await expect(page.getByTestId('file-item')).toHaveCount(3);
    await runAndWait(page, 170_000);
    const out = await downloadFrom(page, () => page.getByTestId('download-zip').click());
    expect(sniff(out.buf)).toBe('zip');
    const files = unzip(out.buf);
    expect(Object.keys(files).sort()).toEqual(['photo-compressed.jpg', 'photo-compressed.png', 'photo-compressed.webp']);
    expect(sniff(files['photo-compressed.jpg']!)).toBe('jpeg');
    expect(sniff(files['photo-compressed.png']!)).toBe('png');
    expect(sniff(files['photo-compressed.webp']!)).toBe('webp');
  });

  test('resize-image produces the exact requested dimensions', async ({ page }) => {
    await openTool(page, 'resize-image');
    await upload(page, 'photo.jpg');
    await expect(page.getByTestId('width')).toHaveValue('1600');
    await page.getByTestId('lock-aspect').uncheck();
    await page.getByTestId('width').fill('300');
    await page.getByTestId('height').fill('200');
    await runAndWait(page);
    const out = await downloadFirst(page);
    expect(sniff(out.buf)).toBe('jpeg');
    expect(dimensions(out.buf)).toEqual({ width: 300, height: 200 });
    expect(out.name).toBe('photo-300x200.jpg');
  });

  test('resize-image keeps the aspect ratio when locked', async ({ page }) => {
    await openTool(page, 'resize-image');
    await upload(page, 'photo.png');
    await expect(page.getByTestId('width')).toHaveValue('800');
    await page.getByTestId('width').fill('400');
    await expect(page.getByTestId('height')).toHaveValue('300');
    await runAndWait(page);
    const out = await downloadFirst(page);
    expect(sniff(out.buf)).toBe('png');
    expect(dimensions(out.buf)).toEqual({ width: 400, height: 300 });
  });

  test('resize-image scales by percentage', async ({ page }) => {
    await openTool(page, 'resize-image');
    await upload(page, 'photo-small.jpg');
    await page.getByTestId('resize-mode').getByText('Percentage').click();
    await page.getByTestId('percent').fill('50');
    await runAndWait(page);
    const out = await downloadFirst(page);
    expect(dimensions(out.buf)).toEqual({ width: 240, height: 180 });
  });

  test('png-to-jpg turns transparent areas white', async ({ page }) => {
    await openTool(page, 'png-to-jpg');
    await upload(page, 'transparent.png');
    await runAndWait(page);
    const out = await downloadFirst(page);
    expect(out.name).toBe('transparent.jpg');
    expect(sniff(out.buf)).toBe('jpeg');
    const img = await decode(out.buf);
    expect([img.width, img.height]).toEqual([400, 300]);
    const [r, g, b] = pixel(img, 50, 150);
    expect(Math.min(r, g, b)).toBeGreaterThan(245);
    const [r2, g2, b2] = pixel(img, 380, 280);
    expect(r2).toBeGreaterThan(180);
    expect(g2).toBeLessThan(120);
    expect(b2).toBeLessThan(100);
  });

  test('jpg-to-png converts and keeps the size', async ({ page }) => {
    await openTool(page, 'jpg-to-png');
    await upload(page, 'photo-small.jpg');
    await runAndWait(page);
    const out = await downloadFirst(page);
    expect(sniff(out.buf)).toBe('png');
    expect(dimensions(out.buf)).toEqual({ width: 480, height: 360 });
  });

  test('jpg-to-png applies EXIF orientation 6 (photo is upright)', async ({ page }) => {
    await openTool(page, 'jpg-to-png');
    await upload(page, 'exif6.jpg');
    await runAndWait(page);
    const out = await downloadFirst(page);
    const img = await decode(out.buf);
    // Stored 600×400 sideways; upright it is 400×600 with the red corner at the top right.
    expect([img.width, img.height]).toEqual([400, 600]);
    const [r, g, b] = pixel(img, 390, 10);
    expect(r).toBeGreaterThan(200);
    expect(g + b).toBeLessThan(100);
    const [r2, , b2] = pixel(img, 10, 10);
    expect(b2).toBeGreaterThan(150);
    expect(r2).toBeLessThan(100);
  });

  test('png-to-webp keeps transparency', async ({ page }) => {
    await openTool(page, 'png-to-webp');
    await upload(page, 'transparent.png');
    await runAndWait(page);
    const out = await downloadFirst(page);
    expect(sniff(out.buf)).toBe('webp');
    const img = await decode(out.buf);
    expect([img.width, img.height]).toEqual([400, 300]);
    expect(pixel(img, 50, 150)[3]).toBe(0);
    expect(pixel(img, 380, 280)[3]).toBe(255);
  });

  test('jpg-to-webp converts photos', async ({ page }) => {
    await openTool(page, 'jpg-to-webp');
    await upload(page, 'photo.jpg');
    await runAndWait(page);
    const out = await downloadFirst(page);
    expect(sniff(out.buf)).toBe('webp');
    expect(dimensions(out.buf)).toEqual({ width: 1600, height: 1200 });
  });

  test('webp-to-jpg converts WebP files', async ({ page }) => {
    await openTool(page, 'webp-to-jpg');
    await upload(page, 'photo.webp');
    await runAndWait(page);
    const out = await downloadFirst(page);
    expect(sniff(out.buf)).toBe('jpeg');
    expect(dimensions(out.buf)).toEqual({ width: 800, height: 600 });
  });

  test('webp-to-png converts and keeps transparency', async ({ page }) => {
    await openTool(page, 'webp-to-png');
    await upload(page, 'transparent.webp');
    await runAndWait(page);
    const out = await downloadFirst(page);
    expect(sniff(out.buf)).toBe('png');
    const img = await decode(out.buf);
    expect(pixel(img, 50, 150)[3]).toBe(0);
    expect(pixel(img, 380, 280)[3]).toBe(255);
  });

  test('jpg-to-avif produces a valid AVIF', async ({ page }) => {
    test.setTimeout(240_000);
    await openTool(page, 'jpg-to-avif');
    await upload(page, 'photo-small.jpg');
    await runAndWait(page, 220_000);
    const out = await downloadFirst(page);
    expect(out.name).toBe('photo-small.avif');
    expect(sniff(out.buf)).toBe('avif');
    expect(dimensions(out.buf)).toEqual({ width: 480, height: 360 });
    const img = await decode(out.buf);
    expect([img.width, img.height]).toEqual([480, 360]);
  });

  test('heic-to-jpg shows the friendly message when the browser cannot decode HEIC', async ({ page }) => {
    await openTool(page, 'heic-to-jpg');
    await upload(page, 'fake.heic');
    await page.getByTestId('run').click();
    await expect(page.getByTestId('item-error')).toContainText('Your browser can’t open HEIC files. Open this page in Safari');
    await expect(page.getByTestId('item-error')).toContainText('Camera → Formats → Most Compatible');
  });

  test('an empty file is turned away with a clear message', async ({ page }) => {
    await openTool(page, 'compress-image');
    await page.getByTestId('file-input').setInputFiles({ name: 'empty.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(0) });
    await expect(page.getByTestId('rejected-files')).toContainText('empty.jpg: This file is empty');
    await expect(page.getByTestId('run')).toHaveCount(0);
  });

  test('resize-image says right away when an image cannot be opened', async ({ page }) => {
    await openTool(page, 'resize-image');
    await page.getByTestId('file-input').setInputFiles({ name: 'broken.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('this is not a picture') });
    await expect(page.getByTestId('unreadable')).toContainText('couldn’t open this image');
  });

  test('passport-photo-maker fits a 320px phone', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await openTool(page, 'passport-photo-maker');
    await upload(page, 'photo.jpg');
    await expect(page.getByTestId('passport-preview')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    const box = (await page.getByTestId('passport-preview').boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(320);
  });

  test('passport-photo-maker creates an exact 2×2 inch photo under the KB limit', async ({ page }) => {
    await openTool(page, 'passport-photo-maker');
    await upload(page, 'photo.jpg');
    await expect(page.getByTestId('passport-preview')).toBeVisible();
    await expect(page.getByTestId('max-kb')).toHaveValue('240');
    await page.getByTestId('run').click();
    await expect(page.getByTestId('done')).toBeVisible({ timeout: 60_000 });
    const out = await downloadFirst(page);
    expect(sniff(out.buf)).toBe('jpeg');
    expect(dimensions(out.buf)).toEqual({ width: 600, height: 600 });
    expect(out.buf.length).toBeLessThanOrEqual(240 * 1000);
  });

  test('passport-photo-maker makes 35×45 mm photos and a printable PDF sheet', async ({ page }) => {
    await openTool(page, 'passport-photo-maker');
    await upload(page, 'photo.jpg');
    await page.getByTestId('passport-preset').selectOption('35x45');
    await page.getByTestId('max-kb').fill('50');
    await page.getByTestId('run').click();
    await expect(page.getByTestId('done')).toBeVisible({ timeout: 60_000 });
    const out = await downloadFirst(page);
    expect(dimensions(out.buf)).toEqual({ width: 413, height: 531 });
    expect(out.buf.length).toBeLessThanOrEqual(50 * 1000);
    const sheet = await downloadFrom(page, () => page.getByTestId('download-sheet-pdf').click());
    expect(sniff(sheet.buf)).toBe('pdf');
    const { PDFDocument } = await import('pdf-lib');
    const doc = await PDFDocument.load(sheet.buf);
    expect(doc.getPageCount()).toBe(1);
    const { width, height } = doc.getPage(0).getSize();
    expect(Math.round(width)).toBe(288);
    expect(Math.round(height)).toBe(432);
    const jpg = await downloadFrom(page, () => page.getByTestId('download-sheet-jpg').click());
    expect(dimensions(jpg.buf)).toEqual({ width: 1200, height: 1800 });
  });
});
