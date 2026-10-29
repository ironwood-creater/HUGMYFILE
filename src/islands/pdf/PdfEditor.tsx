import '@fontsource/noto-sans/400.css';
import '@fontsource/noto-sans/700.css';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { CalendarDays, ChevronLeft, ChevronRight, Circle, Copy, Eraser, Highlighter, ImagePlus, PenLine, Square, Trash2, Type, Undo2, UserRound } from 'lucide';
import Icon, { type IconNode } from '../shared/Icon';
import Notice from '../shared/Notice';
import Progress from '../shared/Progress';
import { StartOverButton } from '../shared/Download';
import SignatureCreator, { type CreatedSignature } from '../signature/SignatureCreator';
import { PdfResultCard, PdfStart, Thumb, pdfEngine, useSinglePdf, type PdfResult } from './shared';
import { renderPage } from '../../lib/pdf/pdfjs';
import { checkText, TEXT_PROBLEM_MESSAGE } from '../../lib/pdf/text';
import { decodeOnPage } from '../../lib/image/client';
import { friendlyError } from '../../lib/errors';
import { baseName } from '../../lib/format';
import type { OverlayItem } from '../../lib/pdf/types';

type Item = OverlayItem & { id: number; url?: string };
type Mode = 'sign' | 'edit';
const LINE_HEIGHT = 1.25;
let nextId = 1;

function measureText(text: string, size: number, bold: boolean): { w: number; h: number } {
  const ctx = document.createElement('canvas').getContext('2d')!;
  ctx.font = `${bold ? 700 : 400} ${size}px "Noto Sans", sans-serif`;
  const lines = text.split('\n');
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width), size * 0.6);
  return { w: Math.ceil(w + 2), h: lines.length * size * LINE_HEIGHT };
}

function todayText(): string {
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
}

