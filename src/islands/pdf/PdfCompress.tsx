import { useEffect, useRef, useState } from 'preact/hooks';
import Notice from '../shared/Notice';
import Progress from '../shared/Progress';
import { DownloadButton, StartOverButton } from '../shared/Download';
import { PdfResultCard, PdfStart, pdfEngine, useSinglePdf, type PdfResult } from './shared';
import { renderPage } from '../../lib/pdf/pdfjs';
import { ImageEngine } from '../../lib/image/client';
import { friendlyError } from '../../lib/errors';
import { baseName, formatBytes } from '../../lib/format';

type Level = 'light' | 'medium' | 'strong';

const LEVELS: { value: Level; title: string; text: string; dpi: number; quality: number }[] = [
  {
    value: 'light',
    title: 'Light',
    text: 'Cleans up and re-packs the file. Text stays selectable, and links, bookmarks and form fields keep working. Savings depend on the file and are often modest.',
    dpi: 0,
    quality: 0,
  },
  {
    value: 'medium',
    title: 'Medium',
    text: 'Turns every page into a picture at good on-screen quality (about 110 DPI). Usually much smaller, especially for scans and photos. Text can no longer be selected or searched, and links and form fields are removed.',
    dpi: 110,
    quality: 60,
  },
  {
    value: 'strong',
    title: 'Strong',
    text: 'Turns pages into lower-resolution pictures (about 72 DPI). The smallest files, fine for reading on a screen but not for printing. Text can’t be selected, and links and form fields are removed.',
    dpi: 72,
    quality: 42,
  },
];

export default function PdfCompress() {
  const state = useSinglePdf();
  const [level, setLevel] = useState<Level>('light');
  const [busy, setBusy] = useState<{ value: number | null; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PdfResult | null>(null);
  const cancelled = useRef(false);
  const images = useRef<ImageEngine | null>(null);
  useEffect(() => () => images.current?.dispose(), []);
  const pdf = state.pdf;
  if (!pdf) return <PdfStart state={state} />;

  const run = async () => {
    setError(null);
    setResult(null);
    cancelled.current = false;
    const spec = LEVELS.find((l) => l.value === level)!;
    try {
      let blob: Blob;
      if (level === 'light') {
        setBusy({ value: null, label: 'Compressing your PDF…' });
        blob = await pdfEngine().compressLight(pdf.bytes);
      } else {
        images.current ??= new ImageEngine();
        const pages: { jpg: Uint8Array; width: number; height: number }[] = [];
        const count = pdf.info.pages.length;
        for (let i = 0; i < count; i++) {
          if (cancelled.current) throw new DOMException('Cancelled', 'AbortError');
          setBusy({ value: i / count, label: `Compressing page ${i + 1} of ${count}…` });
          const page = await pdf.doc.getPage(i + 1);
          const size = page.getViewport({ scale: 1 });
          const canvas = await renderPage(page, spec.dpi / 72);
          const ctx = canvas.getContext('2d')!;
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          canvas.width = 1;
          canvas.height = 1;
          page.cleanup();
          const out = await images.current.encodePixels({ data: img.data.buffer as ArrayBuffer, width: img.width, height: img.height }, 'jpeg', spec.quality);
          pages.push({ jpg: new Uint8Array(await out.blob.arrayBuffer()), width: size.width, height: size.height });
        }
        setBusy({ value: 1, label: 'Putting your PDF back together…' });
        blob = await pdfEngine().imagePagesPdf(pages);
      }
      setResult({ blob, name: `${baseName(pdf.file.name)}-compressed.pdf` });
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

  const notSmaller = result && result.blob.size >= pdf.file.size;

  return (
    <div class="card space-y-5 p-4 md:p-6">
      <p class="font-bold">
        {pdf.file.name} · {formatBytes(pdf.file.size)} · {pdf.info.pages.length} page{pdf.info.pages.length === 1 ? '' : 's'}
      </p>
      <fieldset>
        <legend class="field-label">Compression level</legend>
        <div class="grid gap-3 md:grid-cols-3">
          {LEVELS.map((l) => (
            <label
              key={l.value}
              class={`flex cursor-pointer flex-col gap-1 rounded-2xl border-2 p-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-sea-500 ${level === l.value ? 'border-primary bg-surface-2' : 'border-line hover:border-coral-300'}`}
            >
              <span class="flex items-center gap-2 font-extrabold">
                <input type="radio" name="level" value={l.value} checked={level === l.value} onChange={() => { setLevel(l.value); setResult(null); }} data-testid={`level-${l.value}`} />
                {l.title}
              </span>
              <span class="text-sm text-muted">{l.text}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && <Notice kind="error" testId="error">{error}</Notice>}
      {busy ? (
        <Progress value={busy.value} label={busy.label} onCancel={level === 'light' ? undefined : () => (cancelled.current = true)} />
      ) : result && notSmaller ? (
        <div class="space-y-4">
          <Notice kind="info" title="This PDF is already compact" testId="not-smaller">
            The {level} result would be {formatBytes(result.blob.size)}, which is not smaller than your original ({formatBytes(pdf.file.size)}). We suggest keeping the original.
            {level === 'light' ? ' Try Medium if a smaller file matters more than selectable text.' : ''}
          </Notice>
          <div class="flex flex-wrap gap-3">
            <DownloadButton blob={pdf.file} filename={pdf.file.name} label="Download original" testId="download-original" />
            <DownloadButton blob={result.blob} filename={result.name} label="Download anyway" variant="secondary" />
            <StartOverButton onReset={reset} />
          </div>
        </div>
      ) : result ? (
        <PdfResultCard result={result} originalSize={pdf.file.size} onReset={reset} />
      ) : (
        <div class="flex flex-wrap gap-3">
          <button type="button" class="btn btn-primary" onClick={run} data-testid="run">Compress PDF</button>
          <StartOverButton onReset={reset} />
        </div>
      )}
    </div>
  );
}
