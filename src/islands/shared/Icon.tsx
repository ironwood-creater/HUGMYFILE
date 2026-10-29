import type { JSX } from 'preact';

export type IconNode = [string, Record<string, string | number | undefined>][];

interface Props {
  icon: IconNode;
  size?: number;
  class?: string;
  strokeWidth?: number;
}

export default function Icon({ icon, size = 20, class: className = '', strokeWidth = 2 }: Props): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={strokeWidth}
      stroke-linecap="round"
      stroke-linejoin="round"
      class={className}
      aria-hidden="true"
      focusable="false"
    >
      {icon.map(([tag, attrs], i) => {
        const Tag = tag as unknown as 'path';
        return <Tag key={i} {...(attrs as Record<string, string>)} />;
      })}
    </svg>
  );
}
