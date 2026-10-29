import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { Check, Download as DownloadIcon, RotateCcw } from 'lucide';
import Icon, { type IconNode } from './Icon';
import { downloadBlob } from '../../lib/download';
import { hasUnsaved } from '../../lib/unsaved';

interface ButtonProps {
  blob: Blob | (() => Promise<Blob>);
  filename: string;
  label?: string;
  onSaved?: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md';
  testId?: string;
  class?: string;
  disabled?: boolean;
}

export function DownloadButton({ blob, filename, label = 'Download', onSaved, variant = 'primary', size = 'md', testId = 'download', class: className = '', disabled = false }: ButtonProps) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      class={`btn ${variant === 'primary' ? 'btn-primary' : 'btn-secondary'} ${size === 'sm' ? 'btn-sm' : ''} ${className}`}
      data-testid={testId}
      disabled={busy || disabled}
      onClick={async () => {
        setBusy(true);
        try {
          const data = typeof blob === 'function' ? await blob() : blob;
          downloadBlob(data, filename);
          setDone(true);
          onSaved?.();
        } finally {
          setBusy(false);
        }
      }}
    >
      <Icon icon={(done ? Check : DownloadIcon) as IconNode} size={size === 'sm' ? 16 : 20} />
      {busy ? 'Preparing…' : label}
    </button>
  );
}

export function StartOverButton({ onReset, class: className = '' }: { onReset: () => void; class?: string }) {
  return (
    <button
      type="button"
      class={`btn btn-ghost ${className}`}
      data-testid="start-over"
      onClick={() => {
        if (hasUnsaved() && !window.confirm('Your file will be lost. Start over without downloading it?')) return;
        onReset();
      }}
    >
      <Icon icon={RotateCcw as IconNode} size={18} /> Start over
    </button>
  );
}

export function DoneBanner({ allSaved, title = 'All done! Your file is ready.', children }: { allSaved: boolean; title?: string; children?: ComponentChildren }) {
  return (
    <div class="rounded-2xl border border-sea-300 bg-sea-50 px-4 py-3 text-sea-900 dark:border-sea-700 dark:bg-[#10302d] dark:text-sea-100" role="status" data-testid="done">
      <p class="font-extrabold">{title}</p>
      {children}
      {!allSaved && <p class="mt-1 text-sm">Your file will be lost if you close this page, so download it first.</p>}
    </div>
  );
}
