// Text recognition with tesseract.js (Apache-2.0), a classic open-source OCR
// engine. The worker, WebAssembly core and "fast" language models are all
// served from our own site; a language file is only downloaded when chosen.

export const OCR_LANGUAGES = [
  { code: 'eng', label: 'English' },
  { code: 'spa', label: 'Spanish' },
  { code: 'fra', label: 'French' },
  { code: 'deu', label: 'German' },
  { code: 'por', label: 'Portuguese' },
  { code: 'ind', label: 'Indonesian' },
  { code: 'ara', label: 'Arabic' },
  { code: 'hin', label: 'Hindi' },
  { code: 'urd', label: 'Urdu' },
] as const;
export type OcrLanguage = (typeof OCR_LANGUAGES)[number]['code'];

export const RTL_LANGUAGES: OcrLanguage[] = ['ara', 'urd'];

export interface OcrSession {
  recognize(image: HTMLCanvasElement): Promise<string>;
  terminate(): Promise<void>;
}

export type OcrProgress = (status: string, progress: number) => void;

const STATUS_TEXT: Record<string, string> = {
  'loading tesseract core': 'Loading the text recognizer…',
  'initializing tesseract': 'Starting up…',
  'loading language traineddata': 'Loading language data…',
  'initializing api': 'Getting ready…',
  'recognizing text': 'Reading text…',
};

export async function createOcr(langs: OcrLanguage[], onProgress?: OcrProgress): Promise<OcrSession> {
  const { createWorker } = await import('tesseract.js');
  const base = `/vendor/tesseract/${__TESSERACT_VERSION__}`;
  const worker = await createWorker(langs, 1, {
    workerPath: `${base}/worker.min.js`,
    corePath: `${base}/core`,
    langPath: '/vendor/tessdata',
    gzip: true,
    // Nothing is stored in the browser: language data is fetched (and HTTP-cached) as needed.
    cacheMethod: 'none',
    workerBlobURL: false,
    logger: (m: { status: string; progress: number }) => onProgress?.(STATUS_TEXT[m.status] ?? m.status, m.progress),
  });
  return {
    async recognize(image) {
      const { data } = await worker.recognize(image);
      return data.text;
    },
    async terminate() {
      await worker.terminate();
    },
  };
}
