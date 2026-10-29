import { useState } from 'preact/hooks';
import BatchImageTool from './BatchImageTool';
import { Segmented, Slider } from '../shared/Controls';
import { ACCEPT_IMAGES, EXT } from '../../lib/image/formats';
import { baseName } from '../../lib/format';
import type { OutputFormat } from '../../lib/image/formats';

type Out = OutputFormat | 'same';

export default function CompressImage({ bulk }: { bulk: boolean }) {
  const [quality, setQuality] = useState(75);
  const [output, setOutput] = useState<Out>('same');
  const [pngColors, setPngColors] = useState('256');
  const [files, setFiles] = useState<File[]>([]);
  const anyPng = files.some((f) => f.type === 'image/png' || /\.png$/i.test(f.name));
  const showPng = output === 'png' || (output === 'same' && anyPng);

  return (
    <BatchImageTool
      multiple={bulk}
      accept={ACCEPT_IMAGES}
      runLabel={bulk ? 'Compress all images' : 'Compress image'}
      zipName="hugmyfile-compressed-images.zip"
      dropTitle={bulk ? 'Drop your images here — we’ll take good care of them.' : undefined}
      onFilesChange={setFiles}
      buildJob={() => ({
        output,
        quality,
        pngColors: Number(pngColors),
        keepOriginalIfLarger: true,
      })}
      outputName={(file, r) => `${baseName(file.name)}-compressed.${EXT[r.format]}`}
    >
      <div class="grid gap-5 md:grid-cols-2">
        <Slider
          id="quality"
          label="Quality"
          value={quality}
          min={10}
          max={95}
          onInput={setQuality}
          format={(v) => `${v}%`}
          hint="Lower = smaller file. 70–80% is a sweet spot for photos."
        />
        <Segmented<Out>
          label="Save as"
          name="output"
          value={output}
          onChange={setOutput}
          testId="output-format"
          options={[
            { value: 'same', label: 'Same format' },
            { value: 'jpeg', label: 'JPG' },
            { value: 'webp', label: 'WebP' },
            { value: 'avif', label: 'AVIF' },
            { value: 'png', label: 'PNG' },
          ]}
        />
      </div>
      {showPng && (
        <div>
          <label for="png-colors" class="field-label">PNG colors</label>
          <select id="png-colors" class="field max-w-xs" value={pngColors} onChange={(e) => setPngColors(e.currentTarget.value)}>
            <option value="256">256 colors (recommended)</option>
            <option value="128">128 colors (smaller)</option>
            <option value="64">64 colors (smallest)</option>
            <option value="0">Lossless (largest)</option>
          </select>
          <p class="mt-1 text-sm text-muted">Reducing colors shrinks PNGs a lot and keeps transparency. Quality applies to JPG, WebP and AVIF.</p>
        </div>
      )}
    </BatchImageTool>
  );
}
