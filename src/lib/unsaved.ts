// Tracks results that have been produced but not downloaded yet, so we can warn
// before the user closes the tab. Nothing is stored anywhere: it is all in memory.

export const UNSAVED_MESSAGE = 'Your file will be lost. Download it first?';

const pending = new Set<string>();
let installed = false;
let counter = 0;

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (pending.size === 0) return undefined;
  event.preventDefault();
  // Most browsers show their own wording, but some still display this text.
  (event as unknown as { returnValue: string }).returnValue = UNSAVED_MESSAGE;
  return UNSAVED_MESSAGE;
}

export function newResultId(prefix = 'result'): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

export function markUnsaved(id: string): void {
  pending.add(id);
  if (!installed && typeof window !== 'undefined') {
    window.addEventListener('beforeunload', onBeforeUnload);
    installed = true;
  }
}

export function markSaved(id: string): void {
  pending.delete(id);
}

export function clearUnsaved(ids?: Iterable<string>): void {
  if (!ids) {
    pending.clear();
    return;
  }
  for (const id of ids) pending.delete(id);
}

export function hasUnsaved(): boolean {
  return pending.size > 0;
}
