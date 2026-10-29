import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { RotateCcw, RotateCw, ZoomIn } from 'lucide';
import DropZone from '../shared/DropZone';
import Notice from '../shared/Notice';
import Progress from '../shared/Progress';
import Icon, { type IconNode } from '../shared/Icon';
import { Slider, Segmented } from '../shared/Controls';
import { DownloadButton, DoneBanner, StartOverButton } from '../shared/Download';
import { useUnsaved } from '../shared/useUnsaved';
import { ImageEngine } from '../../lib/image/client';
import { loadUprightCanvas } from '../../lib/image/orient';
import { ACCEPT_HEIC, ACCEPT_IMAGES, isProbablyImage } from '../../lib/image/formats';
import { friendlyError } from '../../lib/errors';
import { baseName, formatBytes } from '../../lib/format';

interface Preset {
  id: string;
  label: string;
  wPx: number;
  hPx: number;
  wMm: number;
  hMm: number;
  maxKb: string;
  headTop: number;
  chin: number;
}

const PRESETS: Preset[] = [
  { id: 'us', label: '2×2 inch (51×51 mm) – 600×600 px', wPx: 600, hPx: 600, wMm: 50.8, hMm: 50.8, maxKb: '240', headTop: 0.13, chin: 0.69 },
  { id: '35x45', label: '35×45 mm – 413×531 px at 300 DPI', wPx: 413, hPx: 531, wMm: 35, hMm: 45, maxKb: '', headTop: 0.09, chin: 0.84 },
  { id: '33x48', label: '33×48 mm – 390×567 px at 300 DPI', wPx: 390, hPx: 567, wMm: 33, hMm: 48, maxKb: '', headTop: 0.1, chin: 0.8 },
  { id: 'custom-px', label: 'Custom size in pixels', wPx: 600, hPx: 800, wMm: 0, hMm: 0, maxKb: '', headTop: 0.1, chin: 0.8 },
  { id: 'custom-mm', label: 'Custom size in mm (choose DPI)', wPx: 0, hPx: 0, wMm: 35, hMm: 45, maxKb: '', headTop: 0.1, chin: 0.8 },
];

interface Adjust {
  zoom: number;
  x: number;
  y: number;
  quarter: number;
  angle: number;
  brightness: number;
  contrast: number;
}
const START: Adjust = { zoom: 1, x: 0, y: 0, quarter: 0, angle: 0, brightness: 0, contrast: 0 };

/** Draws the cropped, rotated photo into a canvas of the output size (white behind it). */
function drawCrop(ctx: CanvasRenderingContext2D, src: HTMLCanvasElement, w: number, h: number, a: Adjust) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  const swapped = a.quarter % 2 === 1;
  const iw = swapped ? src.height : src.width;
  const ih = swapped ? src.width : src.height;
  const base = Math.max(w / iw, h / ih);
  ctx.translate(w / 2 + a.x * w, h / 2 + a.y * h);
  ctx.rotate(((a.quarter * 90 + a.angle) * Math.PI) / 180);
  ctx.scale(base * a.zoom, base * a.zoom);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, -src.width / 2, -src.height / 2);
  ctx.restore();
}

/** Same math as CSS brightness() then contrast(), so the download matches the preview. */
function applyTone(data: Uint8ClampedArray, brightness: number, contrast: number) {
  if (!brightness && !contrast) return;
  const b = 1 + brightness / 100;
  const c = 1 + contrast / 100;
  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) lut[v] = Math.round(((v / 255) * b - 0.5) * c * 255 + 127.5);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = lut[data[i]!]!;
    data[i + 1] = lut[data[i + 1]!]!;
    data[i + 2] = lut[data[i + 2]!]!;
  }
}

