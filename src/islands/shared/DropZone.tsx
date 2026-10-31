import { useEffect, useRef, useState } from 'preact/hooks';
import { Upload } from 'lucide';
import Icon, { type IconNode } from './Icon';

interface Props {
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  /** Return an error message for files this tool can't take, or null if fine. */
  validate?: (file: File) => string | null;
  title?: string;
  hint?: string;
  compact?: boolean;
  /** Listen for Ctrl/Cmd+V pastes of files on the page. */
  enablePaste?: boolean;
  testId?: string;
}

export default function DropZone({
  accept,
  multiple = false,
  onFiles,
  validate,
  title = 'Drop your file here — we’ll take good care of it.',
  hint,
  compact = false,
  enablePaste = true,
  testId = 'file-input',
}: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);

  const take = (list: FileList | File[] | null | undefined) => {
    if (!list) return;
    let files = Array.from(list);
    if (!multiple) files = files.slice(0, 1);
    const bad: string[] = [];
    const good = files.filter((f) => {
      const problem = f.size === 0 ? 'This file is empty (0 bytes). Please choose another file.' : (validate?.(f) ?? null);
      if (problem) bad.push(`${f.name}: ${problem}`);
      return !problem;
    });
    setRejected(bad);
    if (good.length) onFiles(good);
  };

  useEffect(() => {
    if (!enablePaste) return undefined;
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length) {
        e.preventDefault();
        take(files);
      }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  });

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label={`${title} Or press Enter to choose ${multiple ? 'files' : 'a file'}.`}
        class={`group flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed text-center transition ${
          compact ? 'gap-2 px-4 py-6' : 'gap-3 px-6 py-12 md:py-16'
        } ${over ? 'border-coral-500 bg-coral-50 dark:bg-[#2a1a16]' : 'border-coral-300 bg-surface-2/60 hover:border-coral-500 hover:bg-surface-2 dark:border-coral-800'}`}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            input.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          take(e.dataTransfer?.files);
        }}
      >
        <span class="grid size-14 place-items-center rounded-2xl bg-primary text-on-primary shadow-[var(--shadow-soft)] transition group-hover:scale-105">
          <Icon icon={Upload as IconNode} size={26} />
        </span>
        <span class={`font-extrabold ${compact ? 'text-base' : 'text-lg md:text-xl'}`}>{title}</span>
        <span class="text-sm text-muted">
          {hint ?? `Click to choose ${multiple ? 'files' : 'a file'}, drag and drop, or paste.`}
        </span>
        <span class="btn btn-primary btn-sm pointer-events-none mt-1">Choose {multiple ? 'files' : 'file'}</span>
      </div>
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple={multiple}
        class="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        data-testid={testId}
        onChange={(e) => {
          const el = e.currentTarget;
          take(el.files);
          el.value = '';
        }}
      />
      {rejected.length > 0 && (
        <ul class="mt-3 space-y-1 text-sm text-coral-700 dark:text-coral-300" role="alert" data-testid="rejected-files">
          {rejected.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
