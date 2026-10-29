import { useEffect, useState } from 'preact/hooks';
import SignatureCreator, { type CreatedSignature } from './SignatureCreator';
import { DownloadButton, DoneBanner, StartOverButton } from '../shared/Download';
import { useUnsaved } from '../shared/useUnsaved';

interface Result {
  sig: CreatedSignature;
  url: string;
}

export default function SignatureMaker() {
  const [result, setResult] = useState<Result | null>(null);
  const [round, setRound] = useState(0);
  const unsaved = useUnsaved(result ? 1 : 0, result);

  useEffect(() => () => {
    if (result) URL.revokeObjectURL(result.url);
  }, [result]);

  const reset = () => {
    setResult(null);
    setRound((r) => r + 1);
  };

  return (
    <div class="card space-y-6 p-4 md:p-6">
      {!result ? (
        <SignatureCreator key={round} submitLabel="Create my signature" withSvg onSubmit={(sig) => setResult({ sig, url: URL.createObjectURL(sig.png) })} />
      ) : (
        <div class="space-y-4">
          <DoneBanner allSaved={unsaved.allSaved} title="All done! Your signature is ready.">
            <p class="text-sm">
              Transparent PNG, {result.sig.canvas.width}×{result.sig.canvas.height} px{result.sig.svg ? ', plus an SVG you can scale to any size.' : '.'}
            </p>
          </DoneBanner>
          <div class="checker inline-block max-w-full rounded-2xl border border-line p-4">
            <img src={result.url} alt="Your signature" class="block max-h-48 max-w-full" data-testid="signature-preview" />
          </div>
          <div class="flex flex-wrap gap-3">
            <DownloadButton blob={result.sig.png} filename="signature.png" label="Download PNG" testId="download-png" onSaved={() => unsaved.save()} />
            {result.sig.svg && (
              <DownloadButton
                blob={new Blob([result.sig.svg], { type: 'image/svg+xml' })}
                filename="signature.svg"
                label="Download SVG"
                variant="secondary"
                testId="download-svg"
                onSaved={() => unsaved.save()}
              />
            )}
            <StartOverButton onReset={reset} />
          </div>
          <p class="text-sm text-muted">
            Want to put it on a document? Use <a href="/sign-pdf">Sign PDF</a> to place it on any page.
          </p>
        </div>
      )}
    </div>
  );
}
