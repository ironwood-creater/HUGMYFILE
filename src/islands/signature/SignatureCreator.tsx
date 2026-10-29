import '@fontsource/caveat/600.css';
import '@fontsource/dancing-script/600.css';
import '@fontsource/great-vibes/400.css';
import '@fontsource/sacramento/400.css';
import { useEffect, useRef, useState } from 'preact/hooks';
import type SignaturePadType from 'signature_pad';
import { Eraser, ImageUp, Undo2 } from 'lucide';
import Icon, { type IconNode } from '../shared/Icon';
import Notice from '../shared/Notice';
import { Segmented, Slider } from '../shared/Controls';
import { HANDWRITING_FONTS, canvasToPng, contentBounds, removeWhiteBackground, renderTypedSignature, trimCanvas, type HandwritingFont } from '../../lib/signature';
import { decodeOnPage } from '../../lib/image/client';

export interface CreatedSignature {
  canvas: HTMLCanvasElement;
  png: Blob;
  svg?: string;
  source: 'draw' | 'type' | 'upload';
}

type Tab = 'draw' | 'type' | 'upload';

const COLORS = [
  { value: '#111111', label: 'Black' },
  { value: '#1a3a8f', label: 'Blue' },
  { value: '#0f5132', label: 'Green' },
];

interface Props {
  submitLabel: string;
  onSubmit: (sig: CreatedSignature) => void;
  /** Also produce an SVG for drawn signatures. */
  withSvg?: boolean;
}

