import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs';
import DropZone from '../shared/DropZone';
import Notice from '../shared/Notice';
import Progress from '../shared/Progress';
import { DownloadButton, DoneBanner, StartOverButton } from '../shared/Download';
import { useUnsaved } from '../shared/useUnsaved';
import { PdfEngine } from '../../lib/pdf/client';
import { openPdf, renderPage } from '../../lib/pdf/pdfjs';
import { friendlyError } from '../../lib/errors';
import { formatBytes, sizeChange } from '../../lib/format';
import type { DocInfo } from '../../lib/pdf/types';

export const ACCEPT_PDF = 'application/pdf,.pdf';
export const isPdf = (f: File) => (f.type === 'application/pdf' || /\.pdf$/i.test(f.name) ? null : 'this isn’t a PDF file.');

let sharedEngine: PdfEngine | null = null;
/** One PDF worker per page, created on first use. */
export function pdfEngine(): PdfEngine {
  sharedEngine ??= new PdfEngine();
  return sharedEngine;
}

export interface LoadedPdf {
  file: File;
  bytes: Uint8Array;
  info: DocInfo;
  doc: PDFDocumentProxy;
}

/** Reads a PDF, checks it can be edited (not protected or damaged) and opens it for previews. */
export async function loadPdf(file: File): Promise<LoadedPdf> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const info = await pdfEngine().inspect(bytes);
  const doc = await openPdf(bytes);
  return { file, bytes, info, doc };
}

export function useSinglePdf() {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => () => void pdf?.doc.loadingTask.destroy(), [pdf]);
  const open = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setError(null);
    setLoading(true);
    try {
      setPdf(await loadPdf(f));
    } catch (err) {
      setPdf(null);
      setError(friendlyError(err).text);
    } finally {
      setLoading(false);
    }
  };
  const reset = () => {
    setPdf(null);
    setError(null);
  };
  return { pdf, loading, error, open, reset };
}

export function PdfDrop({ onFiles, multiple = false, title, hint }: { onFiles: (f: File[]) => void; multiple?: boolean; title?: string; hint?: string }) {
  return (
    <DropZone
      accept={ACCEPT_PDF}
      multiple={multiple}
      onFiles={onFiles}
      validate={isPdf}
      title={title ?? (multiple ? 'Drop your PDFs here — we’ll take good care of them.' : 'Drop your PDF here — we’ll take good care of it.')}
      hint={hint}
    />
  );
}

/** Empty state for single-PDF tools: drop zone, loading and error messages. */
export function PdfStart({ state, title, hint }: { state: ReturnType<typeof useSinglePdf>; title?: string; hint?: string }) {
  return (
    <div class="card space-y-4 p-4 md:p-6">
      <PdfDrop onFiles={state.open} title={title} hint={hint} />
      {state.loading && <Progress value={null} label="Opening your PDF…" />}
      {state.error && (
        <Notice kind="error" testId="error">
          {state.error}
        </Notice>
      )}
    </div>
  );
}

/** A page thumbnail that renders only when scrolled into view. */
export function Thumb({ doc, page, width = 140, class: className = '', rotate = 0 }: { doc: PDFDocumentProxy; page: number; width?: number; class?: string; rotate?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ratio, setRatio] = useState(1.414);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let cancelled = false;
    const draw = async () => {
      const p = await doc.getPage(page + 1);
      if (cancelled) return;
      const v = p.getViewport({ scale: 1 });
      setRatio(v.height / v.width);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      await renderPage(p, (width * dpr) / v.width, el);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          draw().catch(() => undefined);
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [doc, page, width]);
  // A sideways page is shrunk so it still fits the same box as an upright one.
  const turned = rotate % 180 !== 0;
  const shrink = turned ? Math.min(1, 1 / ratio, ratio) : 1;
  return (
    <div class={`grid place-items-center overflow-hidden ${className}`} style={{ width: `${width}px`, height: `${width * Math.max(ratio, turned ? 1 / ratio : 0)}px` }}>
      <canvas
        ref={ref}
        class="block rounded-md border border-line bg-white shadow-sm transition-transform"
        style={{ width: `${width}px`, height: `${width * ratio}px`, transform: rotate ? `rotate(${rotate}deg) scale(${shrink})` : undefined }}
        aria-label={`Page ${page + 1}`}
        role="img"
      />
    </div>
  );
}

export interface PdfResult {
  blob: Blob;
  name: string;
}

/** Success card with a download button and the unsaved-file reminder. */
export function PdfResultCard({ result, originalSize, children, onReset, label = 'Download PDF' }: { result: PdfResult; originalSize?: number; children?: ComponentChildren; onReset: () => void; label?: string }) {
  const unsaved = useUnsaved(1, result);
  return (
    <div class="space-y-4">
      <DoneBanner allSaved={unsaved.allSaved}>
        <p class="text-sm">
          {result.name} · {formatBytes(result.blob.size)}
          {originalSize ? ` (${sizeChange(originalSize, result.blob.size)})` : ''}
        </p>
      </DoneBanner>
      {children}
      <div class="flex flex-wrap gap-3">
        <DownloadButton blob={result.blob} filename={result.name} label={label} onSaved={() => unsaved.save()} />
        <StartOverButton onReset={onReset} />
      </div>
    </div>
  );
}

/** Parses "1-3, 5, 8-10" into 0-based page lists. Returns an error message if invalid. */
export function parseRanges(input: string, pageCount: number): { ranges: number[][]; error: string | null } {
  const ranges: number[][] = [];
  const parts = input.split(/[,;]+/).map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return { ranges, error: 'Please enter at least one page or range, for example 1-3, 5.' };
  for (const part of parts) {
    const m = /^(\d+)\s*(?:-\s*(\d+|end))?$/i.exec(part);
    if (!m) return { ranges: [], error: `“${part}” isn’t a page or range. Use numbers like 2 or 4-7.` };
    const a = Number(m[1]);
    const b = m[2] ? (m[2].toLowerCase() === 'end' ? pageCount : Number(m[2])) : a;
    if (a < 1 || b < 1 || a > pageCount || b > pageCount) return { ranges: [], error: `Page numbers must be between 1 and ${pageCount}.` };
    const list: number[] = [];
    if (a <= b) for (let i = a; i <= b; i++) list.push(i - 1);
    else for (let i = a; i >= b; i--) list.push(i - 1);
    ranges.push(list);
  }
  return { ranges, error: null };
}
