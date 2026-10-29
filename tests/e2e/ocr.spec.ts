import { test, expect, openTool, upload, downloadFrom } from '../support/test';

const WORDS = ['quick', 'brown', 'fox', 'lazy', 'dog'];

test.describe('OCR tools', () => {
  test('image-to-text reads the words in an image', async ({ page }) => {
    test.setTimeout(300_000);
    await openTool(page, 'image-to-text');
    await upload(page, 'ocr.png');
    await expect(page.getByTestId('ocr-lang-eng')).toBeChecked();
    await page.getByTestId('run').click();
    await expect(page.getByTestId('done')).toBeVisible({ timeout: 280_000 });
    const text = (await page.getByTestId('ocr-result').first().inputValue()).toLowerCase();
    for (const w of WORDS) expect(text).toContain(w);
    const txt = await downloadFrom(page, () => page.getByTestId('download-txt').click());
    expect(txt.name).toBe('ocr.txt');
    const content = txt.buf.toString('utf8').toLowerCase();
    for (const w of WORDS) expect(content).toContain(w);
  });

  test('image-to-text handles several images at once', async ({ page }) => {
    test.setTimeout(300_000);
    await openTool(page, 'image-to-text');
    await upload(page, ['ocr.png', 'ocr.png']);
    await page.getByTestId('run').click();
    await expect(page.getByTestId('done')).toBeVisible({ timeout: 280_000 });
    await expect(page.getByTestId('ocr-result')).toHaveCount(2);
    const txt = await downloadFrom(page, () => page.getByTestId('download-txt').click());
    expect(txt.name).toBe('extracted-text.txt');
    expect(txt.buf.toString('utf8').match(/--- ocr\.png ---/g)).toHaveLength(2);
  });

  test('pdf-to-text runs OCR on a scanned PDF', async ({ page }) => {
    test.setTimeout(300_000);
    await openTool(page, 'pdf-to-text');
    await upload(page, 'scanned.pdf');
    await page.getByTestId('run').click();
    await expect(page.getByTestId('done')).toBeVisible({ timeout: 280_000 });
    await expect(page.getByText('read with OCR')).toBeVisible();
    const text = (await page.getByTestId('ocr-result').first().inputValue()).toLowerCase();
    for (const w of WORDS) expect(text).toContain(w);
  });

  test('pdf-to-text reads the text layer of a typed PDF directly', async ({ page }) => {
    await openTool(page, 'pdf-to-text');
    await upload(page, 'doc3.pdf');
    await page.getByTestId('run').click();
    await expect(page.getByTestId('done')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('ocr-result')).toHaveCount(3);
    await expect(page.getByText('text from the PDF')).toHaveCount(3);
    expect(await page.getByTestId('ocr-result').nth(1).inputValue()).toContain('HugMyFile test page 2');
    const txt = await downloadFrom(page, () => page.getByTestId('download-txt').click());
    expect(txt.name).toBe('doc3.txt');
    expect(txt.buf.toString('utf8')).toContain('--- Page 3 ---');
  });

  test('pdf-to-text shows a friendly error for protected PDFs', async ({ page }) => {
    await openTool(page, 'pdf-to-text');
    await upload(page, 'encrypted.pdf');
    await expect(page.getByTestId('error')).toHaveText('This PDF is protected or damaged, so we can’t open it.');
  });

  test('language data is only downloaded for the chosen language', async ({ page }) => {
    test.setTimeout(300_000);
    const langFiles: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('/vendor/tessdata/')) langFiles.push(new URL(r.url()).pathname);
    });
    await openTool(page, 'image-to-text');
    await upload(page, 'ocr.png');
    await page.getByTestId('ocr-lang-spa').check({ force: true });
    await page.getByTestId('ocr-lang-eng').uncheck({ force: true });
    await page.getByTestId('run').click();
    await expect(page.getByTestId('done')).toBeVisible({ timeout: 280_000 });
    expect(langFiles).toEqual(['/vendor/tessdata/spa.traineddata.gz']);
  });
});
