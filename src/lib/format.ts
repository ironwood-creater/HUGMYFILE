export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return '–';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb < 10 ? mb.toFixed(2) : mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

/** "-62%" style change label from before → after. */
export function sizeChange(before: number, after: number): string {
  if (before <= 0) return '';
  const pct = Math.round(((after - before) / before) * 100);
  if (pct === 0) return 'same size';
  return pct < 0 ? `${Math.abs(pct)}% smaller` : `${pct}% larger`;
}

export function baseName(name: string): string {
  const clean = name.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'file';
  const dot = clean.lastIndexOf('.');
  return dot > 0 ? clean.slice(0, dot) : clean;
}

export function withExt(name: string, ext: string, suffix = ''): string {
  return `${baseName(name)}${suffix}.${ext}`;
}

/** Makes names unique inside a ZIP: photo.jpg, photo (2).jpg, … */
export function uniqueNames(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const key = name.toLowerCase();
    const n = (seen.get(key) ?? 0) + 1;
    seen.set(key, n);
    if (n === 1) return name;
    const dot = name.lastIndexOf('.');
    return dot > 0 ? `${name.slice(0, dot)} (${n})${name.slice(dot)}` : `${name} (${n})`;
  });
}
