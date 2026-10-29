import { useState } from 'preact/hooks';
import BatchImageTool from './BatchImageTool';
import { Segmented, Slider } from '../shared/Controls';
import { ACCEPT_IMAGES, EXT } from '../../lib/image/formats';
import { baseName } from '../../lib/format';
import type { ImageJob } from '../../lib/image/client';
import { readUprightSize } from '../../lib/image/orient';

type Mode = 'pixels' | 'percent' | 'preset';

const PRESETS = [
  { id: 'square', label: 'Square post', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait post (4:5)', w: 1080, h: 1350 },
  { id: 'story', label: 'Story / Reel (9:16)', w: 1080, h: 1920 },
  { id: 'thumb', label: 'Video thumbnail (16:9)', w: 1280, h: 720 },
  { id: 'wide', label: 'Wide post (16:9)', w: 1600, h: 900 },
  { id: 'cover', label: 'Page cover banner', w: 1500, h: 500 },
  { id: 'hd', label: 'Full HD wallpaper', w: 1920, h: 1080 },
  { id: 'avatar', label: 'Profile picture', w: 400, h: 400 },
  { id: 'web', label: 'Website image (1200 wide)', w: 1200, h: 0 },
];

export default function ResizeImage() {
  const [mode, setMode] = useState<Mode>('pixels');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [lock, setLock] = useState(true);
  const [lastEdited, setLastEdited] = useState<'w' | 'h'>('w');
  const [percent, setPercent] = useState(50);
  const [preset, setPreset] = useState(PRESETS[0]!.id);
  const [fit, setFit] = useState<'cover' | 'contain'>('cover');
  const [source, setSource] = useState<{ w: number; h: number } | null>(null);

  const onFiles = async (files: File[]) => {
    const first = files[0];
    const size = first ? await readUprightSize(first) : null;
    setSource(size);
    if (size && !width && !height) {
      setWidth(String(size.w));
      setHeight(String(size.h));
    }
  };

  const ratio = source ? source.w / source.h : null;
  const editWidth = (v: string) => {
    setWidth(v);
    setLastEdited('w');
    if (lock && ratio && Number(v) > 0) setHeight(String(Math.max(1, Math.round(Number(v) / ratio))));
  };
  const editHeight = (v: string) => {
    setHeight(v);
    setLastEdited('h');
    if (lock && ratio && Number(v) > 0) setWidth(String(Math.max(1, Math.round(Number(v) * ratio))));
  };

  const buildJob = (): ImageJob => {
    const base = { output: 'same' as const, quality: 90, pngColors: 0 };
    if (mode === 'percent') return { ...base, scalePercent: percent };
    if (mode === 'preset') {
      const p = PRESETS.find((x) => x.id === preset)!;
      return { ...base, resize: p.h ? { width: p.w, height: p.h, fit } : { width: p.w, fit: 'stretch' } };
    }
    const w = Math.round(Number(width));
    const h = Math.round(Number(height));
    // With the lock on, send only the side the user typed so every image keeps its own shape.
    if (lock) return { ...base, resize: lastEdited === 'w' ? { width: w, fit: 'stretch' } : { height: h, fit: 'stretch' } };
    return { ...base, resize: { width: w, height: h, fit: 'stretch' } };
  };

  const canRun = () => {
    if (mode !== 'pixels') return null;
    const w = Number(width);
    const h = Number(height);
    const needW = !lock || lastEdited === 'w';
    const needH = !lock || lastEdited === 'h';
    if ((needW && !(w >= 1)) || (needH && !(h >= 1))) return 'Please enter a width and height of at least 1 pixel.';
    if ((needW && w > 30000) || (needH && h > 30000)) return 'That is larger than browsers can handle. Please use 30,000 pixels or less.';
    return null;
  };

  return (
    <BatchImageTool
      multiple
      accept={ACCEPT_IMAGES}
      runLabel="Resize"
      zipName="hugmyfile-resized-images.zip"
      onFilesChange={onFiles}
      canRun={canRun}
      buildJob={buildJob}
      outputName={(file, r) => `${baseName(file.name)}-${r.width}x${r.height}.${EXT[r.format]}`}
    >
      <Segmented<Mode>
        label="Resize by"
        name="resize-mode"
        value={mode}
        onChange={setMode}
        testId="resize-mode"
        options={[
          { value: 'pixels', label: 'Pixels' },
          { value: 'percent', label: 'Percentage' },
          { value: 'preset', label: 'Presets' },
        ]}
      />
      {mode === 'pixels' && (
        <div class="space-y-3">
          <div class="flex flex-wrap items-end gap-3">
            <div>
              <label for="rs-width" class="field-label">Width (px)</label>
              <input id="rs-width" type="number" min={1} inputMode="numeric" class="field w-36" value={width} onInput={(e) => editWidth(e.currentTarget.value)} data-testid="width" />
            </div>
            <span class="pb-3 font-bold text-muted" aria-hidden="true">×</span>
            <div>
              <label for="rs-height" class="field-label">Height (px)</label>
              <input id="rs-height" type="number" min={1} inputMode="numeric" class="field w-36" value={height} onInput={(e) => editHeight(e.currentTarget.value)} data-testid="height" />
            </div>
          </div>
          <label class="flex items-center gap-3">
            <input type="checkbox" class="size-5" checked={lock} onChange={(e) => setLock(e.currentTarget.checked)} data-testid="lock-aspect" />
            <span class="font-bold">Keep aspect ratio</span>
          </label>
          {source && <p class="text-sm text-muted">Original size: {source.w}×{source.h} px</p>}
        </div>
      )}
      {mode === 'percent' && <Slider id="percent" label="Scale" value={percent} min={5} max={400} step={5} onInput={setPercent} format={(v) => `${v}%`} hint={source ? `New size: about ${Math.round((source.w * percent) / 100)}×${Math.round((source.h * percent) / 100)} px` : undefined} />}
      {mode === 'preset' && (
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label for="preset" class="field-label">Preset</label>
            <select id="preset" class="field" value={preset} onChange={(e) => setPreset(e.currentTarget.value)}>
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} – {p.h ? `${p.w}×${p.h}` : `${p.w} px wide`}
                </option>
              ))}
            </select>
          </div>
          <Segmented<'cover' | 'contain'>
            label="When the shape differs"
            name="fit"
            value={fit}
            onChange={setFit}
            options={[
              { value: 'cover', label: 'Fill and crop' },
              { value: 'contain', label: 'Fit with white edges' },
            ]}
          />
        </div>
      )}
    </BatchImageTool>
  );
}
