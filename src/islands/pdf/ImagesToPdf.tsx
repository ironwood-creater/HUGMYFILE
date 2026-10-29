import { useEffect, useRef, useState } from 'preact/hooks';
import { ArrowDown, ArrowUp, GripVertical, Plus, X } from 'lucide';
import Icon, { type IconNode } from '../shared/Icon';
import DropZone from '../shared/DropZone';
import Notice from '../shared/Notice';
import Progress from '../shared/Progress';
import { Segmented } from '../shared/Controls';
import { PdfResultCard, pdfEngine, type PdfResult } from './shared';
import { ImageEngine } from '../../lib/image/client';
import { ACCEPT_HEIC, ACCEPT_IMAGES, isProbablyImage, sniffImage } from '../../lib/image/formats';
import { readJpegOrientation } from '../../lib/image/exif';
import { friendlyError } from '../../lib/errors';
import { baseName, formatBytes } from '../../lib/format';
import type { ImageInput, ImageToPdfOptions } from '../../lib/pdf/types';

interface Entry {
  id: number;
  file: File;
  url: string;
}
let nextId = 1;

export default function ImagesToPdf() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [size, setSize] = useState<ImageToPdfOptions['size']>('a4');
  const [orientation, setOrientation] = useState<ImageToPdfOptions['orientation']>('auto');
  const [margin, setMargin] = useState('20');
  const [busy, setBusy] = useState<{ value: number | null; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PdfResult | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const engine = useRef<ImageEngine | null>(null);

  useEffect(() => () => engine.current?.dispose(), []);

  const add = (files: File[]) => {
    setResult(null);
    setEntries((prev) => [...prev, ...files.map((file) => ({ id: nextId++, file, url: URL.createObjectURL(file) }))]);
  };
  const remove = (id: number) => {
    setResult(null);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= entries.length) return;
    setResult(null);
    const next = entries.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    setEntries(next);
  };

  /** JPGs and PNGs go in untouched (no quality loss); other formats or rotated photos are converted first. */
  const prepare = async (file: File): Promise<ImageInput> => {
    const head = new Uint8Array(await file.slice(0, 256 * 1024).arrayBuffer());
    const fmt = sniffImage(head);
    if (fmt === 'png') return { bytes: new Uint8Array(await file.arrayBuffer()), kind: 'png' };
    if (fmt === 'jpeg' && readJpegOrientation(head) === 1) return { bytes: new Uint8Array(await file.arrayBuffer()), kind: 'jpg' };
    engine.current ??= new ImageEngine();
    const out = await engine.current.process(file, { output: 'jpeg', quality: 92 });
    return { bytes: new Uint8Array(await out.blob.arrayBuffer()), kind: 'jpg' };
  };

  const run = async () => {
    setError(null);
    setResult(null);
    try {
      const images: ImageInput[] = [];
      for (let i = 0; i < entries.length; i++) {
        setBusy({ value: (i / entries.length) * 0.6, label: `Preparing image ${i + 1} of ${entries.length}…` });
        try {
          images.push(await prepare(entries[i]!.file));
        } catch (err) {
          throw new Error(`${entries[i]!.file.name}: ${friendlyError(err).text}`);
        }
      }
      setBusy({ value: 0.6, label: 'Building your PDF…' });
      const blob = await pdfEngine().imagesToPdf(images, { size, orientation, margin: Number(margin) }, (v) => setBusy({ value: 0.6 + v * 0.4, label: 'Building your PDF…' }));
      setResult({ blob, name: entries.length === 1 ? `${baseName(entries[0]!.file.name)}.pdf` : 'images.pdf' });
    } catch (err) {
      setError(err instanceof Error && !('code' in err) ? err.message : friendlyError(err).text);
    } finally {
      setBusy(null);
    }
  };

  const reset = () => {
    entries.forEach((e) => URL.revokeObjectURL(e.url));
    setEntries([]);
    setResult(null);
    setError(null);
  };

  if (!entries.length) {
    return (
      <div class="card p-4 md:p-6">
        <DropZone
          accept={`${ACCEPT_IMAGES},${ACCEPT_HEIC}`}
          multiple
          onFiles={add}
          title="Drop your images here — we’ll take good care of them."
          hint="JPG and PNG are added without any quality loss. Each image becomes one page."
          validate={(f) => (isProbablyImage(f) ? null : 'this doesn’t look like an image.')}
        />
      </div>
    );
  }

  return (
    <div class="card space-y-5 p-4 md:p-6">
      <ol class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="image-list">
        {entries.map((e, i) => (
          <li
            key={e.id}
            class={`flex items-center gap-3 rounded-2xl border bg-bg p-2 ${dragId === e.id ? 'border-coral-400 opacity-60' : 'border-line'}`}
            draggable
            onDragStart={() => setDragId(e.id)}
            onDragOver={(ev) => ev.preventDefault()}
            onDrop={(ev) => {
              ev.preventDefault();
              const from = entries.findIndex((x) => x.id === dragId);
              if (from >= 0) move(from, i);
              setDragId(null);
            }}
            onDragEnd={() => setDragId(null)}
            data-testid="image-item"
          >
            <span class="cursor-grab text-muted" aria-hidden="true"><Icon icon={GripVertical as IconNode} size={16} /></span>
            <span class="w-5 text-center text-sm font-extrabold text-muted">{i + 1}</span>
            <img src={e.url} alt="" class="size-14 rounded-lg border border-line object-cover" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-bold" title={e.file.name}>{e.file.name}</p>
              <p class="text-xs text-muted">{formatBytes(e.file.size)}</p>
            </div>
            <div class="flex flex-col">
              <button type="button" class="btn btn-ghost btn-sm !min-h-0 !px-1.5 !py-1" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move ${e.file.name} up`}>
                <Icon icon={ArrowUp as IconNode} size={14} />
              </button>
              <button type="button" class="btn btn-ghost btn-sm !min-h-0 !px-1.5 !py-1" onClick={() => move(i, i + 1)} disabled={i === entries.length - 1} aria-label={`Move ${e.file.name} down`}>
                <Icon icon={ArrowDown as IconNode} size={14} />
              </button>
            </div>
            <button type="button" class="btn btn-ghost btn-sm !px-1.5" onClick={() => remove(e.id)} aria-label={`Remove ${e.file.name}`}>
              <Icon icon={X as IconNode} size={16} />
            </button>
          </li>
        ))}
      </ol>

      <div class="grid gap-5 md:grid-cols-3">
        <Segmented<ImageToPdfOptions['size']>
          label="Page size"
          name="page-size"
          value={size}
          onChange={(v) => { setSize(v); setResult(null); }}
          testId="page-size"
          options={[
            { value: 'a4', label: 'A4' },
            { value: 'letter', label: 'Letter' },
            { value: 'fit', label: 'Same as image' },
          ]}
        />
        {size !== 'fit' && (
          <Segmented<ImageToPdfOptions['orientation']>
            label="Orientation"
            name="orientation"
            value={orientation}
            onChange={(v) => { setOrientation(v); setResult(null); }}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'portrait', label: 'Portrait' },
              { value: 'landscape', label: 'Landscape' },
            ]}
          />
        )}
        <Segmented<string>
          label="Margins"
          name="margin"
          value={margin}
          onChange={(v) => { setMargin(v); setResult(null); }}
          options={[
            { value: '0', label: 'None' },
            { value: '20', label: 'Small' },
            { value: '40', label: 'Large' },
          ]}
        />
      </div>

      {error && <Notice kind="error" testId="error">{error}</Notice>}
      {busy ? (
        <Progress value={busy.value} label={busy.label} />
      ) : result ? (
        <PdfResultCard result={result} onReset={reset} />
      ) : (
        <div class="flex flex-wrap items-center gap-3">
          <button type="button" class="btn btn-primary" onClick={run} data-testid="run">
            Create PDF ({entries.length} page{entries.length === 1 ? '' : 's'})
          </button>
          <label class="btn btn-secondary btn-sm cursor-pointer">
            <Icon icon={Plus as IconNode} size={16} /> Add more
            <input type="file" multiple accept={`${ACCEPT_IMAGES},${ACCEPT_HEIC}`} class="sr-only" data-testid="add-more" onChange={(ev) => { add(Array.from(ev.currentTarget.files ?? [])); ev.currentTarget.value = ''; }} />
          </label>
        </div>
      )}
    </div>
  );
}
