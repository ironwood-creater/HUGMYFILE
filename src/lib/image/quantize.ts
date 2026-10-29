// Lossy PNG compression without any GPL code: a median-cut color quantizer
// (with optional Floyd–Steinberg dithering) and a small indexed-PNG writer.
// Reducing a photo-like PNG to 256 or fewer colors typically cuts its size by
// 50–80% while looking almost the same.
import { zlibSync } from 'fflate';

interface Box {
  colors: number[]; // indices into the histogram arrays
  count: number;
  score: number;
  axis: number;
}

export interface QuantizeResult {
  palette: Uint8Array; // RGBA, 4 bytes per entry
  indices: Uint8Array; // one palette index per pixel
  colors: number;
}

/**
 * Quantizes RGBA pixels to at most `maxColors` colors.
 * Fully transparent pixels share a single transparent palette entry.
 */
export function quantize(data: Uint8ClampedArray | Uint8Array, width: number, height: number, maxColors: number, dither: boolean): QuantizeResult {
  const total = width * height;
  maxColors = Math.max(2, Math.min(256, Math.round(maxColors)));

  // Histogram on a 5-bit-per-channel RGB grid plus 3 bits of alpha (ignoring fully transparent).
  const key = (r: number, g: number, b: number, a: number) => ((r >> 3) << 13) | ((g >> 3) << 8) | ((b >> 3) << 3) | (a >> 5);
  const counts = new Map<number, number>();
  const sums = new Map<number, [number, number, number, number]>();
  let hasTransparent = false;
  const stride = total > 2_000_000 ? Math.ceil(total / 2_000_000) : 1;
  for (let p = 0; p < total; p += stride) {
    const i = p * 4;
    const a = data[i + 3]!;
    if (a === 0) {
      hasTransparent = true;
      continue;
    }
    const k = key(data[i]!, data[i + 1]!, data[i + 2]!, a);
    counts.set(k, (counts.get(k) ?? 0) + 1);
    const s = sums.get(k);
    if (s) {
      s[0] += data[i]!;
      s[1] += data[i + 1]!;
      s[2] += data[i + 2]!;
      s[3] += a;
    } else sums.set(k, [data[i]!, data[i + 1]!, data[i + 2]!, a]);
  }
  if (!hasTransparent) for (let p = 0; p < total; p++) if (data[p * 4 + 3] === 0) { hasTransparent = true; break; }

  const keys = Array.from(counts.keys());
  const n = keys.length;
  const avg = new Float64Array(n * 4);
  const weight = new Float64Array(n);
  keys.forEach((k, idx) => {
    const c = counts.get(k)!;
    const s = sums.get(k)!;
    weight[idx] = c;
    avg[idx * 4] = s[0] / c;
    avg[idx * 4 + 1] = s[1] / c;
    avg[idx * 4 + 2] = s[2] / c;
    avg[idx * 4 + 3] = s[3] / c;
  });

  const target = hasTransparent ? maxColors - 1 : maxColors;
  const describe = (colors: number[]): Box => {
    const min = [255, 255, 255, 255];
    const max = [0, 0, 0, 0];
    let count = 0;
    for (const c of colors) {
      count += weight[c]!;
      for (let ch = 0; ch < 4; ch++) {
        const v = avg[c * 4 + ch]!;
        if (v < min[ch]!) min[ch] = v;
        if (v > max[ch]!) max[ch] = v;
      }
    }
    const ranges = [max[0]! - min[0]!, (max[1]! - min[1]!) * 1.2, max[2]! - min[2]!, (max[3]! - min[3]!) * 1.5];
    let axis = 0;
    for (let ch = 1; ch < 4; ch++) if (ranges[ch]! > ranges[axis]!) axis = ch;
    return { colors, count, axis, score: ranges[axis]! * Math.sqrt(count) };
  };

  const boxes: Box[] = n ? [describe(Array.from({ length: n }, (_, i) => i))] : [];
  while (boxes.length < target) {
    let best = -1;
    for (let i = 0; i < boxes.length; i++) if (boxes[i]!.colors.length > 1 && (best < 0 || boxes[i]!.score > boxes[best]!.score)) best = i;
    if (best < 0) break;
    const box = boxes[best]!;
    const axis = box.axis;
    box.colors.sort((a, b) => avg[a * 4 + axis]! - avg[b * 4 + axis]!);
    let acc = 0;
    let cut = 0;
    const half = box.count / 2;
    for (; cut < box.colors.length - 1; cut++) {
      acc += weight[box.colors[cut]!]!;
      if (acc >= half) break;
    }
    const left = box.colors.slice(0, cut + 1);
    const right = box.colors.slice(cut + 1);
    if (!right.length) break;
    boxes.splice(best, 1, describe(left), describe(right));
  }

  const paletteList: number[][] = [];
  if (hasTransparent) paletteList.push([0, 0, 0, 0]);
  for (const box of boxes) {
    let r = 0, g = 0, b = 0, a = 0, w = 0;
    for (const c of box.colors) {
      const cw = weight[c]!;
      r += avg[c * 4]! * cw;
      g += avg[c * 4 + 1]! * cw;
      b += avg[c * 4 + 2]! * cw;
      a += avg[c * 4 + 3]! * cw;
      w += cw;
    }
    paletteList.push([Math.round(r / w), Math.round(g / w), Math.round(b / w), Math.round(a / w)]);
  }
  if (!paletteList.length) paletteList.push([0, 0, 0, 0]);
  const palette = new Uint8Array(paletteList.length * 4);
  paletteList.forEach((c, i) => palette.set(c, i * 4));

  // Map every pixel to its nearest palette color (cached), optionally with dithering.
  const cache = new Map<number, number>();
  const nearest = (r: number, g: number, b: number, a: number): number => {
    if (a < 8 && hasTransparent) return 0;
    const k = key(r, g, b, a);
    const hit = cache.get(k);
    if (hit !== undefined) return hit;
    let best = 0;
    let bestD = Infinity;
    for (let i = hasTransparent ? 1 : 0; i < paletteList.length; i++) {
      const dr = palette[i * 4]! - r;
      const dg = palette[i * 4 + 1]! - g;
      const db = palette[i * 4 + 2]! - b;
      const da = palette[i * 4 + 3]! - a;
      const d = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11 + da * da;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    cache.set(k, best);
    return best;
  };

  const indices = new Uint8Array(total);
  if (!dither) {
    for (let p = 0; p < total; p++) {
      const i = p * 4;
      indices[p] = nearest(data[i]!, data[i + 1]!, data[i + 2]!, data[i + 3]!);
    }
  } else {
    let errCur = new Float32Array((width + 2) * 3);
    let errNext = new Float32Array((width + 2) * 3);
    for (let y = 0; y < height; y++) {
      errNext.fill(0);
      for (let x = 0; x < width; x++) {
        const p = y * width + x;
        const i = p * 4;
        const e = (x + 1) * 3;
        const a = data[i + 3]!;
        const r = clamp(data[i]! + errCur[e]!);
        const g = clamp(data[i + 1]! + errCur[e + 1]!);
        const b = clamp(data[i + 2]! + errCur[e + 2]!);
        const idx = nearest(r, g, b, a);
        indices[p] = idx;
        if (a < 8) continue;
        const er = r - palette[idx * 4]!;
        const eg = g - palette[idx * 4 + 1]!;
        const eb = b - palette[idx * 4 + 2]!;
        // Floyd–Steinberg weights (scaled down slightly to keep files small).
        const spread = (arr: Float32Array, at: number, f: number) => {
          arr[at] = arr[at]! + er * f;
          arr[at + 1] = arr[at + 1]! + eg * f;
          arr[at + 2] = arr[at + 2]! + eb * f;
        };
        spread(errCur, e + 3, (7 / 16) * 0.85);
        spread(errNext, e - 3, (3 / 16) * 0.85);
        spread(errNext, e, (5 / 16) * 0.85);
        spread(errNext, e + 3, (1 / 16) * 0.85);
      }
      [errCur, errNext] = [errNext, errCur];
    }
  }
  return { palette, indices, colors: paletteList.length };
}

function clamp(v: number) {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

/** Writes an indexed-color PNG (color type 3) with the smallest bit depth that fits. */
export function encodeIndexedPng(q: QuantizeResult, width: number, height: number): Uint8Array {
  const n = q.colors;
  const depth = n <= 2 ? 1 : n <= 4 ? 2 : n <= 16 ? 4 : 8;
  const perByte = 8 / depth;
  const rowBytes = Math.ceil(width / perByte);
  const raw = new Uint8Array((rowBytes + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (rowBytes + 1);
    raw[rowStart] = 0; // filter: none (best for palette images)
    for (let x = 0; x < width; x++) {
      const idx = q.indices[y * width + x]!;
      const byte = rowStart + 1 + Math.floor(x / perByte);
      const shift = 8 - depth * ((x % perByte) + 1);
      raw[byte] = raw[byte]! | (idx << shift);
    }
  }
  const ihdr = new Uint8Array(13);
  const v = new DataView(ihdr.buffer);
  v.setUint32(0, width);
  v.setUint32(4, height);
  ihdr[8] = depth;
  ihdr[9] = 3;
  const plte = new Uint8Array(n * 3);
  let lastAlpha = -1;
  for (let i = 0; i < n; i++) {
    plte[i * 3] = q.palette[i * 4]!;
    plte[i * 3 + 1] = q.palette[i * 4 + 1]!;
    plte[i * 3 + 2] = q.palette[i * 4 + 2]!;
    if (q.palette[i * 4 + 3]! < 255) lastAlpha = i;
  }
  const parts = [
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('PLTE', plte),
  ];
  if (lastAlpha >= 0) {
    const trns = new Uint8Array(lastAlpha + 1);
    for (let i = 0; i <= lastAlpha; i++) trns[i] = q.palette[i * 4 + 3]!;
    parts.push(chunk('tRNS', trns));
  }
  parts.push(chunk('IDAT', zlibSync(raw, { level: 9 })));
  parts.push(chunk('IEND', new Uint8Array(0)));
  const size = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(size);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}
