import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;
const phone = { viewport: { width: 390, height: 844 }, hasTouch: true };

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  expect: { timeout: 30_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.PW_WORKERS ? Number(process.env.PW_WORKERS) : process.env.CI ? 2 : 3,
  reporter: [
    ['list'],
    ['json', { outputFile: `reports/tmp/results-${process.env.PW_REPORT_NAME ?? 'local'}.json` }],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  globalSetup: './tests/global-setup.ts',
  use: {
    baseURL: `http://localhost:${PORT}`,
    acceptDownloads: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node tests/serve.mjs',
    port: PORT,
    reuseExistingServer: !process.env.CI,
    env: { PORT: String(PORT) },
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium-mobile', use: { browserName: 'chromium', ...phone, isMobile: true, deviceScaleFactor: 2 } },
    { name: 'firefox-desktop', use: { ...devices['Desktop Firefox'] } },
    // Firefox has no "isMobile" emulation in Playwright; the phone viewport and touch still apply.
    { name: 'firefox-mobile', use: { browserName: 'firefox', ...phone } },
    { name: 'webkit-desktop', use: { ...devices['Desktop Safari'] } },
    { name: 'webkit-mobile', use: { browserName: 'webkit', ...phone, isMobile: true, deviceScaleFactor: 3 } },
  ],
});
