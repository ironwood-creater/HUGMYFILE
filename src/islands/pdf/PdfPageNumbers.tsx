import { useState } from 'preact/hooks';
import Notice from '../shared/Notice';
import Progress from '../shared/Progress';
import { StartOverButton } from '../shared/Download';
import { PdfResultCard, PdfStart, Thumb, pdfEngine, useSinglePdf, type PdfResult } from './shared';
import { friendlyError } from '../../lib/errors';
import { baseName } from '../../lib/format';
import type { NumberPosition } from '../../lib/pdf/types';

const POSITIONS: { value: NumberPosition; label: string }[] = [
  { value: 'top-left', label: 'Top left' },
  { value: 'top-center', label: 'Top center' },
  { value: 'top-right', label: 'Top right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-center', label: 'Bottom center' },
  { value: 'bottom-right', label: 'Bottom right' },
];
const FORMATS = [
  { value: '{n}', label: '1, 2, 3' },
  { value: 'Page {n}', label: 'Page 1' },
  { value: '{n} of {total}', label: '1 of 10' },
  { value: 'Page {n} of {total}', label: 'Page 1 of 10' },
  { value: '- {n} -', label: '- 1 -' },
];

export default function PdfPageNumbers() {
  const state = useSinglePdf();
  const [position, setPosition] = useState<NumberPosition>('bottom-center');
  const [format, setFormat] = useState('{n}');
  const [size, setSize] = useState(11);
  const [startAt, setStartAt] = useState(1);
  const [fromPage, setFromPage] = useState(1);
  const [margin, setMargin] = useState(28);
  const [color, setColor] = useState('#000000');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PdfResult | null>(null);
  const pdf = state.pdf;
  if (!pdf) return <PdfStart state={state} />;
  const count = pdf.info.pages.length;

  const run = async () => {
    setError(null);
    setBusy(true);
    try {
      const blob = await pdfEngine().numbers(pdf.bytes, { position, format, size, startAt, fromPage, margin, color });
      setResult({ blob, name: `${baseName(pdf.file.name)}-numbered.pdf` });
    } catch (err) {
      setError(friendlyError(err).text);
    } finally {
      setBusy(false);
    }
  };
  const reset = () => {
    state.reset();
    setResult(null);
  };
  const touch = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setResult(null);
  };

  const sample = format.replace('{n}', String(startAt)).replace('{total}', String(startAt + count - fromPage));
  const top = position.startsWith('top');
  const align = position.endsWith('left') ? 'justify-start' : position.endsWith('right') ? 'justify-end' : 'justify-center';

  return (
    <div class="card space-y-5 p-4 md:p-6">
      <div class="grid gap-6 md:grid-cols-[auto_1fr]">
        <div class="mx-auto">
          <div class="relative">
            <Thumb doc={pdf.doc} page={Math.min(count, fromPage) - 1} width={200} />
            <div class={`pointer-events-none absolute inset-x-3 flex ${align} ${top ? 'top-2' : 'bottom-2'}`} aria-hidden="true">
              <span class="rounded bg-coral-100 px-1 font-sans text-[11px] font-bold text-coral-900">{sample}</span>
            </div>
          </div>
          <p class="mt-2 text-center text-sm text-muted">{pdf.file.name} · {count} pages</p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="field-label">Position</span>
            <select class="field" value={position} onChange={(e) => touch(setPosition)(e.currentTarget.value as NumberPosition)} data-testid="position">
              {POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </label>
          <label class="block">
            <span class="field-label">Style</span>
            <select class="field" value={format} onChange={(e) => touch(setFormat)(e.currentTarget.value)} data-testid="format">
              {FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </label>
          <label class="block">
            <span class="field-label">Text size (pt)</span>
            <input type="number" min={6} max={48} class="field" value={size} onInput={(e) => touch(setSize)(Math.max(6, Math.min(48, Number(e.currentTarget.value) || 11)))} data-testid="size" />
          </label>
          <label class="block">
            <span class="field-label">First number</span>
            <input type="number" min={0} class="field" value={startAt} onInput={(e) => touch(setStartAt)(Math.max(0, Math.round(Number(e.currentTarget.value) || 0)))} data-testid="start-at" />
          </label>
          <label class="block">
            <span class="field-label">Start on page</span>
            <input type="number" min={1} max={count} class="field" value={fromPage} onInput={(e) => touch(setFromPage)(Math.max(1, Math.min(count, Math.round(Number(e.currentTarget.value) || 1))))} data-testid="from-page" />
            <span class="mt-1 block text-sm text-muted">Skip a cover page by starting on page 2.</span>
          </label>
          <label class="block">
            <span class="field-label">Distance from edge (pt)</span>
            <input type="number" min={6} max={120} class="field" value={margin} onInput={(e) => touch(setMargin)(Math.max(6, Math.min(120, Number(e.currentTarget.value) || 28)))} />
          </label>
          <label class="block">
            <span class="field-label">Color</span>
            <input type="color" class="h-11 w-16 cursor-pointer rounded-lg border-2 border-line" value={color} onInput={(e) => touch(setColor)(e.currentTarget.value)} />
          </label>
        </div>
      </div>
      {error && <Notice kind="error" testId="error">{error}</Notice>}
      {busy ? (
        <Progress value={null} label="Adding page numbers…" />
      ) : result ? (
        <PdfResultCard result={result} onReset={reset} />
      ) : (
        <div class="flex flex-wrap gap-3">
          <button type="button" class="btn btn-primary" onClick={run} data-testid="run">Add page numbers</button>
          <StartOverButton onReset={reset} />
        </div>
      )}
    </div>
  );
}
