import { useState } from 'preact/hooks';
import Notice from '../shared/Notice';
import Progress from '../shared/Progress';
import { Segmented } from '../shared/Controls';
import { StartOverButton } from '../shared/Download';
import { PdfResultCard, PdfStart, Thumb, parseRanges, pdfEngine, useSinglePdf, type PdfResult } from './shared';
import { friendlyError } from '../../lib/errors';
import { baseName } from '../../lib/format';
import { makeZip } from '../../lib/zip';

type Mode = 'ranges' | 'every' | 'extract';

function label(list: number[]): string {
  if (list.length === 1) return `page-${list[0]! + 1}`;
  return `pages-${list[0]! + 1}-${list[list.length - 1]! + 1}`;
}

export default function PdfSplit() {
  const state = useSinglePdf();
  const [mode, setMode] = useState<Mode>('ranges');
  const [ranges, setRanges] = useState('');
  const [pick, setPick] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PdfResult | null>(null);
  const pdf = state.pdf;

  if (!pdf) return <PdfStart state={state} />;
  const count = pdf.info.pages.length;
  const base = baseName(pdf.file.name);

  const toggle = (i: number) => {
    setResult(null);
    const next = new Set(pick);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setPick(next);
  };

  const run = async () => {
    setError(null);
    setResult(null);
    try {
      if (mode === 'extract') {
        const pages = [...pick].sort((a, b) => a - b);
        if (!pages.length) throw new Error('Select at least one page to extract.');
        setBusy('Extracting pages…');
        const blob = await pdfEngine().extract(pdf.bytes, pages);
        setResult({ blob, name: `${base}-extracted.pdf` });
        return;
      }
      let lists: number[][];
      if (mode === 'every') lists = Array.from({ length: count }, (_, i) => [i]);
      else {
        const parsed = parseRanges(ranges, count);
        if (parsed.error) throw new Error(parsed.error);
        lists = parsed.ranges;
      }
      setBusy('Splitting your PDF…');
      const parts = await pdfEngine().split(pdf.bytes, lists, (v) => setBusy(`Splitting your PDF… ${Math.round(v * 100)}%`));
      if (parts.length === 1) setResult({ blob: parts[0]!, name: `${base}-${label(lists[0]!)}.pdf` });
      else setResult({ blob: await makeZip(parts.map((blob, i) => ({ blob, name: `${base}-${label(lists[i]!)}.pdf` }))), name: `${base}-split.zip` });
    } catch (err) {
      setError(err instanceof Error && !('code' in err) ? err.message : friendlyError(err).text);
    } finally {
      setBusy(null);
    }
  };

  const reset = () => {
    state.reset();
    setResult(null);
    setPick(new Set());
    setRanges('');
  };

  return (
    <div class="card space-y-5 p-4 md:p-6">
      <p class="font-bold">
        {pdf.file.name} · {count} page{count === 1 ? '' : 's'}
      </p>
      <Segmented<Mode>
        label="How do you want to split it?"
        name="split-mode"
        value={mode}
        onChange={(m) => {
          setMode(m);
          setResult(null);
        }}
        testId="split-mode"
        options={[
          { value: 'ranges', label: 'By page ranges' },
          { value: 'every', label: 'Every page' },
          { value: 'extract', label: 'Extract pages' },
        ]}
      />
      {mode === 'ranges' && (
        <div>
          <label for="ranges" class="field-label">Ranges (each becomes its own PDF)</label>
          <input id="ranges" class="field max-w-md" placeholder={`e.g. 1-${Math.max(1, Math.ceil(count / 2))}, ${Math.min(count, Math.ceil(count / 2) + 1)}-${count}`} value={ranges} onInput={(e) => { setRanges(e.currentTarget.value); setResult(null); }} data-testid="ranges" />
          <p class="mt-1 text-sm text-muted">Separate ranges with commas. “end” means the last page, like 5-end.</p>
        </div>
      )}
      {mode === 'every' && <p class="text-sm text-muted">You’ll get {count} single-page PDFs in a ZIP file.</p>}
      {mode === 'extract' && <p class="text-sm text-muted">Tap the pages you want to keep. They will be saved together in one new PDF ({pick.size} selected).</p>}

      <ul class="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6" data-testid="pages">
        {pdf.info.pages.map((_, i) => {
          const selected = mode === 'extract' && pick.has(i);
          return (
            <li key={i}>
              <button
                type="button"
                class={`w-full rounded-xl border-2 p-2 text-center ${selected ? 'border-primary bg-surface-2' : 'border-transparent'} ${mode === 'extract' ? 'cursor-pointer hover:border-coral-300' : 'cursor-default'}`}
                onClick={() => mode === 'extract' && toggle(i)}
                aria-pressed={mode === 'extract' ? selected : undefined}
                aria-label={`Page ${i + 1}${selected ? ', selected' : ''}`}
                data-testid="page-thumb"
              >
                <Thumb doc={pdf.doc} page={i} width={90} class="mx-auto" />
                <span class="mt-1 block text-sm font-bold">{i + 1}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {error && <Notice kind="error" testId="error">{error}</Notice>}
      {busy ? (
        <Progress value={null} label={busy} />
      ) : result ? (
        <PdfResultCard result={result} onReset={reset} label={result.name.endsWith('.zip') ? 'Download ZIP' : 'Download PDF'} />
      ) : (
        <div class="flex flex-wrap gap-3">
          <button type="button" class="btn btn-primary" onClick={run} data-testid="run">
            {mode === 'extract' ? 'Extract pages' : 'Split PDF'}
          </button>
          <StartOverButton onReset={reset} />
        </div>
      )}
    </div>
  );
}
