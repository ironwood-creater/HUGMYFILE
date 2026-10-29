// Page-side wrapper around a Web Worker: request/response with ids, progress
// callbacks, and cancel (which terminates the worker so heavy work stops at once).
import { ToolError, type SerializedError } from './errors';

export type ProgressFn = (value: number, label?: string) => void;

interface Pending {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  onProgress?: ProgressFn;
}

export class WorkerClient {
  private worker: Worker | null = null;
  private seq = 0;
  private pending = new Map<number, Pending>();
  private factory: () => Worker;

  constructor(factory: () => Worker) {
    this.factory = factory;
  }

  private ensure(): Worker {
    if (this.worker) return this.worker;
    const worker = this.factory();
    worker.onmessage = (event: MessageEvent) => {
      const msg = event.data as { id: number; kind: string; value?: number; label?: string; result?: unknown; error?: SerializedError };
      const entry = this.pending.get(msg.id);
      if (!entry) return;
      if (msg.kind === 'progress') {
        entry.onProgress?.(msg.value ?? 0, msg.label);
      } else if (msg.kind === 'done') {
        this.pending.delete(msg.id);
        entry.resolve(msg.result);
      } else if (msg.kind === 'error') {
        this.pending.delete(msg.id);
        const e = msg.error ?? { code: 'unknown', message: 'Unknown error' };
        entry.reject(new ToolError(e.code, e.message, e.detail));
      }
    };
    worker.onerror = (event: ErrorEvent) => {
      event.preventDefault();
      const message = event.message || 'The background worker stopped unexpectedly';
      this.failAll(new ToolError(/memory/i.test(message) ? 'out-of-memory' : 'unknown', message));
      this.worker?.terminate();
      this.worker = null;
    };
    this.worker = worker;
    return worker;
  }

  private failAll(err: unknown) {
    for (const entry of this.pending.values()) entry.reject(err);
    this.pending.clear();
  }

  call<T>(type: string, payload: unknown, options: { transfer?: Transferable[]; onProgress?: ProgressFn } = {}): Promise<T> {
    const worker = this.ensure();
    const id = ++this.seq;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject, onProgress: options.onProgress });
      worker.postMessage({ id, type, payload }, options.transfer ?? []);
    });
  }

  /** Stops all work immediately. The next call starts a fresh worker. */
  cancel(): void {
    this.worker?.terminate();
    this.worker = null;
    this.failAll(new ToolError('cancelled'));
  }

  dispose(): void {
    this.cancel();
  }
}
