# Lighthouse results (mobile)

Lighthouse 13.6.0, default mobile emulation (Moto G Power, slow 4G throttling), run once with
Playwright's Chromium against the production build served locally (`node tests/serve.mjs`).

| Page | Performance | Accessibility | Best Practices | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| `/` | 99 | 100 | 100 | 100 | 1.7 s | 0 ms | 0 |
| `/compress-image` | 100 | 100 | 100 | 100 | 1.5 s | 0 ms | 0.014 |
| `/merge-pdf` | 100 | 100 | 100 | 100 | 1.5 s | 0 ms | 0.014 |
| `/qr-code-generator` | 99 | 100 | 100 | 100 | 1.7 s | 0 ms | 0.016 |
| `/sign-pdf` | 100 | 100 | 100 | 100 | 1.5 s | 0 ms | 0.014 |

Targets: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95.

Re-run (from the project folder, with the site built and `node tests/serve.mjs` running):

```bash
CHROME_PATH=/path/to/chrome npx lighthouse@13.6.0 http://localhost:4321/ --only-categories=performance,accessibility,best-practices,seo
```
