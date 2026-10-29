import type { ComponentChildren } from 'preact';
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide';
import Icon, { type IconNode } from './Icon';

type Kind = 'info' | 'success' | 'warn' | 'error';

const styles: Record<Kind, string> = {
  info: 'border-sea-200 bg-sea-50 text-sea-900 dark:border-sea-800 dark:bg-[#10302d] dark:text-sea-100',
  success: 'border-sea-300 bg-sea-50 text-sea-900 dark:border-sea-700 dark:bg-[#10302d] dark:text-sea-100',
  warn: 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-[#33270f] dark:text-amber-100',
  error: 'border-coral-300 bg-coral-50 text-coral-900 dark:border-coral-700 dark:bg-[#3a1d17] dark:text-coral-100',
};
const icons: Record<Kind, IconNode> = {
  info: Info as IconNode,
  success: CircleCheck as IconNode,
  warn: TriangleAlert as IconNode,
  error: CircleAlert as IconNode,
};

interface Props {
  kind?: Kind;
  title?: string;
  children?: ComponentChildren;
  testId?: string;
  class?: string;
}

export default function Notice({ kind = 'info', title, children, testId, class: className = '' }: Props) {
  return (
    <div
      class={`flex gap-3 rounded-2xl border px-4 py-3 text-[0.95rem] leading-relaxed ${styles[kind]} ${className}`}
      role={kind === 'error' ? 'alert' : 'status'}
      data-testid={testId ?? `notice-${kind}`}
    >
      <Icon icon={icons[kind]} size={20} class="mt-0.5 shrink-0" />
      <div class="min-w-0">
        {title && <p class="font-extrabold">{title}</p>}
        {children}
      </div>
    </div>
  );
}
