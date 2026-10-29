import { test, expect, openTool, upload, downloadFrom } from '../support/test';
import { decode, pixel, sniff } from '../support/verify';
import type { Page } from '@playwright/test';

async function stroke(page: Page, from: [number, number], to: [number, number]) {
  const canvas = page.getByTestId('sig-canvas');
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + from[0], box.y + from[1]);
  await page.mouse.down();
  const steps = 16;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    await page.mouse.move(box.x + from[0] + (to[0] - from[0]) * t, box.y + from[1] + (to[1] - from[1]) * t + Math.sin(t * Math.PI * 2) * 25);
  }
  await page.mouse.up();
}

function inkStats(img: { width: number; height: number; data: Uint8ClampedArray | Uint8Array }) {
  let ink = 0;
  let clear = 0;
  let r = 0;
  let b = 0;
  for (let i = 0; i < img.data.length; i += 4) {
    const a = img.data[i + 3]!;
    if (a === 0) clear++;
    if (a > 200) {
      ink++;
      r += img.data[i]!;
      b += img.data[i + 2]!;
    }
  }
  return { ink, clear, avgR: r / Math.max(1, ink), avgB: b / Math.max(1, ink) };
}

test.describe('signature maker', () => {
  test('drawn signature downloads as a trimmed transparent PNG and an SVG', async ({ page }) => {
    await openTool(page, 'signature-maker');
    await stroke(page, [30, 120], [230, 110]);
    await page.getByTestId('sig-submit').click();
    await expect(page.getByTestId('signature-preview')).toBeVisible();
    const png = await downloadFrom(page, () => page.getByTestId('download-png').click());
    expect(png.name).toBe('signature.png');
    expect(sniff(png.buf)).toBe('png');
    const img = await decode(png.buf);
    // Transparent corners, solid ink in between, and trimmed to the drawing.
    expect(pixel(img, 0, 0)[3]).toBe(0);
    expect(pixel(img, img.width - 1, img.height - 1)[3]).toBe(0);
    const stats = inkStats(img);
    expect(stats.ink).toBeGreaterThan(100);
    expect(stats.clear).toBeGreaterThan(stats.ink);
    const svg = await downloadFrom(page, () => page.getByTestId('download-svg').click());
    expect(sniff(svg.buf)).toBe('svg');
    expect(svg.buf.toString('utf8')).toMatch(/<path|<circle/);
  });

  test('undo removes the last stroke and clear empties the pad', async ({ page }) => {
    await openTool(page, 'signature-maker');
    await expect(page.getByTestId('sig-undo')).toBeDisabled();
    await stroke(page, [30, 100], [150, 100]);
    await stroke(page, [160, 120], [260, 90]);
    await page.getByTestId('sig-undo').click();
    await expect(page.getByTestId('sig-undo')).toBeEnabled();
    await page.getByTestId('sig-clear').click();
    await expect(page.getByTestId('sig-undo')).toBeDisabled();
    await page.getByTestId('sig-submit').click();
    await expect(page.getByTestId('sig-error')).toContainText('Draw your signature');
  });

  test('blue ink is used for the drawing', async ({ page }) => {
    await openTool(page, 'signature-maker');
    await page.getByRole('button', { name: 'Blue' }).click();
    await stroke(page, [30, 120], [230, 110]);
    await page.getByTestId('sig-submit').click();
    const png = await downloadFrom(page, () => page.getByTestId('download-png').click());
    const stats = inkStats(await decode(png.buf));
    expect(stats.avgB).toBeGreaterThan(stats.avgR + 40);
  });

  test('typed signature becomes a transparent PNG', async ({ page }) => {
    await openTool(page, 'signature-maker');
    await page.getByTestId('sig-tabs').getByText('Type').click();
    await page.getByTestId('sig-name').fill('Jane Doe');
    await page.getByTestId('sig-submit').click();
    await expect(page.getByTestId('signature-preview')).toBeVisible();
    await expect(page.getByTestId('download-svg')).toHaveCount(0);
    const png = await downloadFrom(page, () => page.getByTestId('download-png').click());
    const img = await decode(png.buf);
    expect(pixel(img, 0, 0)[3]).toBe(0);
    expect(inkStats(img).ink).toBeGreaterThan(200);
    expect(img.width).toBeGreaterThan(img.height);
  });

  test('uploaded signature photo gets a transparent background', async ({ page }) => {
    await openTool(page, 'signature-maker');
    await page.getByTestId('sig-tabs').getByText('Upload').click();
    await upload(page, 'signature.png', 'sig-upload');
    await expect(page.getByLabel('Uploaded signature preview')).toBeVisible();
    await page.getByTestId('sig-submit').click();
    const png = await downloadFrom(page, () => page.getByTestId('download-png').click());
    const img = await decode(png.buf);
    expect(pixel(img, 0, 0)[3]).toBe(0);
    expect(inkStats(img).ink).toBeGreaterThan(100);
  });

  test('shows the legal reminder', async ({ page }) => {
    await openTool(page, 'signature-maker');
    await expect(page.getByTestId('tool-root')).toContainText('Only create and use your own signature. Using someone else’s signature is illegal.');
  });
});
