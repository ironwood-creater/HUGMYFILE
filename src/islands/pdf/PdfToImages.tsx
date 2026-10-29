import { useRef, useState } from 'preact/hooks';
import Notice from '../shared/Notice';
import Progress from '../shared/Progress';
import { Segmented } from '../shared/Controls';
import { StartOverButton } from '../shared/Download';
import { PdfResultCard, PdfStart, Thumb, parseRanges, useSinglePdf, type PdfResult } from './shared';
import { renderPage } from '../../lib/pdf/pdfjs';
import { friendlyError } from '../../lib/errors';
import { baseName } from '../../lib/format';
import { makeZip } from '../../lib/zip';

export default function PdfToImages({ format }: { format: 'jpeg' | 'png' }) {
  const state = useSinglePdf();
  const [dpi, setDpi] = useState('150');
  const [which, setWhich] = useState<'all' | 'some'>('all');
  const [pages, setPages] = useState('');
  const [busy, setBusy] = useState<{ value: number; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PdfResult | null>(null);
  const cancelled = useRef(false);
  const pdf = state.pdf;
  if (!pdf) return <PdfStart state={state} />;
  const count = pdf.info.pages.length;
  const ext = format === 'jpeg' ? 'jpg' : 'png';
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';

  const run = async () => {
    setError(null);
    setResult(null);
    let list = Array.from({ length: count }, (_, i) => i);
    if (which === 'some') {
      const parsed = parseRanges(pages, count);
      if (parsed.error) {
        setError(parsed.error);
        return;
      }
      list = [...new Set(parsed.ranges.flat())];
    }
    cancelled.current = false;
    const files: { name: string; blob: Blob }[] = [];
    const base = baseName(pdf.file.name);
    try {
      for (let k = 0; k < list.length; k++) {
        if (cancelled.current) throw new DOMException('Cancelled', 'AbortError');
        const i = list[k]!;
        setBusy({ value: k / list.length, label: `Converting page ${i + 1} (${k + 1} of ${list.length})…` });
        const page = await pdf.doc.getPage(i + 1);
        const canvas = await renderPage(page, Number(dpi) / 72);
        const blob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create the image'))), mime, format === 'jpeg' ? 0.92 : undefined),
        );
        canvas.width = 1;
        canvas.height = 1;
        page.cleanup();
        files.push({ name: `${base}-page-${i + 1}.${ext}`, blob });
      }
      if (files.length === 1) setResult({ blob: files[0]!.blob, name: files[0]!.name });
      else {
        setBusy({ value: 1, label: 'Packing your images into a ZIP…' });
        setResult({ blob: await makeZip(files), name: `${base}-${ext}.zip` });
      }
    } catch (err) {
      setError(friendlyError(err).text);
    } finally {
      setBusy(null);
    }
  };

  const reset = () => {
    state.reset();
    setResult(null);
  };

  return (
    <div class="card space-y-5 p-4 md:p-6">
      <div class="flex flex-wrap items-start gap-5">
        <Thumb doc={pdf.doc} page={0} width={120} />
        <div class="min-w-[14rem] flex-1 space-y-4">
          <p class="font-bold">
            {pdf.file.name} · {count} page{count === 1 ? '' : 's'}
          </p>
          <Segmented<string>
            label="Image quality"
            name="dpi"
            value={dpi}
            onChange={(v) => { setDpi(v); setResult(null); }}
            testId="dpi"
            options={[
              { value: '72', label: 'Screen (72 DPI)' },
              { value: '150', label: 'Standard (150 DPI)' },
              { value: '300', label: 'Print (300 DPI)' },
            ]}
          />
          <Segmented<'all' | 'some'>
            label="Pages"
            name="which"
            value={which}
            onChange={(v) => { setWhich(v); setResult(null); }}
            options={[
              { value: 'all', label: `All ${count} pages` },
              { value: 'some', label: 'Choose pages' },
            ]}
          />
          {which === 'some' && (
            <input class="field max-w-xs" placeholder="e.g. 1, 3-5" value={pages} onInput={(e) => { setPages(e.currentTarget.value); setResult(null); }} aria-label="Pages to convert" data-testid="pages-input" />
          )}
        </div>
      </div>
      {error && <Notice kind="error" testId="error">{error}</Notice>}
      {busy ? (
        <Progress value={busy.value} label={busy.label} onCancel={() => (cancelled.current = true)} />
      ) : result ? (
        <PdfResultCard result={result} onReset={reset} label={result.name.endsWith('.zip') ? 'Download ZIP' : `Download ${ext.toUpperCase()}`} />
      ) : (
        <div class="flex flex-wrap gap-3">
          <button type="button" class="btn btn-primary" onClick={run} data-testid="run">
            Convert to {format === 'jpeg' ? 'JPG' : 'PNG'}
          </button>
          <StartOverButton onReset={reset} />
        </div>
      )}
    </div>
  );
}
