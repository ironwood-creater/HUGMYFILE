import { useState } from 'preact/hooks';
import BatchImageTool from './BatchImageTool';
import { Slider } from '../shared/Controls';
import { ACCEPT_IMAGES, EXT, LABEL, type OutputFormat } from '../../lib/image/formats';
import { baseName } from '../../lib/format';

interface Props {
  from: 'jpeg' | 'png' | 'webp';
  to: OutputFormat;
}

const DEFAULT_Q: Record<OutputFormat, number> = { jpeg: 90, webp: 85, avif: 65, png: 100 };

export default function ConvertImage({ from, to }: Props) {
  const [quality, setQuality] = useState(DEFAULT_Q[to]);
  const [background, setBackground] = useState('#ffffff');
  const lossy = to !== 'png';

  return (
    <BatchImageTool
      multiple
      accept={ACCEPT_IMAGES}
      runLabel={`Convert to ${LABEL[to]}`}
      zipName={`hugmyfile-${EXT[to]}-images.zip`}
      dropTitle={`Drop your ${LABEL[from]} images here — we’ll take good care of them.`}
      dropHint={`You can add several at once. Other image types work too.`}
      buildJob={() => ({ output: to, quality, pngColors: 0, background, avifSpeed: 7 })}
      outputName={(file) => `${baseName(file.name)}.${EXT[to]}`}
    >
      <div class="grid gap-5 md:grid-cols-2">
        {lossy ? (
          <Slider
            id="quality"
            label={`${LABEL[to]} quality`}
            value={quality}
            min={10}
            max={100}
            onInput={setQuality}
            format={(v) => `${v}%`}
            hint={to === 'avif' ? 'AVIF looks great even around 60–70%.' : 'Higher keeps more detail; lower makes smaller files.'}
          />
        ) : (
          <p class="text-sm text-muted">PNG is lossless: every pixel is kept exactly, and transparency is preserved.</p>
        )}
        {to === 'jpeg' && (
          <div>
            <label for="bg" class="field-label">Fill transparent areas with</label>
            <div class="flex items-center gap-3">
              <input id="bg" type="color" class="h-11 w-16 cursor-pointer rounded-lg border-2 border-line bg-surface" value={background} onInput={(e) => setBackground(e.currentTarget.value)} />
              <span class="text-sm text-muted">JPG can’t be transparent, so we use this color (white by default).</span>
            </div>
          </div>
        )}
      </div>
      {to === 'avif' && <p class="text-sm text-muted">Creating AVIF files is a lot of work for your device. Large photos can take a little while.</p>}
    </BatchImageTool>
  );
}
