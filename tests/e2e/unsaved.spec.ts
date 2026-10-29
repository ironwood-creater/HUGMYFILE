import { test, expect, openTool, upload, downloadFrom } from '../support/test';

test.describe('unsaved result warning', () => {
  test('warns before leaving when a result has not been downloaded', async ({ page }) => {
    await openTool(page, 'jpg-to-png');
    await upload(page, 'photo-small.jpg');
    await page.getByTestId('run').click();
    await expect(page.getByTestId('done')).toContainText('Your file will be lost if you close this page');
    const dialog = page.waitForEvent('dialog');
    await page.close({ runBeforeUnload: true });
    const d = await dialog;
    expect(d.type()).toBe('beforeunload');
    await d.accept();
  });

  test('does not warn after the result was downloaded', async ({ page }) => {
    await openTool(page, 'jpg-to-png');
    await upload(page, 'photo-small.jpg');
    await page.getByTestId('run').click();
    await expect(page.getByTestId('done')).toBeVisible();
    await downloadFrom(page, () => page.getByTestId('download').first().click());
    await expect(page.getByTestId('done')).not.toContainText('Your file will be lost');
    let warned = false;
    page.on('dialog', async (d) => {
      warned = true;
      await d.accept();
    });
    await page.close({ runBeforeUnload: true });
    expect(warned).toBe(false);
  });
});
