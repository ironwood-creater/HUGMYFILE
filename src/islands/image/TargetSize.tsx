import { useState } from 'preact/hooks';
import BatchImageTool from './BatchImageTool';
import { Segmented } from '../shared/Controls';
import { ACCEPT_IMAGES, EXT } from '../../lib/image/formats';
import { baseName } from '../../lib/format';

export default function TargetSize({ targetKb }: { targetKb: number }) {
  const [kb, setKb] = useState(String(targetKb));
  const [format, setFormat] = useState<'jpeg' | 'webp'>('jpeg');
  const [keepDims, setKeepDims] = useState(false);
  const target = Number(kb);

  return (
    <BatchImageTool
      multiple
      accept={ACCEPT_IMAGES}
      runLabel={`Compress to ${Number.isFinite(target) && target > 0 ? target : targetKb} KB`}
      zipName={`hugmyfile-under-${target}kb.zip`}
      canRun={() => (!Number.isFinite(target) || target < 2 ? 'Please choose a target of at least 2 KB.' : null)}
      buildJob={() => ({ output: format, quality: 92, targetBytes: Math.floor(target * 1000), keepDimensions: keepDims })}
      outputName={(file, r) => `${baseName(file.name)}-under-${target}kb.${EXT[r.format]}`}
    >
      <div class="grid gap-5 md:grid-cols-2">
        <div>
          <label for="target-kb" class="field-label">Maximum file size (KB)</label>
          <input
            id="target-kb"
            type="number"
            inputMode="numeric"
            min={2}
            step={1}
            class="field max-w-[12rem]"
            value={kb}
            onInput={(e) => setKb(e.currentTarget.value)}
            data-testid="target-kb"
          />
          <p class="mt-1 text-sm text-muted">We aim slightly below the limit, so the file passes whether a form counts 1 KB as 1000 or 1024 bytes.</p>
        </div>
        <Segmented<'jpeg' | 'webp'>
          label="Save as"
          name="target-format"
          value={format}
          onChange={setFormat}
          options={[
            { value: 'jpeg', label: 'JPG (works everywhere)' },
            { value: 'webp', label: 'WebP (smaller)' },
          ]}
        />
      </div>
      <label class="flex items-start gap-3">
        <input type="checkbox" class="mt-1 size-5" checked={keepDims} onChange={(e) => setKeepDims(e.currentTarget.checked)} data-testid="keep-dimensions" />
        <span>
          <span class="font-bold">Keep the exact pixel size</span>
          <span class="block text-sm text-muted">Only lowers quality. Leave this off and we may also shrink the image slightly, which usually looks much better.</span>
        </span>
      </label>
    </BatchImageTool>
  );
}
