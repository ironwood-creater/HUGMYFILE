// Page-side API for PDF editing. All pdf-lib work happens in pdfops.worker.ts.
import { WorkerClient, type ProgressFn } from '../workerClient';
import type { DocInfo, FieldValues, FormInfo, ImageInput, ImageToPdfOptions, OverlayItem, PageNumberOptions } from './types';

const pdfBlob = (bytes: Uint8Array) => new Blob([bytes as BlobPart], { type: 'application/pdf' });

export class PdfEngine {
  private client = new WorkerClient(() => new Worker(new URL('./pdfops.worker.ts', import.meta.url), { type: 'module' }));

  // Each call sends a copy, so the original bytes stay usable on the page.
  inspect(bytes: Uint8Array) {
    return this.client.call<DocInfo>('inspect', { bytes: bytes.slice() });
  }
  async merge(files: Uint8Array[], onProgress?: ProgressFn) {
    return pdfBlob(await this.client.call<Uint8Array>('merge', { files: files.map((f) => f.slice()) }, { onProgress }));
  }
  async extract(bytes: Uint8Array, indices: number[]) {
    return pdfBlob(await this.client.call<Uint8Array>('extract', { bytes: bytes.slice(), indices }));
  }
  async split(bytes: Uint8Array, ranges: number[][], onProgress?: ProgressFn) {
    const parts = await this.client.call<Uint8Array[]>('split', { bytes: bytes.slice(), ranges }, { onProgress });
    return parts.map(pdfBlob);
  }
  async organize(bytes: Uint8Array, order: number[]) {
    return pdfBlob(await this.client.call<Uint8Array>('organize', { bytes: bytes.slice(), order }));
  }
  async rotate(bytes: Uint8Array, add: number[]) {
    return pdfBlob(await this.client.call<Uint8Array>('rotate', { bytes: bytes.slice(), add }));
  }
  async numbers(bytes: Uint8Array, options: PageNumberOptions) {
    return pdfBlob(await this.client.call<Uint8Array>('numbers', { bytes: bytes.slice(), options }));
  }
  async imagesToPdf(images: ImageInput[], options: ImageToPdfOptions, onProgress?: ProgressFn) {
    return pdfBlob(await this.client.call<Uint8Array>('imagesToPdf', { images, options }, { onProgress }));
  }
  async imagePagesPdf(pages: { jpg: Uint8Array; width: number; height: number }[]) {
    return pdfBlob(await this.client.call<Uint8Array>('imagePagesPdf', { pages }));
  }
  async compressLight(bytes: Uint8Array) {
    return pdfBlob(await this.client.call<Uint8Array>('compressLight', { bytes: bytes.slice() }));
  }
  async overlays(bytes: Uint8Array, items: OverlayItem[]) {
    return pdfBlob(await this.client.call<Uint8Array>('overlays', { bytes: bytes.slice(), items }));
  }
  readForm(bytes: Uint8Array) {
    return this.client.call<FormInfo>('readForm', { bytes: bytes.slice() });
  }
  async fillForm(bytes: Uint8Array, values: FieldValues, flatten: boolean) {
    return pdfBlob(await this.client.call<Uint8Array>('fillForm', { bytes: bytes.slice(), values, flatten }));
  }
  cancel() {
    this.client.cancel();
  }
  dispose() {
    this.client.dispose();
  }
}
