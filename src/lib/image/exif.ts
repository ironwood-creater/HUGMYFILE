// Minimal JPEG parsing: EXIF orientation and the stored pixel size.

/** Returns the EXIF orientation (1–8) of a JPEG, or 1 if there is none. */
export function readJpegOrientation(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return 1;
  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset);
    if ((marker & 0xff00) !== 0xff00) return 1;
    const size = view.getUint16(offset + 2);
    if (marker === 0xffe1 && offset + 10 <= view.byteLength && view.getUint32(offset + 4) === 0x45786966 /* "Exif" */) {
      const tiff = offset + 10;
      if (tiff + 8 > view.byteLength) return 1;
      const little = view.getUint16(tiff) === 0x4949;
      const ifd = tiff + view.getUint32(tiff + 4, little);
      if (ifd + 2 > view.byteLength) return 1;
      const entries = view.getUint16(ifd, little);
      for (let i = 0; i < entries; i++) {
        const entry = ifd + 2 + i * 12;
        if (entry + 12 > view.byteLength) return 1;
        if (view.getUint16(entry, little) === 0x0112) {
          const value = view.getUint16(entry + 8, little);
          return value >= 1 && value <= 8 ? value : 1;
        }
      }
      return 1;
    }
    if (marker === 0xffda) return 1; // start of scan: no more metadata
    offset += 2 + size;
  }
  return 1;
}

/** Orientations 5–8 swap width and height when displayed. */
export function orientationSwapsAxes(orientation: number): boolean {
  return orientation >= 5 && orientation <= 8;
}

/**
 * A 2×1 pixel JPEG tagged with orientation 6. If the browser honours EXIF
 * orientation while decoding, it comes out 1×2.
 */
export const ORIENTATION_PROBE_JPEG =
  '/9j/4QAiRXhpZgAASUkqAAgAAAABABIBAwABAAAABgAAAAAAAAD/4AAQSkZJRgABAQAAAQABAAD/2wCEAAMDAwMDAwQEBAQFBQUFBQcHBgYHBwsICQgJCAsRCwwLCwwLEQ8SDw4PEg8bFRMTFRsfGhkaHyYiIiYwLTA+PlQBAwMDAwMDBAQEBAUFBQUFBwcGBgcHCwgJCAkICxELDAsLDAsRDxIPDg8SDxsVExMVGx8aGRofJiIiJjAtMD4+VP/AABEIAAEAAgMBEQACEQEDEQH/xABaAAEAAAAAAAAAAAAAAAAAAAAIEAAABwEAAAAAAAAAAAAAAAAAAQMEBTV0sgEBAQAAAAAAAAAAAAAAAAAAAwkRAAAHAQEAAAAAAAAAAAAAAAACBQYHN7R1dv/aAAwDAQACEQMRAD8AA8tavtKvRilEXVky/OJeYgKR7DdvfUdBx//Z';

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Canvas transform that turns stored pixels into upright pixels for an EXIF
 * orientation. Apply with ctx.setTransform(...) before drawing the stored image.
 */
export function orientationTransform(orientation: number, width: number, height: number): [number, number, number, number, number, number] {
  // width/height are the *upright* output dimensions.
  switch (orientation) {
    case 2: return [-1, 0, 0, 1, width, 0];
    case 3: return [-1, 0, 0, -1, width, height];
    case 4: return [1, 0, 0, -1, 0, height];
    case 5: return [0, 1, 1, 0, 0, 0];
    case 6: return [0, 1, -1, 0, width, 0];
    case 7: return [0, -1, -1, 0, width, height];
    case 8: return [0, -1, 1, 0, 0, height];
    default: return [1, 0, 0, 1, 0, 0];
  }
}
