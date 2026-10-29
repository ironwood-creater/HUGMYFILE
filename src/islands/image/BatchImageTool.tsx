import type { ComponentChildren } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { ArrowRight, Plus, X } from 'lucide';
import DropZone from '../shared/DropZone';
import Progress from '../shared/Progress';
import Notice from '../shared/Notice';
import Icon, { type IconNode } from '../shared/Icon';
import { DownloadButton, DoneBanner, StartOverButton } from '../shared/Download';
import { useUnsaved } from '../shared/useUnsaved';
import { ImageEngine, type ImageJob, type ProcessedImage } from '../../lib/image/client';
import { EXT, LABEL, isProbablyImage } from '../../lib/image/formats';
import { friendlyError } from '../../lib/errors';
import { formatBytes, sizeChange } from '../../lib/format';
import { makeZip } from '../../lib/zip';

export interface Item {
  id: number;
  file: File;
  status: 'waiting' | 'working' | 'done' | 'error' | 'cancelled';
  progress: number;
  label?: string;
  result?: ProcessedImage;
  error?: string;
  url?: string;
}

interface Props {
  multiple: boolean;
  accept: string;
  /** Builds the job for one file from the current settings. */
  buildJob: (file: File) => ImageJob;
  /** Output file name for a result. */
  outputName: (file: File, result: ProcessedImage) => string;
  zipName: string;
  runLabel: string;
  /** Settings shown above the run button. */
  children?: ComponentChildren;
  dropTitle?: string;
  dropHint?: string;
  validate?: (file: File) => string | null;
  /** Extra checks before running; return an error message to block. */
  canRun?: () => string | null;
  /** Called when the selected files change (e.g. to read their dimensions). */
  onFilesChange?: (files: File[]) => void;
}

let nextId = 1;
const LARGE_FILE = 15 * 1024 * 1024;

