// Generates /ads.txt only when ads are enabled in src/config.ts.
import type { APIRoute, GetStaticPaths } from 'astro';
import { ADS_ENABLED, ADSENSE_CLIENT_ID } from '../config';

export const getStaticPaths: GetStaticPaths = () =>
  ADS_ENABLED && ADSENSE_CLIENT_ID ? [{ params: { adsfile: 'ads' } }] : [];

export const GET: APIRoute = () => {
  const publisher = ADSENSE_CLIENT_ID.replace(/^ca-/, '');
  return new Response(`google.com, ${publisher}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
