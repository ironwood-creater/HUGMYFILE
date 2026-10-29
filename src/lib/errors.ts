export type ToolErrorCode =
  | 'encrypted-pdf'
  | 'damaged-pdf'
  | 'decode-failed'
  | 'heic-unsupported'
  | 'unsupported-type'
  | 'out-of-memory'
  | 'target-impossible'
  | 'unsupported-script'
  | 'no-form-fields'
  | 'xfa-form'
  | 'cancelled'
  | 'unknown';

export class ToolError extends Error {
  code: ToolErrorCode;
  detail?: string;
  constructor(code: ToolErrorCode, message?: string, detail?: string) {
    super(message ?? code);
    this.name = 'ToolError';
    this.code = code;
    this.detail = detail;
  }
}

export interface SerializedError {
  code: ToolErrorCode;
  message: string;
  detail?: string;
}

export function serializeError(err: unknown): SerializedError {
  if (err instanceof ToolError) return { code: err.code, message: err.message, detail: err.detail };
  const message = err instanceof Error ? err.message : String(err);
  if (looksLikeOutOfMemory(err)) return { code: 'out-of-memory', message };
  return { code: 'unknown', message };
}

export function looksLikeOutOfMemory(err: unknown): boolean {
  const message = err instanceof Error ? `${err.name} ${err.message}` : String(err);
  return /out of memory|allocation failed|array buffer allocation|invalid array length|Cannot allocate|RangeError: (Invalid typed array length|Array buffer)|memory access out of bounds|Aborted\(OOM\)/i.test(
    message,
  );
}

/** Friendly, human text for each error code. */
export const ERROR_TEXT: Record<ToolErrorCode, string> = {
  'encrypted-pdf': 'This PDF is protected or damaged, so we can’t open it.',
  'damaged-pdf': 'This PDF is protected or damaged, so we can’t open it.',
  'decode-failed': 'We couldn’t open this image. It may be damaged or in a format your browser can’t read.',
  'heic-unsupported':
    'Your browser can’t open HEIC files. Open this page in Safari (iPhone/Mac), or on iPhone set Camera → Formats → Most Compatible to save photos as JPG.',
  'unsupported-type': 'That file type isn’t supported by this tool.',
  'out-of-memory':
    'Your device ran out of memory while working on this file. Try a smaller file, close other tabs, or use a computer for very large files.',
  'target-impossible': 'We couldn’t get this image under the size you asked for.',
  'unsupported-script':
    'Some characters you typed use a writing system (such as Arabic, Urdu or Hindi) that we can’t place into PDFs correctly yet. Please use Latin, Greek or Cyrillic letters for now.',
  'no-form-fields': 'This PDF has no fillable form fields.',
  'xfa-form': 'This PDF uses an XFA form, a special format that browsers can’t fill in.',
  cancelled: 'Cancelled. Your file is untouched.',
  unknown: 'Something went wrong while working on this file.',
};

export function friendlyError(err: unknown): { code: ToolErrorCode; text: string; detail?: string } {
  if (err instanceof ToolError) return { code: err.code, text: err.detail && err.code === 'target-impossible' ? err.detail : ERROR_TEXT[err.code], detail: err.detail };
  if (err instanceof DOMException && err.name === 'AbortError') return { code: 'cancelled', text: ERROR_TEXT.cancelled };
  if (looksLikeOutOfMemory(err)) return { code: 'out-of-memory', text: ERROR_TEXT['out-of-memory'] };
  return { code: 'unknown', text: ERROR_TEXT.unknown, detail: err instanceof Error ? err.message : String(err) };
}
