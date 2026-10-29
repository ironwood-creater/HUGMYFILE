import { SITE_URL, SITE_NAME } from '../config';

/** Absolute URL for a site path, always built from SITE_URL in src/config.ts. */
export function absoluteUrl(path = '/'): string {
  const base = SITE_URL.replace(/\/+$/, '');
  if (path === '/' || path === '') return `${base}/`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    logo: absoluteUrl('/icons/icon-512.png'),
    description: 'Free, private online tools for images, PDFs, QR codes, signatures and OCR that run entirely in your browser.',
  };
}
