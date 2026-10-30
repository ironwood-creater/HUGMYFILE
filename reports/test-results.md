# End-to-end test results

Generated 2026-10-30T16:11:27.376Z from 1 Playwright report (`npm run build && npx playwright test --project=chromium-desktop --project=chromium-mobile`). Firefox and WebKit could not run in the build environment; they run in GitHub Actions on every push.

- results-chromium.json: 313 passed, 0 failed, 0 flaky, 5 skipped (244 s)

| Test | Chromium 🖥 | Chromium 📱 | Firefox 🖥 | Firefox 📱 | WebKit 🖥 | WebKit 📱 |
|---|---|---|---|---|---|---|
| image.spec.ts › image tools › bulk-image-compressor returns a ZIP with every file | ✅ | ✅ | not run | not run | not run | not run |
| image.spec.ts › image tools › compress-image handles a 10-megapixel JPG without crashing | ✅ | ✅ | not run | not run | not run | not run |
| image.spec.ts › image tools › compress-image makes a JPG smaller and keeps it valid | ✅ | ✅ | not run | not run | not run | not run |
| image.spec.ts › image tools › compress-image shrinks a PNG by reducing colors | ✅ | ✅ | not run | not run | not run | not run |
| image.spec.ts › image tools › compress-image-to-100kb produces a file under 100 KB | ✅ | ✅ | not run | not run | not run | not run |
| image.spec.ts › image tools › compress-image-to-200kb produces a file under 200 KB | ✅ | ✅ | not run | not run | not run | not run |
| image.spec.ts › image tools › compress-image-to-20kb produces a file under 20 KB | ✅ | ✅ | not run | not run | not run | not run |
| image.spec.ts › image tools › compress-image-to-50kb produces a file under 50 KB | ✅ | ✅ | not run | not run | not run | not run |
| image.spec.ts › image tools › compress-to-KB explains when the target is impossible at the exact size | ✅ | ✅ | not run | not run | not run | not run |
| image.spec.ts › image tools › heic-to-jpg shows the friendly message when the browser cannot decode HEIC | ✅ | ✅ | not run | not run | not run | not run |
| image.spec.ts › image tools › jpg-to-avif produces a valid AVIF | ✅ | ✅ | not run | not run | not run | not run |
| image.spec.ts › image tools › jpg-to-png applies EXIF orientation 6 (photo is upright) | ✅ | ✅ | not run | not run | not run | not run |
| image.spec.ts › image tools › jpg-to-png converts and keeps the size | ✅ | ✅ | not run | not run | not run | not run |
| image.spec.ts › image tools › jpg-to-webp converts photos | ✅ | ✅ | not run | not run | not run | not run |
| image.spec.ts › image tools › passport-photo-maker creates an exact 2×2 inch photo under the KB limit | ✅ | ✅ | not run | not run | not run | not run |
| image.spec.ts › image tools › passport-photo-maker makes 35×45 mm photos and a printable PDF sheet | ✅ | ✅ | not run | not run | not run | not run |
| image.spec.ts › image tools › png-to-jpg turns transparent areas white | ✅ | ✅ | not run | not run | not run | not run |
| image.spec.ts › image tools › png-to-webp keeps transparency | ✅ | ✅ | not run | not run | not run | not run |
| image.spec.ts › image tools › resize-image keeps the aspect ratio when locked | ✅ | ✅ | not run | not run | not run | not run |
| image.spec.ts › image tools › resize-image produces the exact requested dimensions | ✅ | ✅ | not run | not run | not run | not run |
| image.spec.ts › image tools › resize-image scales by percentage | ✅ | ✅ | not run | not run | not run | not run |
| image.spec.ts › image tools › webp-to-jpg converts WebP files | ✅ | ✅ | not run | not run | not run | not run |
| image.spec.ts › image tools › webp-to-png converts and keeps transparency | ✅ | ✅ | not run | not run | not run | not run |
| ocr.spec.ts › OCR tools › image-to-text handles several images at once | ✅ | ✅ | not run | not run | not run | not run |
| ocr.spec.ts › OCR tools › image-to-text reads the words in an image | ✅ | ✅ | not run | not run | not run | not run |
| ocr.spec.ts › OCR tools › language data is only downloaded for the chosen language | ✅ | ✅ | not run | not run | not run | not run |
| ocr.spec.ts › OCR tools › pdf-to-text reads the text layer of a typed PDF directly | ✅ | ✅ | not run | not run | not run | not run |
| ocr.spec.ts › OCR tools › pdf-to-text runs OCR on a scanned PDF | ✅ | ✅ | not run | not run | not run | not run |
| ocr.spec.ts › OCR tools › pdf-to-text shows a friendly error for protected PDFs | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › add-page-numbers-to-pdf can skip the first page and start at 5 | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › add-page-numbers-to-pdf shows a friendly error for protected and damaged PDFs | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › add-page-numbers-to-pdf writes readable numbers | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › add-text-to-pdf adds text, shapes, highlight, whiteout and an image | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › add-text-to-pdf keeps the text frame around bold and Cyrillic text | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › add-text-to-pdf shows a friendly error for protected and damaged PDFs | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › add-text-to-pdf shows a friendly message for Hindi text | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › compress-pdf light keeps text extractable and shrinks a bloated file | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › compress-pdf medium produces a smaller valid PDF | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › compress-pdf offers the original when the result would not be smaller | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › compress-pdf shows a friendly error for protected and damaged PDFs | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › compress-pdf strong produces a smaller valid PDF | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › delete-pdf-pages removes the chosen page | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › delete-pdf-pages shows a friendly error for protected and damaged PDFs | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › fill-pdf-form can flatten the answers | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › fill-pdf-form explains when a PDF has no fields, and rejects unsupported scripts | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › fill-pdf-form fills every field type | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › fill-pdf-form shows a friendly error for protected and damaged PDFs | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › jpg-to-pdf turns images into pages (upright) | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › merge-pdf combines files in the chosen order | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › merge-pdf flags protected and damaged files and blocks merging | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › pdf-to-jpg converts every page into a ZIP of JPGs | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › pdf-to-jpg shows a friendly error for protected and damaged PDFs | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › pdf-to-png converts a chosen page | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › pdf-to-png shows a friendly error for protected and damaged PDFs | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › reorder-pdf-pages moves pages | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › reorder-pdf-pages shows a friendly error for protected and damaged PDFs | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › rotate-pdf rotates single pages and all pages | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › rotate-pdf shows a friendly error for protected and damaged PDFs | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › sign-pdf accepts a typed signature on page 2 | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › sign-pdf places a drawn signature, name and date | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › sign-pdf shows a friendly error for protected and damaged PDFs | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › sign-pdf shows a friendly message for Arabic text | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › split-pdf extracts selected pages into one PDF | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › split-pdf separates every page | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › split-pdf shows a friendly error for protected and damaged PDFs | ✅ | ✅ | not run | not run | not run | not run |
| pdf.spec.ts › PDF tools › split-pdf splits by ranges into a ZIP | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › / makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /404 makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /about makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /add-page-numbers-to-pdf makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /add-text-to-pdf makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /bulk-image-compressor makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /compress-image makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /compress-image-to-100kb makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /compress-image-to-200kb makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /compress-image-to-20kb makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /compress-image-to-50kb makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /compress-pdf makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /contact makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /delete-pdf-pages makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /email-qr-code makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /fill-pdf-form makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /heic-to-jpg makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /image-to-text makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /jpg-to-avif makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /jpg-to-pdf makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /jpg-to-png makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /jpg-to-webp makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /licenses makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /merge-pdf makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /passport-photo-maker makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /pdf-to-jpg makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /pdf-to-png makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /pdf-to-text makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /phone-qr-code makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /png-to-jpg makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /png-to-webp makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /privacy-policy makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /qr-code-generator makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /qr-code-with-logo makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /reorder-pdf-pages makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /resize-image makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /rotate-pdf makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /sign-pdf makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /signature-maker makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /split-pdf makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /terms makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /vcard-qr-code makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /webp-to-jpg makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /webp-to-png makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /whatsapp-qr-code makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| privacy.spec.ts › privacy: every page loads only from this site › /wifi-qr-code makes no third-party requests and stores nothing | ✅ | ✅ | not run | not run | not run | not run |
| qr.spec.ts › QR code tools › email-qr-code builds a mailto link | ✅ | ✅ | not run | not run | not run | not run |
| qr.spec.ts › QR code tools › low-contrast colors show a warning | ✅ | ✅ | not run | not run | not run | not run |
| qr.spec.ts › QR code tools › phone-qr-code makes call and SMS codes | ✅ | ✅ | not run | not run | not run | not run |
| qr.spec.ts › QR code tools › qr-code-generator encodes a link exactly (PNG + SVG) | ✅ | ✅ | not run | not run | not run | not run |
| qr.spec.ts › QR code tools › qr-code-generator encodes accented text as UTF-8 | ✅ | ✅ | not run | not run | not run | not run |
| qr.spec.ts › QR code tools › qr-code-with-logo still decodes with a logo in the middle | ✅ | ✅ | not run | not run | not run | not run |
| qr.spec.ts › QR code tools › vcard-qr-code encodes a contact card | ✅ | ✅ | not run | not run | not run | not run |
| qr.spec.ts › QR code tools › whatsapp-qr-code builds a wa.me link with the message | ✅ | ✅ | not run | not run | not run | not run |
| qr.spec.ts › QR code tools › wifi-qr-code escapes special characters correctly | ✅ | ✅ | not run | not run | not run | not run |
| seo.spec.ts › SEO and content checks (all pages) › canonical URLs, Open Graph and Twitter tags use SITE_URL | ✅ | ✅ | not run | not run | not run | not run |
| seo.spec.ts › SEO and content checks (all pages) › every required page exists | ✅ | ✅ | not run | not run | not run | not run |
| seo.spec.ts › SEO and content checks (all pages) › headings never skip a level (h1 → h2 → h3) | ✅ | ✅ | not run | not run | not run | not run |
| seo.spec.ts › SEO and content checks (all pages) › sitemap lists every page except 404 | ✅ | ✅ | not run | not run | not run | not run |
| seo.spec.ts › SEO and content checks (all pages) › structured data: Organization everywhere; SoftwareApplication, BreadcrumbList and FAQPage on tools | ✅ | ✅ | not run | not run | not run | not run |
| seo.spec.ts › SEO and content checks (all pages) › titles, descriptions and H1s are present and unique | ✅ | ✅ | not run | not run | not run | not run |
| seo.spec.ts › SEO and content checks (all pages) › tool pages end their title with "\| HugMyFile" and have unique FAQ and how-to content | ✅ | ✅ | not run | not run | not run | not run |
| seo.spec.ts › SEO and content checks (all pages) › web app manifest is named HugMyFile | ✅ | ✅ | not run | not run | not run | not run |
| signature.spec.ts › signature maker › blue ink is used for the drawing | ✅ | ✅ | not run | not run | not run | not run |
| signature.spec.ts › signature maker › drawn signature downloads as a trimmed transparent PNG and an SVG | ✅ | ✅ | not run | not run | not run | not run |
| signature.spec.ts › signature maker › shows the legal reminder | ✅ | ✅ | not run | not run | not run | not run |
| signature.spec.ts › signature maker › typed signature becomes a transparent PNG | ✅ | ✅ | not run | not run | not run | not run |
| signature.spec.ts › signature maker › undo removes the last stroke and clear empties the pad | ✅ | ✅ | not run | not run | not run | not run |
| signature.spec.ts › signature maker › uploaded signature photo gets a transparent background | ✅ | ✅ | not run | not run | not run | not run |
| site.spec.ts › licenses page lists shipped libraries with their licenses | ✅ | ✅ | not run | not run | not run | not run |
| site.spec.ts › no page scrolls sideways on a small 320px phone | skipped | ✅ | not run | not run | not run | not run |
| site.spec.ts › site shell › /about renders | ✅ | ✅ | not run | not run | not run | not run |
| site.spec.ts › site shell › /contact renders | ✅ | ✅ | not run | not run | not run | not run |
| site.spec.ts › site shell › /privacy-policy renders | ✅ | ✅ | not run | not run | not run | not run |
| site.spec.ts › site shell › /terms renders | ✅ | ✅ | not run | not run | not run | not run |
| site.spec.ts › site shell › a menu opens on mouse hover, stays open when clicked, and closes when the mouse leaves | ✅ | skipped | not run | not run | not run | not run |
| site.spec.ts › site shell › ads are off: no ad slots or ad scripts are rendered | ✅ | ✅ | not run | not run | not run | not run |
| site.spec.ts › site shell › category chips glide to their section below the header, even after a search hid it | ✅ | ✅ | not run | not run | not run | not run |
| site.spec.ts › site shell › contact page shows the coming-soon note while no email is set | ✅ | ✅ | not run | not run | not run | not run |
| site.spec.ts › site shell › footer carries the trademark notice | ✅ | ✅ | not run | not run | not run | not run |
| site.spec.ts › site shell › header menus stay on screen and every tool can be reached on tablets and short laptops | ✅ | skipped | not run | not run | not run | not run |
| site.spec.ts › site shell › homepage shows every tool and search filters them | ✅ | ✅ | not run | not run | not run | not run |
| site.spec.ts › site shell › hovering or focusing a link starts loading that page early | ✅ | skipped | not run | not run | not run | not run |
| site.spec.ts › site shell › navigation menu opens on desktop and phone | ✅ | ✅ | not run | not run | not run | not run |
| site.spec.ts › site shell › privacy policy states that files are never uploaded | ✅ | ✅ | not run | not run | not run | not run |
| site.spec.ts › site shell › robots.txt and sitemap point at SITE_URL | ✅ | ✅ | not run | not run | not run | not run |
| site.spec.ts › site shell › terms include the signature and ownership rules | ✅ | ✅ | not run | not run | not run | not run |
| site.spec.ts › site shell › the header marks the section of the current tool | ✅ | ✅ | not run | not run | not run | not run |
| site.spec.ts › site shell › the phone menu opens the current section, keeps the page still and closes with Escape | skipped | ✅ | not run | not run | not run | not run |
| site.spec.ts › site shell › theme toggle switches to dark mode | ✅ | ✅ | not run | not run | not run | not run |
| site.spec.ts › site shell › unknown pages show the friendly 404 | ✅ | ✅ | not run | not run | not run | not run |
| unsaved.spec.ts › unsaved result warning › does not warn after the result was downloaded | ✅ | ✅ | not run | not run | not run | not run |
| unsaved.spec.ts › unsaved result warning › warns before leaving when a result has not been downloaded | ✅ | ✅ | not run | not run | not run | not run |

| Project | Passed | Failed |
|---|---|---|
| chromium-desktop | 157 | 2 |
| chromium-mobile | 156 | 3 |
| firefox-desktop | not run | not run |
| firefox-mobile | not run | not run |
| webkit-desktop | not run | not run |
| webkit-mobile | not run | not run |
