import { X } from 'lucide';
import Icon, { type IconNode } from './Icon';

interface Props {
  /** 0..1, or null for "working…" without a known amount */
  value: number | null;
  label: string;
  onCancel?: () => void;
}

export default function Progress({ value, label, onCancel }: Props) {
  const pct = value === null ? null : Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div class="rounded-2xl border border-line bg-surface p-4" data-testid="progress">
      <div class="mb-2 flex items-center justify-between gap-3">
        <p class="font-bold" aria-live="polite">
          {label}
          {pct !== null && <span class="ml-2 text-muted">{pct}%</span>}
        </p>
        {onCancel && (
          <button type="button" class="btn btn-secondary btn-sm" onClick={onCancel} data-testid="cancel">
            <Icon icon={X as IconNode} size={16} /> Cancel
          </button>
        )}
      </div>
      <div
        class="h-3 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct ?? undefined}
      >
        <div
          class={`h-full rounded-full bg-gradient-to-r from-coral-400 to-coral-600 transition-[width] duration-300 ${pct === null ? 'w-1/3 animate-pulse' : ''}`}
          style={pct === null ? undefined : { width: `${Math.max(3, pct)}%` }}
        />
      </div>
    </div>
  );
}
