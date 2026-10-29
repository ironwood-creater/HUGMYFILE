# Deploying HugMyFile (step by step)

Everything here uses free plans. You never need a server.

## 1. Run it on your computer

1. Install Node.js 24 LTS from <https://nodejs.org> (the exact version is in `.nvmrc`).
2. Open a terminal in the project folder and run:

```bash
npm ci
```

```bash
npm run build
```

```bash
npm run preview
```

3. Open the address it prints (usually <http://localhost:4321>).

To run the tests on your computer:

```bash
npx playwright install --with-deps
```

```bash
npm test
```

## 2. Put the code on GitHub

1. Create a free account at <https://github.com> if you don't have one.
2. Click **New repository**, name it `hugmyfile`, keep it **Private** (or Public), and don't add a README.
3. In the project folder:

```bash
git remote add origin https://github.com/YOUR-USERNAME/hugmyfile.git
```

```bash
git push -u origin main
```

(If your branch has a different name, use that instead of `main`.) Every push runs the full test suite on Chromium, Firefox and WebKit in GitHub Actions (the **Actions** tab), and the results table appears in the run summary.

## 3. Deploy on Cloudflare Pages

1. Create a free account at <https://dash.cloudflare.com>.
2. Go to **Workers & Pages → Create → Pages → Connect to Git** and pick your `hugmyfile` repository.
3. Use these settings:
   - **Framework preset:** Astro (or None)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment variable:** `NODE_VERSION` = `24.22.2` (Cloudflare also reads `.nvmrc`, this just makes it explicit)
4. Name the project `hugmyfile` so the address is `https://hugmyfile.pages.dev`, then **Save and Deploy**.

Every push to your main branch now deploys automatically. The `_headers` file (security and cache headers) is applied by Cloudflare.

## 4. Later: move to hugmyfile.com

1. Buy or transfer `hugmyfile.com` and add it to Cloudflare (**Add a domain**), following the nameserver instructions.
2. In `src/config.ts` change one line:

```ts
export const SITE_URL = 'https://hugmyfile.com';
```

   Canonical links, the sitemap, `robots.txt`, Open Graph tags, structured data and `ads.txt` all read this value. Commit and push; Cloudflare redeploys.
3. In your Pages project: **Custom domains → Set up a custom domain**, add `hugmyfile.com` (and `www.hugmyfile.com` if you want it).
4. Redirect the old address so Google sees only one site. `*.pages.dev` addresses can't use a zone's Redirect Rules, so use **Bulk Redirects**:
   - Cloudflare dashboard → **Rules → Bulk Redirects** (account level) → **Create Bulk Redirect List** → add a URL redirect:
     - Source URL: `hugmyfile.pages.dev`
     - Target URL: `https://hugmyfile.com`
     - Status: **301**
     - Turn on **Preserve query string**, **Subpath matching**, **Preserve path suffix** and **Include subdomains**.
   - Then **Create Bulk Redirect Rule** using that list and enable it.
   - If you added `www`, add a Redirect Rule in the `hugmyfile.com` zone from `www.hugmyfile.com/*` to `https://hugmyfile.com/${1}` (301).
5. In Google Search Console, add `https://hugmyfile.com` and submit `https://hugmyfile.com/sitemap-index.xml`.

## 5. Turn on Cloudflare Web Analytics (cookieless)

1. Cloudflare dashboard → **Analytics & Logs → Web Analytics → Add a site** → enter your domain → choose the **JavaScript snippet** option.
2. Copy the `token` value from the snippet (the long string inside `data-cf-beacon`).
3. In `src/config.ts`: `export const ANALYTICS_TOKEN = 'paste-token-here';`
4. Commit and push. The privacy policy automatically says analytics is on.

(Don't also turn on the automatic Web Analytics injection for the Pages project, or the beacon would load twice.)

## 6. Turn on AdSense (after approval)

AdSense normally needs your own domain, so do this after step 4.

1. Apply at <https://adsense.google.com> with `https://hugmyfile.com`. Your About, Contact, Privacy Policy and Terms pages are already in place. Fill in `CONTACT_EMAIL` first.
2. When approved, copy your publisher ID (`ca-pub-…`).
3. In `src/config.ts`:

```ts
export const ADS_ENABLED = true;
export const ADSENSE_CLIENT_ID = 'ca-pub-XXXXXXXXXXXXXXXX';
```

4. Commit and push. This adds the AdSense script, at most two clearly labeled ad slots per tool page (never next to upload or download buttons), and generates `/ads.txt` automatically.
5. In AdSense → **Privacy & messaging**, create and publish the **European regulations** message (Google's certified consent message) and, if you like, the **US state regulations** message. The site already sets Google Consent Mode to "denied" by default for EEA, UK and Swiss visitors until they choose.
6. Check `https://hugmyfile.com/ads.txt` shows your publisher ID.

## Where to change things

- **Contact email:** `src/config.ts` → `CONTACT_EMAIL` (until it is set, the Contact page says "coming soon").
- **Colors:** `src/styles/global.css` → the `@theme` block (`--color-coral-*` primary, `--color-sea-*` accent).
- **Logo:** `src/assets/brand/logo-mark.svg`, then run `npm run brand` to regenerate favicons, app icons and the Open Graph image.