export default function PdfEditor({ mode }: { mode: Mode }) {
  const state = useSinglePdf();
  const [pageIndex, setPageIndex] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [history, setHistory] = useState<Item[][]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [showCreator, setShowCreator] = useState(mode === 'sign');
  const [scale, setScale] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PdfResult | null>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ id: number; kind: 'move' | 'resize'; x: number; y: number; orig: Item; before: Item[]; moved: boolean } | null>(null);
  const pdf = state.pdf;
  const page = pdf?.info.pages[pageIndex];

  // Fit the page to the available width.
  useEffect(() => {
    const el = viewRef.current;
    if (!el || !page) return undefined;
    const update = () => setScale(Math.min(el.clientWidth, 900) / page.width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [page?.width, pdf]);

  // Render the visible page.
  useEffect(() => {
    if (!pdf || !page || !canvasRef.current) return undefined;
    let cancelled = false;
    (async () => {
      const p = await pdf.doc.getPage(pageIndex + 1);
      if (cancelled || !canvasRef.current) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      await renderPage(p, scale * dpr, canvasRef.current);
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [pdf, pageIndex, scale]);

  useEffect(() => () => items.forEach((i) => i.url && URL.revokeObjectURL(i.url)), []);

  const textProblem = useMemo(() => {
    for (const it of items) if (it.kind === 'text') {
      const p = checkText(it.text);
      if (p) return p;
    }
    return null;
  }, [items]);

  if (!pdf || !page) return <PdfStart state={state} />;

  const commit = (next: Item[], before: Item[] = items) => {
    setHistory((h) => [...h.slice(-49), before]);
    setItems(next);
    setResult(null);
  };
  const add = (item: Item) => {
    commit([...items, item]);
    setSelected(item.id);
  };
  const update = (id: number, patch: Partial<Item>, record = true) => {
    const next = items.map((it) => (it.id === id ? ({ ...it, ...patch } as Item) : it));
    if (record) commit(next);
    else {
      setItems(next);
      setResult(null);
    }
  };
  const undo = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory(history.slice(0, -1));
    setItems(prev);
    setResult(null);
    if (selected !== null && !prev.some((i) => i.id === selected)) setSelected(null);
  };
  const remove = (id: number) => {
    commit(items.filter((i) => i.id !== id));
    setSelected(null);
  };
  const duplicate = (id: number) => {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    add({ ...it, id: nextId++, x: Math.min(it.x + 12, page.width - it.w), y: Math.min(it.y + 12, page.height - it.h) } as Item);
  };

  const center = (w: number, h: number) => ({ x: Math.max(0, (page.width - w) / 2), y: Math.max(0, (page.height - h) / 2) });

  const addText = async (text = 'Your text', size = 16) => {
    try {
      await document.fonts.load(`400 ${size}px "Noto Sans"`, text);
    } catch {
      /* measuring falls back to another font */
    }
    const m = measureText(text, size, false);
    const pos = center(m.w, m.h);
    add({ id: nextId++, kind: 'text', page: pageIndex, ...pos, w: m.w, h: m.h, text, size, color: '#111111', bold: false, lineHeight: LINE_HEIGHT });
  };
  const addImageBytes = async (png: Blob, natW: number, natH: number, where?: { x: number; y: number }, maxW = page.width * 0.35) => {
    const bytes = new Uint8Array(await png.arrayBuffer());
    const w = Math.min(maxW, natW);
    const h = (w * natH) / natW;
    const pos = where ?? center(w, h);
    add({ id: nextId++, kind: 'image', page: pageIndex, x: Math.min(pos.x, page.width - w), y: Math.min(pos.y, page.height - h), w, h, bytes, format: 'png', url: URL.createObjectURL(png) });
  };
  const addImageFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const px = await decodeOnPage(file, 6_000_000);
      const c = document.createElement('canvas');
      c.width = px.width;
      c.height = px.height;
      c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(px.data), px.width, px.height), 0, 0);
      const png = await new Promise<Blob>((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG failed'))), 'image/png'));
      await addImageBytes(png, px.width, px.height, undefined, Math.min(200, page.width * 0.4));
    } catch (err) {
      setError(friendlyError(err).text);
    }
  };
  const addShape = (kind: 'rect' | 'ellipse' | 'highlight' | 'whiteout') => {
    const size = kind === 'highlight' ? { w: 160, h: 22 } : kind === 'whiteout' ? { w: 150, h: 30 } : { w: 140, h: 90 };
    const pos = center(size.w, size.h);
    const base = { id: nextId++, page: pageIndex, ...pos, ...size };
    if (kind === 'rect' || kind === 'ellipse') add({ ...base, kind, fill: null, stroke: '#c2412d', strokeWidth: 2, opacity: 1 });
    else if (kind === 'highlight') add({ ...base, kind, color: '#ffe14d' });
    else add({ ...base, kind });
  };
  const placeSignature = async (sig: CreatedSignature) => {
    const w = Math.min(180, page.width * 0.35);
    const h = (w * sig.canvas.height) / sig.canvas.width;
    await addImageBytes(sig.png, sig.canvas.width, sig.canvas.height, { x: page.width * 0.55, y: Math.min(page.height * 0.78, page.height - h - 10) }, w);
    setShowCreator(false);
  };

  const onPointerDown = (e: PointerEvent, item: Item, kind: 'move' | 'resize') => {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setSelected(item.id);
    drag.current = { id: item.id, kind, x: e.clientX, y: e.clientY, orig: item, before: items, moved: false };
  };
  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.x) / scale;
    const dy = (e.clientY - d.y) / scale;
    if (Math.abs(dx) + Math.abs(dy) > 0.5) d.moved = true;
    const o = d.orig;
    if (d.kind === 'move') {
      update(o.id, { x: Math.max(0, Math.min(page.width - o.w, o.x + dx)), y: Math.max(0, Math.min(page.height - o.h, o.y + dy)) }, false);
    } else if (o.kind === 'text') {
      const size = Math.max(6, Math.min(144, o.size * ((o.h + dy) / o.h)));
      const m = measureText(o.text, size, o.bold);
      update(o.id, { size, w: m.w, h: m.h } as Partial<Item>, false);
    } else if (o.kind === 'image') {
      const w = Math.max(16, Math.min(page.width - o.x, o.w + dx));
      update(o.id, { w, h: (w * o.h) / o.w }, false);
    } else {
      update(o.id, { w: Math.max(8, Math.min(page.width - o.x, o.w + dx)), h: Math.max(6, Math.min(page.height - o.y, o.h + dy)) }, false);
    }
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.moved) setHistory((h) => [...h.slice(-49), d.before]);
  };
  const onKey = (e: KeyboardEvent, item: Item) => {
    const step = e.shiftKey ? 10 : 1;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      remove(item.id);
      return;
    }
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const mv = moves[e.key];
    if (!mv) return;
    e.preventDefault();
    update(item.id, { x: Math.max(0, Math.min(page.width - item.w, item.x + mv[0])), y: Math.max(0, Math.min(page.height - item.h, item.y + mv[1])) });
  };

  const save = async () => {
    setError(null);
    if (textProblem) return;
    setBusy(true);
    try {
      const overlay: OverlayItem[] = items.map(({ id: _id, url: _url, ...rest }) => rest as OverlayItem);
      const blob = await pdfEngine().overlays(pdf.bytes, overlay);
      setResult({ blob, name: `${baseName(pdf.file.name)}-${mode === 'sign' ? 'signed' : 'edited'}.pdf` });
    } catch (err) {
      setError(friendlyError(err).text);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    state.reset();
    setItems([]);
    setHistory([]);
    setSelected(null);
    setResult(null);
    setPageIndex(0);
    setShowCreator(mode === 'sign');
  };

  const sel = items.find((i) => i.id === selected) ?? null;
  const pageItems = items.filter((i) => i.page === pageIndex);
  const count = pdf.info.pages.length;

  const toolbarBtn = 'btn btn-secondary btn-sm';
  return (
    <div class="card space-y-4 p-3 md:p-6">
      {mode === 'sign' && (
        <Notice kind="info">This adds a visual signature. It is not a certified digital signature.</Notice>
      )}
      {mode === 'sign' && showCreator && (
        <div class="rounded-2xl border border-line p-4">
          <SignatureCreator submitLabel="Place signature on the page" onSubmit={placeSignature} />
        </div>
      )}

      <div class="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Editing tools">
        {mode === 'sign' ? (
          <>
            {!showCreator && (
              <button type="button" class={toolbarBtn} onClick={() => setShowCreator(true)} data-testid="new-signature">
                <Icon icon={PenLine as IconNode} size={16} /> Add signature
              </button>
            )}
            <button type="button" class={toolbarBtn} onClick={() => addText('Your name', 14)} data-testid="add-name">
              <Icon icon={UserRound as IconNode} size={16} /> Add name
            </button>
            <button type="button" class={toolbarBtn} onClick={() => addText(todayText(), 12)} data-testid="add-date">
              <Icon icon={CalendarDays as IconNode} size={16} /> Add date
            </button>
            <button type="button" class={toolbarBtn} onClick={() => addText()} data-testid="add-text">
              <Icon icon={Type as IconNode} size={16} /> Text
            </button>
          </>
        ) : (
          <>
            <button type="button" class={toolbarBtn} onClick={() => addText()} data-testid="add-text">
              <Icon icon={Type as IconNode} size={16} /> Text
            </button>
            <label class={`${toolbarBtn} cursor-pointer`}>
              <Icon icon={ImagePlus as IconNode} size={16} /> Image
              <input type="file" accept="image/*" class="sr-only" onChange={(e) => { addImageFile(e.currentTarget.files?.[0]); e.currentTarget.value = ''; }} data-testid="add-image" />
            </label>
            <button type="button" class={toolbarBtn} onClick={() => addShape('rect')} data-testid="add-rect">
              <Icon icon={Square as IconNode} size={16} /> Box
            </button>
            <button type="button" class={toolbarBtn} onClick={() => addShape('ellipse')} data-testid="add-ellipse">
              <Icon icon={Circle as IconNode} size={16} /> Circle
            </button>
            <button type="button" class={toolbarBtn} onClick={() => addShape('highlight')} data-testid="add-highlight">
              <Icon icon={Highlighter as IconNode} size={16} /> Highlight
            </button>
            <button type="button" class={toolbarBtn} onClick={() => addShape('whiteout')} data-testid="add-whiteout">
              <Icon icon={Eraser as IconNode} size={16} /> Whiteout
            </button>
          </>
        )}
        <button type="button" class="btn btn-ghost btn-sm" onClick={undo} disabled={!history.length} data-testid="undo">
          <Icon icon={Undo2 as IconNode} size={16} /> Undo
        </button>
      </div>

      <div class="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div class="min-w-0">
          <div class="mb-2 flex items-center justify-between gap-2">
            <button type="button" class="btn btn-ghost btn-sm" onClick={() => setPageIndex(Math.max(0, pageIndex - 1))} disabled={pageIndex === 0} aria-label="Previous page">
              <Icon icon={ChevronLeft as IconNode} size={18} />
            </button>
            <p class="text-sm font-bold" aria-live="polite">Page {pageIndex + 1} of {count}</p>
            <button type="button" class="btn btn-ghost btn-sm" onClick={() => setPageIndex(Math.min(count - 1, pageIndex + 1))} disabled={pageIndex === count - 1} aria-label="Next page">
              <Icon icon={ChevronRight as IconNode} size={18} />
            </button>
          </div>
          <div ref={viewRef} class="w-full">
            <div
              class="relative mx-auto select-none overflow-hidden rounded-lg border border-line bg-white shadow-sm"
              style={{ width: `${page.width * scale}px`, height: `${page.height * scale}px` }}
              onPointerDown={() => setSelected(null)}
              data-testid="editor-page"
            >
              <canvas ref={canvasRef} class="absolute inset-0 size-full" aria-label={`Page ${pageIndex + 1}`} role="img" />
              {pageItems.map((it) => {
                const isSel = it.id === selected;
                const style: Record<string, string> = {
                  left: `${it.x * scale}px`,
                  top: `${it.y * scale}px`,
                  width: `${it.w * scale}px`,
                  height: `${it.h * scale}px`,
                };
                let inner = null;
                if (it.kind === 'text') {
                  inner = (
                    <span class="block whitespace-pre" style={{ fontFamily: '"Noto Sans", sans-serif', fontSize: `${it.size * scale}px`, lineHeight: LINE_HEIGHT, color: it.color, fontWeight: it.bold ? 700 : 400 }}>
                      {it.text}
                    </span>
                  );
                } else if (it.kind === 'image') {
                  inner = <img src={it.url} alt="" draggable={false} class="pointer-events-none size-full" />;
                } else if (it.kind === 'rect' || it.kind === 'ellipse') {
                  style.border = it.stroke ? `${Math.max(1, it.strokeWidth * scale)}px solid ${it.stroke}` : 'none';
                  style.background = it.fill ?? 'transparent';
                  style.opacity = String(it.opacity);
                  style.borderRadius = it.kind === 'ellipse' ? '50%' : '0';
                } else if (it.kind === 'highlight') {
                  style.background = it.color;
                  style.opacity = '0.4';
                  style.mixBlendMode = 'multiply';
                } else if (it.kind === 'whiteout') {
                  style.background = '#ffffff';
                }
                return (
                  <div
                    key={it.id}
                    class={`absolute cursor-move touch-none ${isSel ? 'outline outline-2 outline-offset-1 outline-coral-500' : it.kind === 'whiteout' ? 'outline outline-1 outline-dashed outline-ink-300' : 'hover:outline hover:outline-1 hover:outline-coral-300'}`}
                    style={style}
                    tabIndex={0}
                    role="button"
                    aria-label={`${it.kind === 'text' ? `Text: ${it.text}` : it.kind} on page ${pageIndex + 1}. Drag to move, arrow keys to nudge, Delete to remove.`}
                    onPointerDown={(e) => onPointerDown(e as unknown as PointerEvent, it, 'move')}
                    onPointerMove={(e) => onPointerMove(e as unknown as PointerEvent)}
                    onPointerUp={onPointerUp}
                    onKeyDown={(e) => onKey(e as unknown as KeyboardEvent, it)}
                    onFocus={() => setSelected(it.id)}
                    data-testid="overlay-item"
                    data-kind={it.kind}
                  >
                    {inner}
                    {isSel && (
                      <span
                        class="absolute -bottom-2 -right-2 size-4 cursor-nwse-resize rounded-full border-2 border-white bg-coral-500 shadow"
                        onPointerDown={(e) => onPointerDown(e as unknown as PointerEvent, it, 'resize')}
                        onPointerMove={(e) => onPointerMove(e as unknown as PointerEvent)}
                        onPointerUp={onPointerUp}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {count > 1 && (
            <ul class="mt-3 flex gap-2 overflow-x-auto pb-2" aria-label="Pages">
              {pdf.info.pages.map((_, i) => {
                const n = items.filter((it) => it.page === i).length;
                return (
                  <li key={i} class="shrink-0">
                    <button type="button" class={`relative rounded-lg border-2 p-1 ${i === pageIndex ? 'border-primary' : 'border-transparent'}`} onClick={() => { setPageIndex(i); setSelected(null); }} aria-label={`Go to page ${i + 1}`} aria-current={i === pageIndex ? 'page' : undefined} data-testid="page-thumb">
                      <Thumb doc={pdf.doc} page={i} width={56} />
                      <span class="block text-center text-xs font-bold">{i + 1}</span>
                      {n > 0 && <span class="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-coral-600 text-[10px] font-bold text-white">{n}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside class="space-y-3 rounded-2xl border border-line p-3" aria-label="Selected item">
          {!sel && <p class="text-sm text-muted">{mode === 'sign' ? 'Place your signature, then drag it into position. Use the corner dot to resize.' : 'Add an item with the toolbar, then drag it into place. Select an item to change it.'}</p>}
          {sel?.kind === 'text' && (
            <>
              <label class="block">
                <span class="field-label">Text</span>
                <textarea
                  class="field min-h-20"
                  value={sel.text}
                  onInput={(e) => {
                    const text = e.currentTarget.value;
                    const m = measureText(text || ' ', sel.size, sel.bold);
                    update(sel.id, { text, w: m.w, h: m.h } as Partial<Item>, false);
                  }}
                  data-testid="text-input"
                />
              </label>
              <div class="grid grid-cols-2 gap-2">
                <label class="block">
                  <span class="field-label">Size</span>
                  <input type="number" min={6} max={144} class="field" value={Math.round(sel.size)} onInput={(e) => { const size = Math.max(6, Math.min(144, Number(e.currentTarget.value) || 12)); const m = measureText(sel.text, size, sel.bold); update(sel.id, { size, w: m.w, h: m.h } as Partial<Item>); }} data-testid="text-size" />
                </label>
                <label class="block">
                  <span class="field-label">Color</span>
                  <input type="color" class="h-11 w-full cursor-pointer rounded-lg border-2 border-line" value={sel.color} onInput={(e) => update(sel.id, { color: e.currentTarget.value } as Partial<Item>)} />
                </label>
              </div>
              <label class="flex items-center gap-2">
                <input type="checkbox" class="size-5" checked={sel.bold} onChange={(e) => { const bold = e.currentTarget.checked; const m = measureText(sel.text, sel.size, bold); update(sel.id, { bold, w: m.w, h: m.h } as Partial<Item>); }} />
                <span class="font-bold">Bold</span>
              </label>
            </>
          )}
          {(sel?.kind === 'rect' || sel?.kind === 'ellipse') && (
            <>
              <div class="grid grid-cols-2 gap-2">
                <label class="block">
                  <span class="field-label">Line</span>
                  <input type="color" class="h-11 w-full cursor-pointer rounded-lg border-2 border-line" value={sel.stroke ?? '#c2412d'} onInput={(e) => update(sel.id, { stroke: e.currentTarget.value } as Partial<Item>)} />
                </label>
                <label class="block">
                  <span class="field-label">Fill</span>
                  <input type="color" class="h-11 w-full cursor-pointer rounded-lg border-2 border-line" value={sel.fill ?? '#ffffff'} onInput={(e) => update(sel.id, { fill: e.currentTarget.value } as Partial<Item>)} />
                </label>
              </div>
              <label class="flex items-center gap-2">
                <input type="checkbox" class="size-5" checked={sel.fill !== null} onChange={(e) => update(sel.id, { fill: e.currentTarget.checked ? '#ffe9e3' : null } as Partial<Item>)} />
                <span>Filled</span>
              </label>
              <label class="block">
                <span class="field-label">Line width</span>
                <input type="range" min={0.5} max={10} step={0.5} class="w-full" value={sel.strokeWidth} onInput={(e) => update(sel.id, { strokeWidth: Number(e.currentTarget.value) } as Partial<Item>, false)} />
              </label>
            </>
          )}
          {sel?.kind === 'highlight' && (
            <label class="block">
              <span class="field-label">Highlight color</span>
              <input type="color" class="h-11 w-full cursor-pointer rounded-lg border-2 border-line" value={sel.color} onInput={(e) => update(sel.id, { color: e.currentTarget.value } as Partial<Item>)} />
            </label>
          )}
          {sel && (
            <div class="flex flex-wrap gap-2 pt-1">
              <button type="button" class="btn btn-secondary btn-sm" onClick={() => duplicate(sel.id)}>
                <Icon icon={Copy as IconNode} size={16} /> Duplicate
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onClick={() => remove(sel.id)} data-testid="delete-item">
                <Icon icon={Trash2 as IconNode} size={16} /> Delete
              </button>
            </div>
          )}
        </aside>
      </div>

      {textProblem && <Notice kind="error" testId="script-error">{TEXT_PROBLEM_MESSAGE[textProblem]}</Notice>}
      {error && <Notice kind="error" testId="error">{error}</Notice>}
      {busy ? (
        <Progress value={null} label="Saving your PDF…" />
      ) : result ? (
        <PdfResultCard result={result} onReset={reset} />
      ) : (
        <div class="flex flex-wrap gap-3">
          <button type="button" class="btn btn-primary" onClick={save} disabled={!items.length || !!textProblem} data-testid="run">
            {mode === 'sign' ? 'Save signed PDF' : 'Save PDF'}
          </button>
          <StartOverButton onReset={reset} />
        </div>
      )}
    </div>
  );
}
