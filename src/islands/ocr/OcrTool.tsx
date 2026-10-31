import { useRef, useState } from 'preact/hooks';
import { Copy, Check } from 'lucide';
import Icon, { type IconNode } from '../shared/Icon';
import DropZone from '../shared/DropZone';
import Notice from '../shared/Notice';
import Progress from '../shared/Progress';
import { DownloadButton, DoneBanner, StartOverButton } from '../shared/Download';
import { useUnsaved } from '../shared/useUnsaved';
import { PdfStart, Thumb, useSinglePdf } from '../pdf/shared';
import { OCR_LANGUAGES, RTL_LANGUAGES, createOcr, type OcrLanguage, type OcrSession } from '../../lib/ocr/tesseract';
import { loadUprightCanvas } from '../../lib/image/orient';
import { renderPage } from '../../lib/pdf/pdfjs';
import { ACCEPT_HEIC, ACCEPT_IMAGES, isProbablyImage } from '../../lib/image/formats';
import { friendlyError } from '../../lib/errors';
import { baseName } from '../../lib/format';

interface Result {
  title: string;
  text: string;
  source: 'ocr' | 'text-layer';
}

function CopyButton({ text, testId }: { text: string; testId?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      class="btn btn-secondary btn-sm"
      data-testid={testId}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // Older browsers: select a temporary textarea and copy.
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          (document as unknown as { execCommand(command: string): boolean }).execCommand('copy');
          ta.remove();
        }
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      <Icon icon={(done ? Check : Copy) as IconNode} size={16} /> {done ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function OcrTool({ mode }: { mode: 'image' | 'pdf' }) {
  const pdfState = useSinglePdf();
  const [files, setFiles] = useState<File[]>([]);
  const [langs, setLangs] = useState<OcrLanguage[]>(['eng']);
  const [forceOcr, setForceOcr] = useState(false);
  const [busy, setBusy] = useState<{ value: number | null; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const session = useRef<OcrSession | null>(null);
  const cancelled = useRef(false);
  const unsaved = useUnsaved(results.length ? 1 : 0, results);

  const rtl = langs.some((l) => RTL_LANGUAGES.includes(l));
  const toggleLang = (code: OcrLanguage) => {
    setLangs((prev) => (prev.includes(code) ? (prev.length > 1 ? prev.filter((l) => l !== code) : prev) : [...prev, code]));
  };

  const ocr = async (progressBase: number, progressSpan: number, label: string): Promise<OcrSession> => {
    if (session.current) return session.current;
    session.current = await createOcr(langs, (status, p) => {
      const value = status === 'Reading text…' ? progressBase + p * progressSpan : null;
      setBusy({ value, label: status === 'Reading text…' ? label : status });
    });
    return session.current;
  };

  const stop = async () => {
    const s = session.current;
    session.current = null;
    await s?.terminate().catch(() => undefined);
  };

  const run = async () => {
    setError(null);
    setResults([]);
    cancelled.current = false;
    const out: Result[] = [];
    const failed: string[] = [];
    try {
      if (mode === 'image') {
        for (let i = 0; i < files.length; i++) {
          if (cancelled.current) break;
          const f = files[i]!;
          const label = files.length > 1 ? `Reading ${f.name} (${i + 1} of ${files.length})…` : 'Reading your image…';
          setBusy({ value: i / files.length, label });
          let canvas: HTMLCanvasElement;
          try {
            canvas = await loadUprightCanvas(f, 4000);
          } catch (err) {
            // An image we can't open is reported, not shown as an empty "result".
            failed.push(`${f.name}: ${friendlyError(err).text}`);
            setError(failed.join(' '));
            continue;
          }
          const s = await ocr(i / files.length, 1 / files.length, label);
          out.push({ title: f.name, text: (await s.recognize(canvas)).trim(), source: 'ocr' });
          setResults([...out]);
        }
      } else {
        const pdf = pdfState.pdf!;
        const count = pdf.info.pages.length;
        for (let i = 0; i < count; i++) {
          if (cancelled.current) break;
          const label = `Reading page ${i + 1} of ${count}…`;
          setBusy({ value: i / count, label });
          const page = await pdf.doc.getPage(i + 1);
          let text = '';
          let source: Result['source'] = 'text-layer';
          if (!forceOcr) {
            const content = await page.getTextContent();
            text = content.items
              .map((it) => ('str' in it ? it.str + (it.hasEOL ? '\n' : ' ') : ''))
              .join('')
              .replace(/[ \t]+\n/g, '\n')
              .trim();
          }
          if (text.replace(/\s/g, '').length < 20) {
            source = 'ocr';
            const canvas = await renderPage(page, 200 / 72);
            const s = await ocr(i / count, 1 / count, label);
            text = (await s.recognize(canvas)).trim();
            canvas.width = 1;
            canvas.height = 1;
          }
          page.cleanup();
          out.push({ title: `Page ${i + 1}`, text, source });
          setResults([...out]);
        }
      }
      if (cancelled.current) setError('Stopped. The text read so far is shown below.');
    } catch (err) {
      setError(cancelled.current ? 'Stopped. The text read so far is shown below.' : friendlyError(err).text);
    } finally {
      await stop();
      setBusy(null);
      setResults([...out]);
    }
  };

  const cancel = () => {
    cancelled.current = true;
    void stop();
  };

  const reset = () => {
    setFiles([]);
    setResults([]);
    setError(null);
    pdfState.reset();
  };

  const combined = results.length === 1 ? results[0]!.text : results.map((r) => `--- ${r.title} ---\n${r.text}`).join('\n\n');
  const txtName = mode === 'pdf' && pdfState.pdf ? `${baseName(pdfState.pdf.file.name)}.txt` : files.length === 1 ? `${baseName(files[0]!.name)}.txt` : 'extracted-text.txt';

  const langPicker = (
    <fieldset>
      <legend class="field-label">Language of the text</legend>
      <div class="flex flex-wrap gap-2">
        {OCR_LANGUAGES.map((l) => {
          const on = langs.includes(l.code);
          return (
            <label key={l.code} class={`cursor-pointer rounded-full border-2 px-3 py-1.5 text-sm font-bold has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-sea-500 ${on ? 'border-primary bg-primary text-on-primary' : 'border-line bg-surface hover:border-coral-300'}`}>
              <input type="checkbox" class="sr-only" checked={on} onChange={() => toggleLang(l.code)} data-testid={`ocr-lang-${l.code}`} />
              {l.label}
            </label>
          );
        })}
      </div>
      <p class="mt-1 text-sm text-muted">Pick every language that appears in your document. Each language’s data is downloaded only when you choose it.</p>
    </fieldset>
  );

  // Start screens.
  if (mode === 'pdf' && !pdfState.pdf) return <PdfStart state={pdfState} hint="Scanned or typed PDFs both work." />;
  if (mode === 'image' && !files.length) {
    return (
      <div class="card p-4 md:p-6">
        <DropZone
          accept={`${ACCEPT_IMAGES},${ACCEPT_HEIC}`}
          multiple
          onFiles={setFiles}
          title="Drop your images here — we’ll take good care of them."
          hint="Photos, screenshots or scans. Clear, straight, well-lit pictures give the best results."
          validate={(f) => (isProbablyImage(f) ? null : 'this doesn’t look like an image.')}
        />
      </div>
    );
  }

  return (
    <div class="card space-y-5 p-4 md:p-6">
      {mode === 'pdf' && pdfState.pdf && (
        <div class="flex flex-wrap items-center gap-4">
          <Thumb doc={pdfState.pdf.doc} page={0} width={64} />
          <p class="font-bold">
            {pdfState.pdf.file.name} · {pdfState.pdf.info.pages.length} page{pdfState.pdf.info.pages.length === 1 ? '' : 's'}
          </p>
        </div>
      )}
      {mode === 'image' && (
        <ul class="flex flex-wrap gap-2" data-testid="file-list">
          {files.map((f) => (
            <li key={f.name + f.size} class="chip border border-line bg-bg">{f.name}</li>
          ))}
        </ul>
      )}

      {!busy && !results.length && (
        <div class="space-y-4">
          {langPicker}
          {mode === 'pdf' && (
            <label class="flex items-start gap-3">
              <input type="checkbox" class="mt-1 size-5" checked={forceOcr} onChange={(e) => setForceOcr(e.currentTarget.checked)} data-testid="force-ocr" />
              <span>
                <span class="font-bold">Always use OCR</span>
                <span class="block text-sm text-muted">By default we use the PDF’s own text when it has some (faster and exact) and run OCR only on scanned pages.</span>
              </span>
            </label>
          )}
          <div class="flex flex-wrap gap-3">
            <button type="button" class="btn btn-primary" onClick={run} data-testid="run">
              Extract text
            </button>
            <StartOverButton onReset={reset} />
          </div>
        </div>
      )}

      {busy && <Progress value={busy.value} label={busy.label} onCancel={cancel} />}
      {error && <Notice kind={results.length ? 'warn' : 'error'} testId="error">{error}</Notice>}

      {!busy && results.length > 0 && (
        <div class="space-y-4">
          <DoneBanner allSaved={unsaved.allSaved} title="All done! Your text is ready." />
          {results.map((r, i) => (
            <div key={r.title + i} class="space-y-2">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="font-bold">
                  {r.title}
                  <span class="ml-2 text-sm font-normal text-muted">{r.source === 'ocr' ? 'read with OCR' : 'text from the PDF'}</span>
                </p>
                <CopyButton text={r.text} />
              </div>
              <textarea
                class="field min-h-40 font-mono text-sm"
                dir={rtl ? 'auto' : undefined}
                value={r.text}
                onInput={(e) => {
                  const text = e.currentTarget.value;
                  setResults((prev) => prev.map((x, j) => (j === i ? { ...x, text } : x)));
                }}
                aria-label={`Extracted text: ${r.title}`}
                data-testid="ocr-result"
              />
              {!r.text && <p class="text-sm text-muted">No text found here. Try a sharper image, or pick the right language.</p>}
            </div>
          ))}
          <div class="flex flex-wrap gap-3">
            <DownloadButton blob={() => Promise.resolve(new Blob([combined], { type: 'text/plain;charset=utf-8' }))} filename={txtName} label="Download .txt" testId="download-txt" onSaved={() => unsaved.save()} />
            {results.length > 1 && <CopyButton text={combined} testId="copy-all" />}
            <StartOverButton onReset={reset} />
          </div>
        </div>
      )}
      <p class="text-xs text-muted">Text recognition is never perfect. Please double-check names, numbers and amounts.</p>
    </div>
  );
}
