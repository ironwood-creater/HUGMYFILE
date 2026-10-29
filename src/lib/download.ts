import { markSaved } from './unsaved';

/** Saves a Blob to the user's device via a temporary link. Nothing leaves the browser. */
export function downloadBlob(blob: Blob, filename: string, unsavedId?: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give slower browsers (notably Safari) time to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  if (unsavedId) markSaved(unsavedId);
}
