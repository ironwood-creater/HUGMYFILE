// Helper used inside Web Workers: routes requests to handlers and reports
// progress, results and errors back to the page.
import { serializeError } from './errors';

export interface HandlerContext {
  progress(value: number, label?: string): void;
}
export interface HandlerResult<T> {
  result: T;
  transfer?: Transferable[];
}
type Handler = (payload: never, ctx: HandlerContext) => Promise<HandlerResult<unknown>>;

interface WorkerScope {
  postMessage(message: unknown, transfer?: Transferable[]): void;
  onmessage: ((event: MessageEvent) => void) | null;
}

export function expose(handlers: Record<string, Handler>): void {
  const scope = self as unknown as WorkerScope;
  scope.onmessage = async (event: MessageEvent) => {
    const { id, type, payload } = event.data as { id: number; type: string; payload: unknown };
    const handler = handlers[type];
    const ctx: HandlerContext = {
      progress: (value, label) => scope.postMessage({ id, kind: 'progress', value, label }),
    };
    try {
      if (!handler) throw new Error(`Unknown request: ${type}`);
      const { result, transfer } = await handler(payload as never, ctx);
      scope.postMessage({ id, kind: 'done', result }, transfer ?? []);
    } catch (err) {
      scope.postMessage({ id, kind: 'error', error: serializeError(err) });
    }
  };
}
