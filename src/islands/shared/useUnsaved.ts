import { useLayoutEffect, useMemo, useState } from 'preact/hooks';
import { clearUnsaved, markSaved, markUnsaved, newResultId } from '../../lib/unsaved';

/**
 * Registers produced results as "not downloaded yet" so the page can warn
 * before it is closed. Returns ids and helpers to mark them as saved.
 */
export function useUnsaved(count: number, key: unknown) {
  const ids = useMemo(() => Array.from({ length: count }, () => newResultId()), [count, key]);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  // A layout effect runs before the browser paints, so the warning is armed before the
  // "Your file will be lost…" notice appears (a normal effect left a short gap after it).
  useLayoutEffect(() => {
    setSaved(new Set());
    for (const id of ids) markUnsaved(id);
    return () => clearUnsaved(ids);
  }, [ids]);

  const save = (which: string[] = ids) => {
    for (const id of which) markSaved(id);
    setSaved((prev) => new Set([...prev, ...which]));
  };
  const allSaved = ids.length > 0 && ids.every((id) => saved.has(id));
  return { ids, saved, save, allSaved };
}
