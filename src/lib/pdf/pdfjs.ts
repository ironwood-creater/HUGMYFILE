// Lazy loader for pdf.js (Apache-2.0, legacy build for older browsers). The
// worker, CMaps, standard fonts and WASM decoders are all served from our own site.
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { ToolError } from '../errors';

type PdfJs = typeof import('pdfjs-dist/legacy/build/pdf.mjs');
let lib: Promise<PdfJs> | null = null;

const base = () => `/vendor/pdfjs/${__PDFJS_VERSION__}`;

export function loadPdfJs(): Promise<PdfJs> {
  lib ??= import('pdfjs-dist/legacy/build/pdf.mjs').then((m) => {
    m.GlobalWorkerOptions.workerSrc = `${base()}/pdf.worker.min.mjs`;
    return m;
  });
  return lib;
}

/** Opens a PDF for viewing. Protected or broken files raise a friendly ToolError. */
export async function openPdf(bytes: Uint8Array): Promise<PDFDocumentProxy> {
  const pdfjs = await loadPdfJs();
  const task = pdfjs.getDocument({
    data: bytes.slice(),
    cMapUrl: `${base()}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${base()}/standard_fonts/`,
    wasmUrl: `${base()}/wasm/`,
    iccUrl: `${base()}/iccs/`,
    enableXfa: false,
    verbosity: 0,
  });
  try {
    return await task.promise;
  } catch (err) {
    const name = (err as { name?: string })?.name;
    if (name === 'PasswordException') throw new ToolError('encrypted-pdf');
    throw new ToolError('damaged-pdf', err instanceof Error ? err.message : String(err));
  }
}

export const MAX_RENDER_PIXELS = 16_000_000;

const latest = new WeakMap<HTMLCanvasElement, number>();
let renderSeq = 0;

/**
 * Renders a page at the given scale (clamped to safe canvas sizes) into a fresh
 * canvas. If a visible target canvas is given, the finished picture is copied
 * into it, and only the most recent request for that canvas wins, so quick
 * resizes never leave a half-drawn page behind.
 */
export async function renderPage(page: PDFPageProxy, scale: number, target?: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const ticket = ++renderSeq;
  if (target) latest.set(target, ticket);
  let viewport = page.getViewport({ scale });
  const pixels = viewport.width * viewport.height;
  if (pixels > MAX_RENDER_PIXELS) viewport = page.getViewport({ scale: scale * Math.sqrt(MAX_RENDER_PIXELS / pixels) });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  await page.render({ canvas, viewport, background: '#ffffff' }).promise;
  if (!target) return canvas;
  if (latest.get(target) === ticket) {
    target.width = canvas.width;
    target.height = canvas.height;
    target.getContext('2d')?.drawImage(canvas, 0, 0);
  }
  canvas.width = 1;
  canvas.height = 1;
  return target;
}

/** Size of a page as displayed (rotation applied), in points. */
export function pageSize(page: PDFPageProxy): { width: number; height: number } {
  const v = page.getViewport({ scale: 1 });
  return { width: v.width, height: v.height };
}