export default function PassportPhoto() {
  const engine = useRef<ImageEngine | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [src, setSrc] = useState<HTMLCanvasElement | null>(null);
  const [presetId, setPresetId] = useState('us');
  const [customPx, setCustomPx] = useState({ w: '600', h: '800' });
  const [customMm, setCustomMm] = useState({ w: '35', h: '45', dpi: '300' });
  const [maxKb, setMaxKb] = useState('240');
  const [adj, setAdj] = useState<Adjust>(START);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<{ blob: Blob; url: string; quality: number; w: number; h: number } | null>(null);
  const [paper, setPaper] = useState<'4x6' | 'a4'>('4x6');
  const preview = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; y: number; ax: number; ay: number } | null>(null);
  const unsaved = useUnsaved(photo ? 1 : 0, photo?.url);

  const preset = PRESETS.find((p) => p.id === presetId)!;
  const size = useMemo(() => {
    if (preset.id === 'custom-px') return { w: Math.round(Number(customPx.w)), h: Math.round(Number(customPx.h)), wMm: (Number(customPx.w) / 300) * 25.4, hMm: (Number(customPx.h) / 300) * 25.4 };
    if (preset.id === 'custom-mm') {
      const dpi = Number(customMm.dpi);
      return { w: Math.round((Number(customMm.w) / 25.4) * dpi), h: Math.round((Number(customMm.h) / 25.4) * dpi), wMm: Number(customMm.w), hMm: Number(customMm.h) };
    }
    return { w: preset.wPx, h: preset.hPx, wMm: preset.wMm, hMm: preset.hMm };
  }, [preset, customPx, customMm]);
  const sizeOk = size.w >= 50 && size.h >= 50 && size.w <= 6000 && size.h <= 6000;

  useEffect(() => () => engine.current?.dispose(), []);

  // Live preview.
  useEffect(() => {
    const canvas = preview.current;
    if (!canvas || !src || !sizeOk) return;
    const cssW = Math.min(320, canvas.parentElement?.clientWidth ?? 320);
    const cssH = (cssW * size.h) / size.w;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) drawCrop(ctx, src, canvas.width, canvas.height, adj);
  }, [src, adj, size.w, size.h, sizeOk]);

  const open = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setError(null);
    setPhoto(null);
    setBusy('Opening your photo…');
    try {
      const canvas = await loadUprightCanvas(f, 3000);
      setFile(f);
      setSrc(canvas);
      setAdj(START);
    } catch (err) {
      setError(friendlyError(err).text);
    } finally {
      setBusy(null);
    }
  };

  const choosePreset = (id: string) => {
    setPresetId(id);
    setMaxKb(PRESETS.find((p) => p.id === id)!.maxKb);
    setPhoto(null);
  };

  const set = (patch: Partial<Adjust>) => {
    setAdj((a) => ({ ...a, ...patch }));
    setPhoto(null);
  };

  const create = async () => {
    if (!src || !sizeOk) return;
    const limit = maxKb.trim() ? Number(maxKb) : 0;
    if (maxKb.trim() && !(limit >= 2)) {
      setError('Please enter a maximum size of at least 2 KB, or leave it empty.');
      return;
    }
    setError(null);
    setBusy('Making your photo…');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = size.w;
      canvas.height = size.h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      drawCrop(ctx, src, size.w, size.h, adj);
      const img = ctx.getImageData(0, 0, size.w, size.h);
      applyTone(img.data, adj.brightness, adj.contrast);
      engine.current ??= new ImageEngine();
      const out = await engine.current.encodePixels(
        { data: img.data.buffer as ArrayBuffer, width: size.w, height: size.h },
        'jpeg',
        95,
        limit ? Math.floor(limit * 1000) : undefined,
        (_v, label) => label && setBusy(label),
      );
      setPhoto({ blob: out.blob, url: URL.createObjectURL(out.blob), quality: out.quality, w: size.w, h: size.h });
    } catch (err) {
      setError(friendlyError(err).text);
    } finally {
      setBusy(null);
    }
  };

  const sheet = async (kind: 'jpg' | 'pdf'): Promise<Blob> => {
    if (!photo) throw new Error('No photo');
    const dpi = 300;
    const paperIn = paper === '4x6' ? { w: 4, h: 6 } : { w: 210 / 25.4, h: 297 / 25.4 };
    const W = Math.round(paperIn.w * dpi);
    const H = Math.round(paperIn.h * dpi);
    const pw = Math.round((size.wMm / 25.4) * dpi);
    const ph = Math.round((size.hMm / 25.4) * dpi);
    const margin = Math.round(0.15 * dpi);
    const gap = Math.round(0.08 * dpi);
    const cols = Math.max(1, Math.floor((W - 2 * margin + gap) / (pw + gap)));
    const rows = Math.max(1, Math.floor((H - 2 * margin + gap) / (ph + gap)));
    const gridW = cols * pw + (cols - 1) * gap;
    const gridH = rows * ph + (rows - 1) * gap;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    const img = await createImageBitmap(photo.blob);
    const ox = Math.round((W - gridW) / 2);
    const oy = Math.round((H - gridH) / 2);
    ctx.strokeStyle = '#b0b0b0';
    ctx.lineWidth = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = ox + c * (pw + gap);
        const y = oy + r * (ph + gap);
        ctx.drawImage(img, x, y, pw, ph);
        ctx.strokeRect(x - 0.5, y - 0.5, pw + 1, ph + 1);
      }
    }
    img.close();
    const jpg = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.95));
    if (kind === 'jpg') return jpg;
    const { PDFDocument } = await import('pdf-lib');
    const doc = await PDFDocument.create();
    const page = doc.addPage([paperIn.w * 72, paperIn.h * 72]);
    const embedded = await doc.embedJpg(new Uint8Array(await jpg.arrayBuffer()));
    page.drawImage(embedded, { x: 0, y: 0, width: paperIn.w * 72, height: paperIn.h * 72 });
    const bytes = await doc.save();
    return new Blob([bytes as BlobPart], { type: 'application/pdf' });
  };

  const reset = () => {
    if (photo) URL.revokeObjectURL(photo.url);
    setFile(null);
    setSrc(null);
    setPhoto(null);
    setError(null);
  };

  const guideH = (100 * size.h) / Math.max(1, size.w);
  const headTop = preset.headTop * guideH;
  const chin = preset.chin * guideH;
  const headH = chin - headTop;

  if (!src) {
    return (
      <div class="card space-y-4 p-4 md:p-6">
        <DropZone
          accept={`${ACCEPT_IMAGES},${ACCEPT_HEIC}`}
          onFiles={open}
          title="Drop your photo here — we’ll take good care of it."
          hint="Use a sharp photo taken straight on, against a plain light background."
          validate={(f) => (isProbablyImage(f) ? null : 'this doesn’t look like a photo.')}
        />
        {busy && <Progress value={null} label={busy} />}
        {error && <Notice kind="error" testId="error">{error}</Notice>}
        <Notice kind="info">
          Not affiliated with any government. Always check the official photo requirements for your application. We don’t remove backgrounds,
          so take the photo against a plain, light wall.
        </Notice>
      </div>
    );
  }

  return (
    <div class="card space-y-6 p-4 md:p-6">
      <div class="grid gap-6 md:grid-cols-[auto_1fr]">
        <div class="mx-auto w-full max-w-[320px]">
          <div
            class="relative touch-none select-none overflow-hidden rounded-xl border-2 border-line"
            tabIndex={0}
            role="application"
            aria-label="Photo crop area. Drag to move the photo, or use the arrow keys."
            onPointerDown={(e) => {
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              drag.current = { x: e.clientX, y: e.clientY, ax: adj.x, ay: adj.y };
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              const el = preview.current;
              if (!d || !el) return;
              set({ x: d.ax + (e.clientX - d.x) / el.clientWidth, y: d.ay + (e.clientY - d.y) / el.clientHeight });
            }}
            onPointerUp={() => (drag.current = null)}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 0.05 : 0.01;
              if (e.key === 'ArrowLeft') set({ x: adj.x - step });
              else if (e.key === 'ArrowRight') set({ x: adj.x + step });
              else if (e.key === 'ArrowUp') set({ y: adj.y - step });
              else if (e.key === 'ArrowDown') set({ y: adj.y + step });
              else return;
              e.preventDefault();
            }}
          >
            <canvas
              ref={preview}
              class="block cursor-move"
              style={{ filter: `brightness(${1 + adj.brightness / 100}) contrast(${1 + adj.contrast / 100})` }}
              data-testid="passport-preview"
            />
            <svg class="pointer-events-none absolute inset-0 size-full" viewBox={`0 0 100 ${guideH}`} preserveAspectRatio="none" aria-hidden="true">
              <ellipse cx="50" cy={headTop + headH / 2} rx={headH * 0.37} ry={headH / 2} fill="none" stroke="#ee6a55" stroke-width="0.8" stroke-dasharray="2 1.5" vector-effect="non-scaling-stroke" />
              <line x1="0" x2="100" y1={headTop} y2={headTop} stroke="#1e8c80" stroke-width="1" stroke-dasharray="3 2" vector-effect="non-scaling-stroke" />
              <line x1="0" x2="100" y1={chin} y2={chin} stroke="#1e8c80" stroke-width="1" stroke-dasharray="3 2" vector-effect="non-scaling-stroke" />
              <line x1="50" x2="50" y1="0" y2={guideH} stroke="#ffffff" stroke-opacity="0.6" stroke-width="1" stroke-dasharray="2 3" vector-effect="non-scaling-stroke" />
            </svg>
          </div>
          <p class="mt-2 text-center text-sm text-muted">Drag the photo so the top of the head and the chin sit on the dashed lines.</p>
        </div>

        <div class="space-y-5">
          <div>
            <label for="passport-preset" class="field-label">Photo size</label>
            <select id="passport-preset" class="field" value={presetId} onChange={(e) => choosePreset(e.currentTarget.value)} data-testid="passport-preset">
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          {preset.id === 'custom-px' && (
            <div class="flex flex-wrap gap-3">
              <label class="block">
                <span class="field-label">Width (px)</span>
                <input type="number" class="field w-32" value={customPx.w} onInput={(e) => setCustomPx({ ...customPx, w: e.currentTarget.value })} data-testid="custom-w" />
              </label>
              <label class="block">
                <span class="field-label">Height (px)</span>
                <input type="number" class="field w-32" value={customPx.h} onInput={(e) => setCustomPx({ ...customPx, h: e.currentTarget.value })} data-testid="custom-h" />
              </label>
            </div>
          )}
          {preset.id === 'custom-mm' && (
            <div class="flex flex-wrap gap-3">
              <label class="block">
                <span class="field-label">Width (mm)</span>
                <input type="number" class="field w-28" value={customMm.w} onInput={(e) => setCustomMm({ ...customMm, w: e.currentTarget.value })} />
              </label>
              <label class="block">
                <span class="field-label">Height (mm)</span>
                <input type="number" class="field w-28" value={customMm.h} onInput={(e) => setCustomMm({ ...customMm, h: e.currentTarget.value })} />
              </label>
              <label class="block">
                <span class="field-label">DPI</span>
                <input type="number" class="field w-28" value={customMm.dpi} onInput={(e) => setCustomMm({ ...customMm, dpi: e.currentTarget.value })} />
              </label>
            </div>
          )}
          {!sizeOk && <Notice kind="warn">Please choose a size between 50 and 6000 pixels on each side.</Notice>}
          <p class="text-sm text-muted">Output: {sizeOk ? `${size.w}×${size.h} px` : '–'}</p>
          <div>
            <label for="max-kb" class="field-label">Maximum file size (KB, optional)</label>
            <input id="max-kb" type="number" min={2} class="field w-40" placeholder="No limit" value={maxKb} onInput={(e) => setMaxKb(e.currentTarget.value)} data-testid="max-kb" />
          </div>
          <Slider id="zoom" label="Zoom" value={Math.round(adj.zoom * 100)} min={100} max={400} onInput={(v) => set({ zoom: v / 100 })} format={(v) => `${v}%`} />
          <div class="flex flex-wrap items-end gap-3">
            <div class="min-w-[12rem] flex-1">
              <Slider id="angle" label="Straighten" value={adj.angle} min={-15} max={15} step={0.5} onInput={(v) => set({ angle: v })} format={(v) => `${v}°`} />
            </div>
            <button type="button" class="btn btn-secondary btn-sm" onClick={() => set({ quarter: (adj.quarter + 3) % 4 })} aria-label="Rotate left 90 degrees">
              <Icon icon={RotateCcw as IconNode} size={16} />
            </button>
            <button type="button" class="btn btn-secondary btn-sm" onClick={() => set({ quarter: (adj.quarter + 1) % 4 })} aria-label="Rotate right 90 degrees">
              <Icon icon={RotateCw as IconNode} size={16} />
            </button>
            <button type="button" class="btn btn-ghost btn-sm" onClick={() => set({ zoom: 1, x: 0, y: 0, angle: 0, quarter: 0 })}>
              <Icon icon={ZoomIn as IconNode} size={16} /> Reset framing
            </button>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <Slider id="brightness" label="Brightness" value={adj.brightness} min={-50} max={50} onInput={(v) => set({ brightness: v })} />
            <Slider id="contrast" label="Contrast" value={adj.contrast} min={-50} max={50} onInput={(v) => set({ contrast: v })} />
          </div>
        </div>
      </div>

      {error && <Notice kind="error" testId="error">{error}</Notice>}
      {busy ? (
        <Progress value={null} label={busy} />
      ) : (
        <div class="flex flex-wrap gap-3">
          <button type="button" class="btn btn-primary" onClick={create} disabled={!sizeOk} data-testid="run">
            Create photo
          </button>
          <StartOverButton onReset={reset} />
        </div>
      )}

      {photo && file && (
        <div class="space-y-4">
          <DoneBanner allSaved={unsaved.allSaved}>
            <p class="text-sm">
              {photo.w}×{photo.h} px · {formatBytes(photo.blob.size)} · JPG quality {photo.quality}%
            </p>
          </DoneBanner>
          <div class="flex flex-wrap items-center gap-4">
            <img src={photo.url} alt="Your finished photo" class="h-36 rounded-lg border border-line" />
            <DownloadButton blob={photo.blob} filename={`${baseName(file.name)}-photo-${photo.w}x${photo.h}.jpg`} label="Download photo" onSaved={() => unsaved.save()} />
          </div>
          <div class="rounded-2xl border border-line p-4">
            <p class="font-extrabold">Printable sheet</p>
            <p class="mb-3 text-sm text-muted">Several copies at real size with light cut lines. Print at 100% (“actual size”), not “fit to page”.</p>
            <div class="flex flex-wrap items-end gap-3">
              <Segmented<'4x6' | 'a4'>
                label="Paper"
                name="paper"
                value={paper}
                onChange={setPaper}
                options={[
                  { value: '4x6', label: '4×6 inch photo paper' },
                  { value: 'a4', label: 'A4' },
                ]}
              />
              <DownloadButton blob={() => sheet('jpg')} filename={`photo-sheet-${paper}.jpg`} label="Sheet as JPG" variant="secondary" testId="download-sheet-jpg" />
              <DownloadButton blob={() => sheet('pdf')} filename={`photo-sheet-${paper}.pdf`} label="Sheet as PDF" variant="secondary" testId="download-sheet-pdf" />
            </div>
          </div>
        </div>
      )}

      <Notice kind="info">
        Not affiliated with any government. Always check the official photo requirements; we can’t guarantee that a photo will be accepted.
        Take your photo against a plain, light background; this tool does not remove backgrounds.
      </Notice>
    </div>
  );
}
