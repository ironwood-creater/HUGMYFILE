import { test, expect, openTool, upload, downloadFrom } from '../support/test';
import { decodeQr, sniff, dimensions } from '../support/verify';
import type { Page } from '@playwright/test';

async function pngOf(page: Page) {
  await expect(page.getByTestId('download-png')).toBeEnabled();
  // Give the debounced preview a moment so we export the latest settings.
  await expect(page.getByTestId('qr-preview').locator('svg')).toBeVisible();
  return downloadFrom(page, () => page.getByTestId('download-png').click());
}

test.describe('QR code tools', () => {
  test('qr-code-generator encodes a link exactly (PNG + SVG)', async ({ page }) => {
    await openTool(page, 'qr-code-generator');
    const link = 'https://example.com/hello?x=1&y=2';
    await page.getByTestId('qr-url').fill(link);
    const png = await pngOf(page);
    expect(png.name).toBe('qr-url.png');
    expect(sniff(png.buf)).toBe('png');
    expect(dimensions(png.buf)).toEqual({ width: 1024, height: 1024 });
    expect(decodeQr(png.buf)).toBe(link);
    const svg = await downloadFrom(page, () => page.getByTestId('download-svg').click());
    expect(svg.name).toBe('qr-url.svg');
    expect(sniff(svg.buf)).toBe('svg');
  });

  test('qr-code-generator encodes accented text as UTF-8', async ({ page }) => {
    await openTool(page, 'qr-code-generator');
    await page.getByTestId('qr-type-text').check({ force: true });
    const text = 'Grüße aus Málaga – naïve café 😊';
    await page.getByTestId('qr-text').fill(text);
    const png = await pngOf(page);
    expect(decodeQr(png.buf)).toBe(text);
  });

  test('wifi-qr-code escapes special characters correctly', async ({ page }) => {
    await openTool(page, 'wifi-qr-code');
    await page.getByTestId('wifi-ssid').fill('Café;Net,"1"');
    await page.getByTestId('wifi-password').fill('p@ss:w;rd\\x');
    await page.getByTestId('wifi-hidden').check();
    const png = await pngOf(page);
    expect(decodeQr(png.buf)).toBe('WIFI:T:WPA;S:Café\\;Net\\,\\"1\\";P:p@ss\\:w\\;rd\\\\x;H:true;;');
  });

  test('whatsapp-qr-code builds a wa.me link with the message', async ({ page }) => {
    await openTool(page, 'whatsapp-qr-code');
    await page.getByTestId('wa-phone').fill('+1 (555) 123-4567');
    await page.getByTestId('wa-message').fill('Hi there! Is this available?');
    const png = await pngOf(page);
    expect(decodeQr(png.buf)).toBe('https://wa.me/15551234567?text=Hi%20there!%20Is%20this%20available%3F');
  });

  test('email-qr-code builds a mailto link', async ({ page }) => {
    await openTool(page, 'email-qr-code');
    await page.getByTestId('email-to').fill('hello@example.com');
    await page.getByTestId('email-subject').fill('Quote request');
    await page.getByTestId('email-body').fill('Hi & thanks');
    const png = await pngOf(page);
    expect(decodeQr(png.buf)).toBe('mailto:hello@example.com?subject=Quote%20request&body=Hi%20%26%20thanks');
  });

  test('phone-qr-code makes call and SMS codes', async ({ page }) => {
    await openTool(page, 'phone-qr-code');
    await page.getByTestId('phone-number').fill('+44 20 7946 0958');
    let png = await pngOf(page);
    expect(decodeQr(png.buf)).toBe('tel:+442079460958');
    await page.getByTestId('qr-type-sms').check({ force: true });
    await page.getByTestId('sms-phone').fill('+44 20 7946 0958');
    await page.getByTestId('sms-message').fill('Running late');
    await expect(page.getByTestId('qr-payload')).toHaveText('SMSTO:+442079460958:Running late');
    png = await pngOf(page);
    expect(decodeQr(png.buf)).toBe('SMSTO:+442079460958:Running late');
  });

  test('vcard-qr-code encodes a contact card', async ({ page }) => {
    await openTool(page, 'vcard-qr-code');
    await page.getByTestId('vc-first').fill('Ana');
    await page.getByTestId('vc-last').fill('Pérez');
    await page.getByTestId('vc-org').fill('Hugs, Inc.');
    await page.getByTestId('vc-mobile').fill('+34 600 111 222');
    await page.getByTestId('vc-email').fill('ana@example.com');
    const png = await pngOf(page);
    expect(decodeQr(png.buf)).toBe(
      ['BEGIN:VCARD', 'VERSION:3.0', 'N:Pérez;Ana;;;', 'FN:Ana Pérez', 'ORG:Hugs\\, Inc.', 'TEL;TYPE=CELL:+34600111222', 'EMAIL:ana@example.com', 'END:VCARD'].join('\r\n'),
    );
  });

  test('qr-code-with-logo still decodes with a logo in the middle', async ({ page }) => {
    await openTool(page, 'qr-code-with-logo');
    const link = 'https://hugmyfile.pages.dev/qr-code-with-logo';
    await page.getByTestId('qr-url').fill(link);
    await upload(page, 'logo.png', 'logo-input');
    await expect(page.getByAltText('Your logo')).toBeVisible();
    await expect(page.getByTestId('qr-preview').locator('svg image')).toHaveCount(1);
    const png = await pngOf(page);
    expect(decodeQr(png.buf)).toBe(link);
    const svg = await downloadFrom(page, () => page.getByTestId('download-svg').click());
    expect(svg.buf.toString('utf8')).toContain('<image');
  });

  test('phone-based codes explain a number without digits', async ({ page }) => {
    await openTool(page, 'whatsapp-qr-code');
    const phone = page.getByLabel('Phone number with country code');
    await phone.fill('call me');
    await expect(page.getByTestId('phone-problem')).toContainText('using digits');
    await expect(page.getByTestId('qr-preview')).toContainText('using digits');
    await expect(page.getByTestId('qr-preview').locator('svg')).toHaveCount(0);
    await phone.fill('+1 555 123 4567');
    await expect(page.getByTestId('phone-problem')).toHaveCount(0);
    await expect(page.getByTestId('qr-preview').locator('svg')).toBeVisible();
  });

  test('the QR tools fit a 320px phone', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await openTool(page, 'qr-code-generator');
    await page.getByTestId('qr-url').fill('https://example.com/a/rather/long/link/that/should/wrap/nicely');
    await expect(page.getByTestId('qr-preview').locator('svg')).toBeVisible();
    await page.getByText('What’s inside the code').click();
    await expect(page.getByTestId('qr-payload')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    const box = (await page.getByTestId('qr-preview').boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(320);
  });

  test('low-contrast colors show a warning', async ({ page }) => {
    await openTool(page, 'qr-code-generator');
    await page.getByTestId('qr-url').fill('https://example.com');
    await page.locator('details', { hasText: 'Colors, style and logo' }).locator('summary').click();
    await page.getByTestId('dot-color').fill('#dddddd');
    await expect(page.getByTestId('contrast-warning')).toBeVisible();
  });
});
