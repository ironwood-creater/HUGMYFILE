import { useState } from 'preact/hooks';
import BatchImageTool from './BatchImageTool';
import { Segmented, Slider } from '../shared/Controls';
import { ACCEPT_HEIC, EXT, isProbablyImage } from '../../lib/image/formats';
import { baseName } from '../../lib/format';

export default function HeicConvert() {
  const [to, setTo] = useState<'jpeg' | 'png'>('jpeg');
  const [quality, setQuality] = useState(90);
  return (
    <BatchImageTool
      multiple
      accept={`${ACCEPT_HEIC},image/*`}
      runLabel={`Convert to ${to === 'jpeg' ? 'JPG' : 'PNG'}`}
      zipName="hugmyfile-converted-photos.zip"
      dropTitle="Drop your HEIC photos here — we’ll take good care of them."
      dropHint="iPhone photos (.heic or .heif). Your browser opens them itself, so nothing is uploaded."
      validate={(f) => (isProbablyImage(f) ? null : 'this doesn’t look like a photo.')}
      buildJob={() => ({ output: to, quality, pngColors: 0 })}
      outputName={(file) => `${baseName(file.name)}.${EXT[to]}`}
    >
      <div class="grid gap-5 md:grid-cols-2">
        <Segmented<'jpeg' | 'png'>
          label="Convert to"
          name="heic-to"
          value={to}
          onChange={setTo}
          options={[
            { value: 'jpeg', label: 'JPG (smaller)' },
            { value: 'png', label: 'PNG (lossless)' },
          ]}
        />
        {to === 'jpeg' && <Slider id="quality" label="JPG quality" value={quality} min={10} max={100} onInput={setQuality} format={(v) => `${v}%`} />}
      </div>
    </BatchImageTool>
  );
}
