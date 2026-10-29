import { describe, expect, it } from 'vitest';
import { PNG } from 'pngjs';
import { orientationTransform, readJpegOrientation, orientationSwapsAxes, base64ToBytes, ORIENTATION_PROBE_JPEG } from '../../src/lib/image/exif';
import { sniffImage } from '../../src/lib/image/formats';
import { quantize, encodeIndexedPng } from '../../src/lib/image/quantize';
import { safeSize, SAFE_CANVAS_PIXELS } from '../../src/lib/image/engine';

const apply = (m: number[], x: number, y: number) => [m[0]! * x + m[2]! * y + m[4]!, m[1]! * x + m[3]! * y + m[5]!];

describe('EXIF orientation', () => {
  it('reads orientation from the probe JPEG', () => {
    expect(readJpegOrientation(base64ToBytes(ORIENTATION_PROBE_JPEG))).toBe(6);
  });
  it('returns 1 for JPEGs without EXIF and for non-JPEG data', () => {
    expect(readJpegOrientation(new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0, 2]))).toBe(1);
    expect(readJpegOrientation(new Uint8Array([1, 2, 3, 4]))).toBe(1);
  });
  it('maps stored corners to the right upright corners for every orientation', () => {
    // Stored image 3×2; for orientations 5–8 the upright image is 2×3.
    const sw = 3;
    const sh = 2;
    const expectations: Record<number, [number, number]> = {
      1: [0, 0], // stored top-left stays top-left
      2: [sw, 0],
      3: [sw, sh],
      4: [0, sh],
      5: [0, 0],
      6: [sh, 0],
      7: [sh, sw],
      8: [0, sw],
    };
    for (let o = 1; o <= 8; o++) {
      const W = orientationSwapsAxes(o) ? sh : sw;
      const H = orientationSwapsAxes(o) ? sw : sh;
      expect(apply(orientationTransform(o, W, H), 0, 0), `orientation ${o}`).toEqual(expectations[o]);
    }
  });
});

describe('format sniffing', () => {
  it('detects formats from bytes', () => {
    expect(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpeg');
    expect(sniffImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10]))).toBe('png');
    const heic = new Uint8Array(32);
    heic.set([...'ftypheic'].map((c) => c.charCodeAt(0)), 4);
    expect(sniffImage(heic)).toBe('heic');
    const avif = new Uint8Array(32);
    avif.set([...'ftypavif'].map((c) => c.charCodeAt(0)), 4);
    expect(sniffImage(avif)).toBe('avif');
  });
});

describe('canvas limits', () => {
  it('keeps small images unchanged', () => {
    expect(safeSize(4000, 3000, () => false)).toEqual({ width: 4000, height: 3000, scaled: false });
  });
  it('scales very large images under the iOS limit when the browser refuses the full canvas', () => {
    const out = safeSize(10000, 8000, (w, h) => w * h <= SAFE_CANVAS_PIXELS);
    expect(out.scaled).toBe(true);
    expect(out.width * out.height).toBeLessThanOrEqual(SAFE_CANVAS_PIXELS);
    expect(Math.abs(out.width / out.height - 1.25)).toBeLessThan(0.01);
  });
  it('keeps full size when the browser can handle it', () => {
    expect(safeSize(10000, 8000, () => true).scaled).toBe(false);
  });
});

describe('PNG color reduction', () => {
  it('produces a valid, smaller indexed PNG that keeps transparency', () => {
    const w = 64;
    const h = 64;
    const data = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        data[i] = x * 4;
        data[i + 1] = y * 4;
        data[i + 2] = 128;
        data[i + 3] = x < 16 ? 0 : 255;
      }
    }
    const q = quantize(data, w, h, 32, false);
    expect(q.colors).toBeLessThanOrEqual(32);
    const png = Buffer.from(encodeIndexedPng(q, w, h));
    const decoded = PNG.sync.read(png);
    expect([decoded.width, decoded.height]).toEqual([w, h]);
    expect(decoded.data[3]).toBe(0); // transparent column stays transparent
    expect(decoded.data[(10 * w + 40) * 4 + 3]).toBe(255);
    // Colors stay close to the original.
    const i = (40 * w + 40) * 4;
    expect(Math.abs(decoded.data[i]! - data[i]!)).toBeLessThan(40);
  });
  it('makes photo-like PNGs smaller than lossless PNG', () => {
    const w = 300;
    const h = 200;
    const src = new PNG({ width: w, height: h });
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < w * h; i++) {
      const x = i % w;
      const y = Math.floor(i / w);
      src.data[i * 4] = Math.min(255, x + rand() * 30);
      src.data[i * 4 + 1] = Math.min(255, y + rand() * 30);
      src.data[i * 4 + 2] = Math.min(255, (x + y) / 2 + rand() * 30);
      src.data[i * 4 + 3] = 255;
    }
    const lossless = PNG.sync.write(src);
    const q = quantize(src.data, w, h, 256, true);
    const png = encodeIndexedPng(q, w, h);
    expect(png.length).toBeLessThan(lossless.length);
  });
});
