export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'heic' | 'gif' | 'bmp' | 'unknown';
export type OutputFormat = 'jpeg' | 'png' | 'webp' | 'avif';

export const MIME: Record<OutputFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
};
export const EXT: Record<OutputFormat, string> = { jpeg: 'jpg', png: 'png', webp: 'webp', avif: 'avif' };
export const LABEL: Record<ImageFormat, string> = {
  jpeg: 'JPG',
  png: 'PNG',
  webp: 'WebP',
  avif: 'AVIF',
  heic: 'HEIC',
  gif: 'GIF',
  bmp: 'BMP',
  unknown: 'image',
};

/** Detects an image format from the first bytes of a file (not from its name). */
export function sniffImage(bytes: Uint8Array): ImageFormat {
  const b = bytes;
  const ascii = (start: number, end: number) => String.fromCharCode(...b.subarray(start, end));
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  if (b.length >= 8 && b[0] === 0x89 && ascii(1, 4) === 'PNG') return 'png';
  if (b.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp';
  if (b.length >= 6 && (ascii(0, 6) === 'GIF87a' || ascii(0, 6) === 'GIF89a')) return 'gif';
  if (b.length >= 2 && ascii(0, 2) === 'BM') return 'bmp';
  if (b.length >= 12 && ascii(4, 8) === 'ftyp') {
    const brands = ascii(8, Math.min(b.length, 40));
    if (/avif|avis/.test(brands)) return 'avif';
    if (/heic|heix|hevc|hevx|heim|heis|mif1|msf1/.test(brands)) return 'heic';
  }
  return 'unknown';
}

export async function sniffFile(file: Blob): Promise<ImageFormat> {
  return sniffImage(new Uint8Array(await file.slice(0, 64).arrayBuffer()));
}

export function looksLikeHeicName(name: string): boolean {
  return /\.(heic|heif)$/i.test(name);
}

/** Accept attribute for inputs that take any common image. */
export const ACCEPT_IMAGES = 'image/*,.jpg,.jpeg,.png,.webp,.avif,.gif,.bmp';
export const ACCEPT_HEIC = '.heic,.heif,image/heic,image/heif';

export function isProbablyImage(file: File): boolean {
  return file.type.startsWith('image/') || /\.(jpe?g|png|webp|avif|gif|bmp|heic|heif)$/i.test(file.name);
}
