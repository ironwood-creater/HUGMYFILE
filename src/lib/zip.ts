import { uniqueNames } from './format';

/** Builds a ZIP in memory. Already-compressed files (images, PDFs) are stored without re-compressing. */
export async function makeZip(files: { name: string; blob: Blob }[]): Promise<Blob> {
  const { zipSync } = await import('fflate');
  const names = uniqueNames(files.map((f) => f.name));
  const entries: Record<string, [Uint8Array, { level: 0 }]> = {};
  for (let i = 0; i < files.length; i++) {
    entries[names[i]!] = [new Uint8Array(await files[i]!.blob.arrayBuffer()), { level: 0 }];
  }
  const zipped = zipSync(entries);
  return new Blob([zipped as BlobPart], { type: 'application/zip' });
}
