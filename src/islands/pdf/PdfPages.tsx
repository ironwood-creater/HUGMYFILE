import { useState } from 'preact/hooks';
import { ArrowLeft, ArrowRight, RotateCcw, RotateCw, Trash2, Undo2 } from 'lucide';
import Icon, { type IconNode } from '../shared/Icon';
import Notice from '../shared/Notice';
import Progress from '../shared/Progress';
import { StartOverButton } from '../shared/Download';
import { PdfResultCard, PdfStart, Thumb, pdfEngine, useSinglePdf, type PdfResult } from './shared';
import { friendlyError } from '../../lib/errors';
import { baseName } from '../../lib/format';

type Mode = 'rotate' | 'reorder' | 'delete';

export default function PdfPages({ mode }: { mode: Mode }) {
  const state = useSinglePdf();
  const [turns, setTurns] = useState<number[]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PdfResult | null>(null);
  const pdf = state.pdf;

  if (!pdf) return <PdfStart state={state} />;
  const count = pdf.info.pages.length;
  const currentOrder = order.length === count ? order : Array.from({ length: count }, (_, i) => i);
  const currentTurns = turns.length === count ? turns : Array.from({ length: count }, () => 0);
  const changed = () => setResult(null);

  const turn = (i: number, delta: number) => {
    changed();
    setTurns(currentTurns.map((t, j) => (j === i ? (t + delta + 360) % 360 : t)));
  };
  const turnAll = (delta: number) => {
    changed();
    setTurns(currentTurns.map((t) => (t + delta + 360) % 360));
  };
  const moveTo = (from: number, to: number) => {
    if (to < 0 || to >= count || from === to) return;
    changed();
    const next = currentOrder.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    setOrder(next);
  };
  const toggleRemove = (i: number) => {
    changed();
    const next = new Set(removed);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setRemoved(next);
  };

  const run = async () => {
    setError(null);
    if (mode === 'delete' && removed.size === count) {
      setError('A PDF needs at least one page. Keep at least one page.');
      return;
    }
    setBusy(true);
    try {
      const base = baseName(pdf.file.name);
      let blob: Blob;
      if (mode === 'rotate') blob = await pdfEngine().rotate(pdf.bytes, currentTurns);
      else if (mode === 'reorder') blob = await pdfEngine().organize(pdf.bytes, currentOrder);
      else blob = await pdfEngine().organize(pdf.bytes, currentOrder.filter((i) => !removed.has(i)));
      setResult({ blob, name: `${base}-${mode === 'rotate' ? 'rotated' : mode === 'reorder' ? 'reordered' : 'edited'}.pdf` });
    } catch (err) {
      setError(friendlyError(err).text);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    state.reset();
    setTurns([]);
    setOrder([]);
    setRemoved(new Set());
    setResult(null);
  };

  const hint =
    mode === 'rotate'
      ? 'Use the arrows under each page, or rotate every page at once.'
      : mode === 'reorder'
        ? 'Drag pages into place, or use the arrows under each page.'
        : 'Tap the pages you want to remove. Tap again to keep them.';

  return (
    <div class="card space-y-5 p-4 md:p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="font-bold">
          {pdf.file.name} · {count} page{count === 1 ? '' : 's'}
        </p>
        {mode === 'rotate' && (
          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn btn-secondary btn-sm" onClick={() => turnAll(-90)} data-testid="rotate-all-left">
              <Icon icon={RotateCcw as IconNode} size={16} /> Rotate all left
            </button>
            <button type="button" class="btn btn-secondary btn-sm" onClick={() => turnAll(90)} data-testid="rotate-all-right">
              <Icon icon={RotateCw as IconNode} size={16} /> Rotate all right
            </button>
          </div>
        )}
        {mode === 'reorder' && (
          <button type="button" class="btn btn-secondary btn-sm" onClick={() => { changed(); setOrder(currentOrder.slice().reverse()); }} data-testid="reverse">
            Reverse order
          </button>
        )}
        {mode === 'delete' && removed.size > 0 && (
          <span class="chip bg-coral-50 text-coral-800 dark:bg-[#3a1d17] dark:text-coral-200" aria-live="polite">{removed.size} page{removed.size === 1 ? '' : 's'} will be removed</span>
        )}
      </div>
      <p class="text-sm text-muted">{hint}</p>

      <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5" data-testid="pages">
        {currentOrder.map((pageIndex, pos) => {
          const isRemoved = removed.has(pageIndex);
          return (
            <li
              key={pageIndex}
              class={`flex flex-col items-center gap-2 rounded-2xl border-2 p-2 ${dragFrom === pos ? 'border-coral-400 opacity-60' : isRemoved ? 'border-coral-400 bg-coral-50 dark:bg-[#3a1d17]' : 'border-transparent bg-bg'}`}
              draggable={mode === 'reorder'}
              onDragStart={() => setDragFrom(pos)}
              onDragOver={(e) => mode === 'reorder' && e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragFrom !== null) moveTo(dragFrom, pos);
                setDragFrom(null);
              }}
              onDragEnd={() => setDragFrom(null)}
              data-testid="page-card"
              data-page={pageIndex + 1}
            >
              <button
                type="button"
                class={`relative rounded-lg ${mode === 'delete' ? 'cursor-pointer' : mode === 'reorder' ? 'cursor-grab' : 'cursor-default'}`}
                onClick={() => mode === 'delete' && toggleRemove(pageIndex)}
                aria-pressed={mode === 'delete' ? isRemoved : undefined}
                aria-label={`Page ${pageIndex + 1}${isRemoved ? ', marked for removal' : ''}`}
                data-testid="page-thumb"
              >
                <Thumb doc={pdf.doc} page={pageIndex} width={110} rotate={mode === 'rotate' ? currentTurns[pageIndex] : 0} class={isRemoved ? 'opacity-40' : ''} />
                {isRemoved && (
                  <span class="absolute inset-0 grid place-items-center">
                    <span class="grid size-10 place-items-center rounded-full bg-coral-600 text-white"><Icon icon={Trash2 as IconNode} size={20} /></span>
                  </span>
                )}
              </button>
              <span class="text-sm font-bold">Page {pageIndex + 1}</span>
              {mode === 'rotate' && (
                <div class="flex gap-1">
                  <button type="button" class="btn btn-ghost btn-sm !px-2" onClick={() => turn(pageIndex, -90)} aria-label={`Rotate page ${pageIndex + 1} left`} data-testid="rotate-left">
                    <Icon icon={RotateCcw as IconNode} size={16} />
                  </button>
                  <button type="button" class="btn btn-ghost btn-sm !px-2" onClick={() => turn(pageIndex, 90)} aria-label={`Rotate page ${pageIndex + 1} right`} data-testid="rotate-right">
                    <Icon icon={RotateCw as IconNode} size={16} />
                  </button>
                </div>
              )}
              {mode === 'reorder' && (
                <div class="flex gap-1">
                  <button type="button" class="btn btn-ghost btn-sm !px-2" onClick={() => moveTo(pos, pos - 1)} disabled={pos === 0} aria-label={`Move page ${pageIndex + 1} earlier`} data-testid="move-earlier">
                    <Icon icon={ArrowLeft as IconNode} size={16} />
                  </button>
                  <button type="button" class="btn btn-ghost btn-sm !px-2" onClick={() => moveTo(pos, pos + 1)} disabled={pos === count - 1} aria-label={`Move page ${pageIndex + 1} later`} data-testid="move-later">
                    <Icon icon={ArrowRight as IconNode} size={16} />
                  </button>
                </div>
              )}
              {mode === 'delete' && isRemoved && (
                <button type="button" class="btn btn-ghost btn-sm" onClick={() => toggleRemove(pageIndex)}>
                  <Icon icon={Undo2 as IconNode} size={14} /> Keep
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {error && <Notice kind="error" testId="error">{error}</Notice>}
      {busy ? (
        <Progress value={null} label="Saving your PDF…" />
      ) : result ? (
        <PdfResultCard result={result} onReset={reset} />
      ) : (
        <div class="flex flex-wrap gap-3">
          <button type="button" class="btn btn-primary" onClick={run} data-testid="run">
            {mode === 'rotate' ? 'Save rotated PDF' : mode === 'reorder' ? 'Save new order' : `Remove ${removed.size || ''} page${removed.size === 1 ? '' : 's'}`.replace('  ', ' ')}
          </button>
          <StartOverButton onReset={reset} />
        </div>
      )}
    </div>
  );
}