export default function SignatureCreator({ submitLabel, onSubmit, withSvg = false }: Props) {
  const [tab, setTab] = useState<Tab>('draw');
  const [color, setColor] = useState('#111111');
  const [thickness, setThickness] = useState(3);
  const [strokes, setStrokes] = useState(0);
  const [name, setName] = useState('');
  const [font, setFont] = useState<HandwritingFont>('dancing');
  const [upload, setUpload] = useState<HTMLCanvasElement | null>(null);
  const [whiteToClear, setWhiteToClear] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pad = useRef<SignaturePadType | null>(null);
  const uploadPreview = useRef<HTMLCanvasElement>(null);

  // Set up the drawing pad, sized for sharp lines on high-density screens.
  useEffect(() => {
    if (tab !== 'draw') return undefined;
    let disposed = false;
    let onResize: (() => void) | null = null;
    (async () => {
      const { default: SignaturePad } = await import('signature_pad');
      const canvas = canvasRef.current;
      if (disposed || !canvas) return;
      const fit = () => {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const data = pad.current?.toData() ?? [];
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext('2d')!.scale(ratio, ratio);
        pad.current?.clear();
        if (data.length) pad.current?.fromData(data);
      };
      pad.current = new SignaturePad(canvas, { backgroundColor: 'rgba(0,0,0,0)', penColor: color, minWidth: thickness * 0.45, maxWidth: thickness * 1.4 });
      pad.current.addEventListener('endStroke', () => setStrokes(pad.current?.toData().length ?? 0));
      fit();
      onResize = fit;
      window.addEventListener('resize', fit);
    })();
    return () => {
      disposed = true;
      if (onResize) window.removeEventListener('resize', onResize);
      pad.current?.off();
      pad.current = null;
      setStrokes(0);
    };
  }, [tab]);

  // Pen color and thickness apply to the whole drawing, so it always looks consistent.
  useEffect(() => {
    const p = pad.current;
    if (!p) return;
    p.penColor = color;
    p.minWidth = thickness * 0.45;
    p.maxWidth = thickness * 1.4;
    const data = p.toData();
    if (data.length) p.fromData(data.map((g) => ({ ...g, penColor: color, minWidth: thickness * 0.45, maxWidth: thickness * 1.4 })));
  }, [color, thickness]);

  useEffect(() => {
    const target = uploadPreview.current;
    if (!target || !upload) return;
    target.width = upload.width;
    target.height = upload.height;
    const ctx = target.getContext('2d')!;
    ctx.drawImage(upload, 0, 0);
    if (whiteToClear) removeWhiteBackground(target);
  }, [upload, whiteToClear]);

  const undo = () => {
    const p = pad.current;
    if (!p) return;
    const data = p.toData();
    data.pop();
    p.fromData(data);
    setStrokes(data.length);
  };
  const clear = () => {
    pad.current?.clear();
    setStrokes(0);
  };

  const onUpload = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const px = await decodeOnPage(file, 4_000_000);
      const c = document.createElement('canvas');
      c.width = px.width;
      c.height = px.height;
      c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(px.data), px.width, px.height), 0, 0);
      setUpload(c);
    } catch {
      setError('We couldn’t open that image. Please try a PNG or JPG.');
    }
  };

  const drawnSvg = (trimmedFrom: HTMLCanvasElement): string | undefined => {
    const p = pad.current;
    if (!p || !withSvg) return undefined;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const ctx = trimmedFrom.getContext('2d', { willReadFrequently: true })!;
    const b = contentBounds(ctx.getImageData(0, 0, trimmedFrom.width, trimmedFrom.height).data, trimmedFrom.width, trimmedFrom.height);
    if (!b) return undefined;
    const pad8 = 8;
    const x = b.x / ratio - pad8;
    const y = b.y / ratio - pad8;
    const w = b.w / ratio + pad8 * 2;
    const h = b.h / ratio + pad8 * 2;
    const doc = new DOMParser().parseFromString(p.toSVG({ includeBackgroundColor: false }), 'image/svg+xml');
    const svg = doc.documentElement;
    svg.setAttribute('viewBox', `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
    svg.setAttribute('width', w.toFixed(0));
    svg.setAttribute('height', h.toFixed(0));
    return new XMLSerializer().serializeToString(svg);
  };

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      let trimmed: HTMLCanvasElement | null = null;
      let svg: string | undefined;
      if (tab === 'draw') {
        const canvas = canvasRef.current;
        if (!canvas || !pad.current || pad.current.isEmpty()) throw new Error('Draw your signature in the box first.');
        trimmed = trimCanvas(canvas, 12);
        svg = drawnSvg(canvas);
      } else if (tab === 'type') {
        if (!name.trim()) throw new Error('Type your name first.');
        if (/[^\u0000-ɏḀ-ỿ\s]/.test(name)) throw new Error('Handwriting fonts support Latin letters (including accents). Please use Latin letters for a typed signature, or draw it instead.');
        trimmed = await renderTypedSignature(name.trim(), font, color);
      } else {
        if (!uploadPreview.current || !upload) throw new Error('Choose an image of your signature first.');
        trimmed = trimCanvas(uploadPreview.current, 8);
      }
      if (!trimmed) throw new Error('The signature looks empty. Please try again.');
      onSubmit({ canvas: trimmed, png: await canvasToPng(trimmed), svg, source: tab });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div class="space-y-4" data-testid="signature-creator">
      <Segmented<Tab>
        label="How would you like to sign?"
        name="sig-tab"
        value={tab}
        onChange={setTab}
        testId="sig-tabs"
        options={[
          { value: 'draw', label: 'Draw' },
          { value: 'type', label: 'Type' },
          { value: 'upload', label: 'Upload' },
        ]}
      />

      {(tab === 'draw' || tab === 'type') && (
        <div class="flex flex-wrap items-end gap-4">
          <fieldset>
            <legend class="field-label">Ink color</legend>
            <div class="flex items-center gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  class={`size-9 rounded-full border-4 ${color === c.value ? 'border-coral-400' : 'border-surface'} shadow`}
                  style={{ background: c.value }}
                  onClick={() => setColor(c.value)}
                  aria-label={c.label}
                  aria-pressed={color === c.value}
                />
              ))}
              <input type="color" class="h-9 w-12 cursor-pointer rounded-lg border-2 border-line" value={color} onInput={(e) => setColor(e.currentTarget.value)} aria-label="Custom ink color" />
            </div>
          </fieldset>
          {tab === 'draw' && (
            <div class="min-w-[12rem] flex-1">
              <Slider id="thickness" label="Pen thickness" value={thickness} min={1} max={8} step={0.5} onInput={setThickness} />
            </div>
          )}
        </div>
      )}

      {tab === 'draw' && (
        <div>
          <div class="relative overflow-hidden rounded-2xl border-2 border-dashed border-coral-300 bg-white">
            <canvas ref={canvasRef} class="block h-[220px] w-full touch-none" aria-label="Signature drawing area. Draw with your mouse, finger or pen." data-testid="sig-canvas" />
            <span class="pointer-events-none absolute inset-x-8 bottom-12 border-b border-ink-300" aria-hidden="true" />
            {strokes === 0 && <span class="pointer-events-none absolute inset-0 grid place-items-center text-ink-500">Sign here</span>}
          </div>
          <div class="mt-2 flex flex-wrap gap-2">
            <button type="button" class="btn btn-secondary btn-sm" onClick={undo} disabled={!strokes} data-testid="sig-undo">
              <Icon icon={Undo2 as IconNode} size={16} /> Undo
            </button>
            <button type="button" class="btn btn-secondary btn-sm" onClick={clear} disabled={!strokes} data-testid="sig-clear">
              <Icon icon={Eraser as IconNode} size={16} /> Clear
            </button>
          </div>
        </div>
      )}

      {tab === 'type' && (
        <div class="space-y-4">
          <div>
            <label for="sig-name" class="field-label">Your name</label>
            <input id="sig-name" class="field max-w-md" value={name} onInput={(e) => setName(e.currentTarget.value)} placeholder="Jane Doe" autocomplete="name" data-testid="sig-name" />
          </div>
          <fieldset>
            <legend class="field-label">Style</legend>
            <div class="grid gap-2 sm:grid-cols-2">
              {HANDWRITING_FONTS.map((f) => (
                <label key={f.id} class={`flex cursor-pointer items-center gap-3 rounded-xl border-2 bg-white px-3 py-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-sea-500 ${font === f.id ? 'border-primary' : 'border-line'}`}>
                  <input type="radio" name="sig-font" value={f.id} checked={font === f.id} onChange={() => setFont(f.id)} class="sr-only" />
                  <span class="truncate text-3xl leading-tight" style={{ fontFamily: `"${f.family}", cursive`, fontWeight: f.weight, color }}>
                    {name.trim() || 'Your name'}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      {tab === 'upload' && (
        <div class="space-y-3">
          <label class="btn btn-secondary btn-sm cursor-pointer">
            <Icon icon={ImageUp as IconNode} size={16} /> Choose an image of your signature
            <input type="file" accept="image/*" class="sr-only" onChange={(e) => onUpload(e.currentTarget.files?.[0])} data-testid="sig-upload" />
          </label>
          <label class="flex items-center gap-2">
            <input type="checkbox" class="size-5" checked={whiteToClear} onChange={(e) => setWhiteToClear(e.currentTarget.checked)} />
            <span>Make the white paper background transparent</span>
          </label>
          {upload && (
            <div class="checker inline-block rounded-xl border border-line p-2">
              <canvas ref={uploadPreview} class="block max-h-40 max-w-full" aria-label="Uploaded signature preview" />
            </div>
          )}
          <p class="text-sm text-muted">Tip: sign on white paper with a dark pen and take a sharp, well-lit photo.</p>
        </div>
      )}

      {error && <Notice kind="error" testId="sig-error">{error}</Notice>}
      <p class="text-sm text-muted">Only create and use your own signature. Using someone else’s signature is illegal.</p>
      <button type="button" class="btn btn-primary" onClick={submit} disabled={busy} data-testid="sig-submit">
        {submitLabel}
      </button>
    </div>
  );
}
