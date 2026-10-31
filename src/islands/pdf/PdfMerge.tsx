import { useState } from 'preact/hooks';
import { ArrowDown, ArrowUp, GripVertical, Plus, X } from 'lucide';
import Icon, { type IconNode } from '../shared/Icon';
import Notice from '../shared/Notice';
import Progress from '../shared/Progress';
import { ACCEPT_PDF, PdfDrop, PdfResultCard, Thumb, loadPdf, pdfEngine, type LoadedPdf, type PdfResult } from './shared';
import { friendlyError } from '../../lib/errors';
import { formatBytes } from '../../lib/format';

interface Entry {
  id: number;
  file: File;
  pdf?: LoadedPdf;
  error?: string;
}

let nextId = 1;

export default function PdfMerge() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [busy, setBusy] = useState<{ value: number | null; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PdfResult | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);

  const add = async (files: File[]) => {
    setResult(null);
    const fresh = files.map((file) => ({ id: nextId++, file }));
    setEntries((prev) => [...prev, ...fresh]);
    for (const entry of fresh) {
      try {
        const pdf = await loadPdf(entry.file);
        setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, pdf } : e)));
      } catch (err) {
        setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, error: friendlyError(err).text } : e)));
      }
    }
  };

  const move = (id: number, delta: number) => {
    setResult(null);
    setEntries((prev) => {
      const i = prev.findIndex((e) => e.id === id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = prev.slice();
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });
  };

  const dropOn = (targetId: number) => {
    if (dragId === null || dragId === targetId) return;
    setResult(null);
    setEntries((prev) => {
      const from = prev.findIndex((e) => e.id === dragId);
      const to = prev.findIndex((e) => e.id === targetId);
      const next = prev.slice();
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item!);
      return next;
    });
    setDragId(null);
  };

  const remove = (id: number) => {
    setResult(null);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const ready = entries.filter((e) => e.pdf);
  const broken = entries.some((e) => e.error);
  const loading = entries.some((e) => !e.pdf && !e.error);

  const run = async () => {
    setError(null);
    setBusy({ value: 0, label: 'Merging your PDFs…' });
    try {
      const blob = await pdfEngine().merge(
        ready.map((e) => e.pdf!.bytes),
        (value, label) => setBusy({ value, label: label ?? 'Merging…' }),
      );
      setResult({ blob, name: 'merged.pdf' });
    } catch (err) {
      setError(friendlyError(err).text);
    } finally {
      setBusy(null);
    }
  };

  const reset = () => {
    setEntries([]);
    setResult(null);
    setError(null);
  };

  if (!entries.length) {
    return (
      <div class="card p-4 md:p-6">
        <PdfDrop multiple onFiles={add} hint="Add two or more PDFs. You can reorder them next." />
      </div>
    );
  }

  const totalPages = ready.reduce((s, e) => s + e.pdf!.info.pages.length, 0);

  return (
    <div class="card space-y-5 p-4 md:p-6">
      <p class="text-sm text-muted">Drag files to change the order, or use the arrows. The first file goes first.</p>
      <ol class="grid gap-3" data-testid="merge-list">
        {entries.map((e, i) => (
          <li
            key={e.id}
            class={`flex items-center gap-2 rounded-2xl border bg-bg p-3 sm:gap-3 ${dragId === e.id ? 'border-coral-400 opacity-60' : 'border-line'}`}
            draggable
            onDragStart={() => setDragId(e.id)}
            onDragOver={(ev) => ev.preventDefault()}
            onDrop={(ev) => {
              ev.preventDefault();
              dropOn(e.id);
            }}
            onDragEnd={() => setDragId(null)}
            data-testid="merge-item"
          >
            {/* Small phones: no drag handle (touch can't drag) and no number, so the arrows fit. */}
            <span class="hidden cursor-grab text-muted sm:inline" aria-hidden="true"><Icon icon={GripVertical as IconNode} size={18} /></span>
            <span class="hidden w-6 text-center font-extrabold text-muted sm:block">{i + 1}</span>
            {e.pdf ? <Thumb doc={e.pdf.doc} page={0} width={44} /> : <span class="grid h-14 w-11 place-items-center rounded-md border border-line text-xs text-muted">PDF</span>}
            <div class="min-w-0 flex-1">
              <p class="truncate font-bold" title={e.file.name}>{e.file.name}</p>
              <p class="text-sm text-muted">
                {formatBytes(e.file.size)}
                {e.pdf && ` · ${e.pdf.info.pages.length} page${e.pdf.info.pages.length === 1 ? '' : 's'}`}
                {!e.pdf && !e.error && ' · checking…'}
              </p>
              {e.error && <p class="text-sm font-semibold text-coral-700 dark:text-coral-300" role="alert" data-testid="item-error">{e.error}</p>}
            </div>
            <div class="flex shrink-0 gap-1">
              <button type="button" class="btn btn-ghost btn-sm !px-2" onClick={() => move(e.id, -1)} disabled={i === 0} aria-label={`Move ${e.file.name} up`} data-testid="move-up">
                <Icon icon={ArrowUp as IconNode} size={16} />
              </button>
              <button type="button" class="btn btn-ghost btn-sm !px-2" onClick={() => move(e.id, 1)} disabled={i === entries.length - 1} aria-label={`Move ${e.file.name} down`} data-testid="move-down">
                <Icon icon={ArrowDown as IconNode} size={16} />
              </button>
              <button type="button" class="btn btn-ghost btn-sm !px-2" onClick={() => remove(e.id)} aria-label={`Remove ${e.file.name}`}>
                <Icon icon={X as IconNode} size={16} />
              </button>
            </div>
          </li>
        ))}
      </ol>

      {broken && <Notice kind="warn">Remove the files we can’t open to continue.</Notice>}
      {error && <Notice kind="error" testId="error">{error}</Notice>}

      {busy ? (
        <Progress value={busy.value} label={busy.label} />
      ) : result ? (
        <PdfResultCard result={result} onReset={reset}>
          <p class="text-sm text-muted">{totalPages} pages from {ready.length} files.</p>
        </PdfResultCard>
      ) : (
        <div class="flex flex-wrap items-center gap-3">
          <button type="button" class="btn btn-primary" onClick={run} disabled={ready.length < 2 || broken || loading} data-testid="run">
            Merge {ready.length} PDFs
          </button>
          <label class="btn btn-secondary btn-sm cursor-pointer">
            <Icon icon={Plus as IconNode} size={16} /> Add more
            <input type="file" multiple accept={ACCEPT_PDF} class="sr-only" data-testid="add-more" onChange={(ev) => { add(Array.from(ev.currentTarget.files ?? [])); ev.currentTarget.value = ''; }} />
          </label>
          {ready.length < 2 && !loading && <span class="text-sm text-muted">Add at least two PDFs to merge.</span>}
        </div>
      )}
    </div>
  );
}