export default function BatchImageTool(props: Props) {
  const engine = useRef<ImageEngine | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [running, setRunning] = useState(false);
  const [runId, setRunId] = useState(0);
  const [blockMsg, setBlockMsg] = useState<string | null>(null);
  const cancelled = useRef(false);

  const urls = useRef(new Set<string>());
  useEffect(
    () => () => {
      engine.current?.dispose();
      urls.current.forEach((u) => URL.revokeObjectURL(u));
    },
    [],
  );

  const doneItems = items.filter((i) => i.status === 'done');
  const unsaved = useUnsaved(doneItems.length, runId);

  const update = (id: number, patch: Partial<Item>) => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const addFiles = (files: File[]) => {
    const fresh = files.map((file) => ({ id: nextId++, file, status: 'waiting' as const, progress: 0 }));
    const next = props.multiple ? [...items.filter((i) => i.status !== 'done'), ...fresh] : fresh;
    setItems(next);
    props.onFilesChange?.(next.map((i) => i.file));
  };

  const removeItem = (id: number) => {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    props.onFilesChange?.(next.map((i) => i.file));
  };

  const run = async () => {
    const problem = props.canRun?.() ?? null;
    setBlockMsg(problem);
    if (problem) return;
    engine.current ??= new ImageEngine();
    cancelled.current = false;
    setRunning(true);
    setRunId((n) => n + 1);
    const queue = items.map((i) => {
      if (i.url) URL.revokeObjectURL(i.url);
      return { ...i, status: 'waiting' as const, progress: 0, result: undefined, error: undefined, url: undefined };
    });
    setItems(queue);
    for (const item of queue) {
      if (cancelled.current) {
        update(item.id, { status: 'cancelled' });
        continue;
      }
      update(item.id, { status: 'working', progress: 0.02 });
      try {
        const result = await engine.current.process(item.file, props.buildJob(item.file), (value, label) => update(item.id, { progress: value, label }));
        const url = URL.createObjectURL(result.blob);
        urls.current.add(url);
        update(item.id, { status: 'done', progress: 1, result, url });
      } catch (err) {
        const f = friendlyError(err);
        update(item.id, { status: f.code === 'cancelled' ? 'cancelled' : 'error', error: f.text });
        if (f.code === 'cancelled') cancelled.current = true;
      }
    }
    setRunning(false);
  };

  const cancel = () => {
    cancelled.current = true;
    engine.current?.cancel();
  };

  const reset = () => {
    items.forEach((i) => i.url && URL.revokeObjectURL(i.url));
    setItems([]);
    setBlockMsg(null);
    props.onFilesChange?.([]);
  };

  const totals = useMemo(() => {
    const before = doneItems.reduce((s, i) => s + i.file.size, 0);
    const after = doneItems.reduce((s, i) => s + (i.result?.blob.size ?? 0), 0);
    return { before, after };
  }, [items]);

  const working = items.find((i) => i.status === 'working');
  const overall = items.length ? items.reduce((s, i) => s + (i.status === 'done' || i.status === 'error' ? 1 : i.progress), 0) / items.length : 0;
  const hasLarge = items.some((i) => i.file.size > LARGE_FILE);

  if (!items.length) {
    return (
      <div class="card p-4 md:p-6">
        <DropZone
          accept={props.accept}
          multiple={props.multiple}
          onFiles={addFiles}
          title={props.dropTitle}
          hint={props.dropHint}
          validate={props.validate ?? ((f) => (isProbablyImage(f) ? null : 'this doesn’t look like an image.'))}
        />
      </div>
    );
  }

  return (
    <div class="card space-y-5 p-4 md:p-6">
      <ul class="grid gap-3" data-testid="file-list">
        {items.map((item) => (
          <li key={item.id} class="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-bg p-3" data-testid="file-item" data-status={item.status}>
            <div class="checker grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-line">
              {item.url ? <img src={item.url} alt={`Result preview of ${item.file.name}`} class="max-h-16 max-w-16 object-contain" /> : <span class="text-xs font-bold text-ink-500">{item.file.name.split('.').pop()?.toUpperCase()}</span>}
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate font-bold" title={item.file.name}>{item.file.name}</p>
              <p class="flex flex-wrap items-center gap-x-2 text-sm text-muted">
                <span>{formatBytes(item.file.size)}</span>
                {item.result && (
                  <>
                    <Icon icon={ArrowRight as IconNode} size={14} />
                    <span class="font-bold text-fg" data-testid="result-size">{formatBytes(item.result.blob.size)}</span>
                    <span>{LABEL[item.result.format]}</span>
                    <span>{item.result.width}×{item.result.height}</span>
                    {!item.result.keptOriginal && (
                      <span class={item.result.blob.size < item.file.size ? 'font-bold text-sea-700 dark:text-sea-300' : ''}>{sizeChange(item.file.size, item.result.blob.size)}</span>
                    )}
                  </>
                )}
              </p>
              {item.status === 'working' && (
                <div class="mt-2 h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                  <div class="h-full rounded-full bg-coral-500 transition-[width]" style={{ width: `${Math.max(4, item.progress * 100)}%` }} />
                </div>
              )}
              {item.error && <p class="mt-1 text-sm font-semibold text-coral-700 dark:text-coral-300" role="alert" data-testid="item-error">{item.error}</p>}
              {item.result?.notes.map((n) => (
                <p key={n} class="mt-1 text-sm text-muted" data-testid="item-note">{n}</p>
              ))}
            </div>
            <div class="flex shrink-0 items-center gap-2">
              {item.result && (
                <DownloadButton
                  blob={item.result.blob}
                  filename={props.outputName(item.file, item.result)}
                  size="sm"
                  label="Download"
                  testId="download"
                  onSaved={() => unsaved.save([unsaved.ids[doneItems.indexOf(item)] ?? ''])}
                />
              )}
              {!running && item.status !== 'done' && (
                <button type="button" class="btn btn-ghost btn-sm !px-2" aria-label={`Remove ${item.file.name}`} onClick={() => removeItem(item.id)}>
                  <Icon icon={X as IconNode} size={16} />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {hasLarge && !doneItems.length && <Notice kind="info">Very large files may be slow on older phones. Everything still happens on your device.</Notice>}

      {!running && (
        <div class="space-y-5">
          {props.children}
          {blockMsg && <Notice kind="error" testId="settings-error">{blockMsg}</Notice>}
          <div class="flex flex-wrap items-center gap-3">
            <button type="button" class="btn btn-primary" onClick={run} data-testid="run">
              {doneItems.length ? 'Apply again' : props.runLabel}
            </button>
            {props.multiple && (
              <label class="btn btn-secondary btn-sm cursor-pointer">
                <Icon icon={Plus as IconNode} size={16} /> Add more
                <input
                  type="file"
                  class="sr-only"
                  multiple
                  accept={props.accept}
                  data-testid="add-more"
                  onChange={(e) => {
                    addFiles(Array.from(e.currentTarget.files ?? []));
                    e.currentTarget.value = '';
                  }}
                />
              </label>
            )}
            <StartOverButton onReset={reset} />
          </div>
        </div>
      )}

      {running && (
        <Progress
          value={overall}
          label={working?.label ?? `Working on ${items.length > 1 ? `${items.filter((i) => i.status === 'done').length + 1} of ${items.length}` : 'your image'}…`}
          onCancel={cancel}
        />
      )}

      {!running && doneItems.length > 0 && (
        <DoneBanner allSaved={unsaved.allSaved} title={doneItems.length > 1 ? `All done! ${doneItems.length} files are ready.` : 'All done! Your file is ready.'}>
          {totals.before > 0 && (
            <p class="text-sm">
              {formatBytes(totals.before)} → <strong>{formatBytes(totals.after)}</strong> ({sizeChange(totals.before, totals.after)})
            </p>
          )}
        </DoneBanner>
      )}

      {!running && doneItems.length > 1 && (
        <DownloadButton
          blob={() => makeZip(doneItems.map((i) => ({ name: props.outputName(i.file, i.result!), blob: i.result!.blob })))}
          filename={props.zipName}
          label={`Download all (${doneItems.length}) as ZIP`}
          testId="download-zip"
          onSaved={() => unsaved.save()}
        />
      )}
    </div>
  );
}

export function extFor(result: ProcessedImage): string {
  return EXT[result.format];
}
