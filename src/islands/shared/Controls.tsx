import type { ComponentChildren } from 'preact';

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string; hint?: string }[];
  onChange: (value: T) => void;
  name: string;
  testId?: string;
}

/** A radio group that looks like a row of pill buttons. */
export function Segmented<T extends string>({ label, value, options, onChange, name, testId }: SegmentedProps<T>) {
  return (
    <fieldset data-testid={testId}>
      <legend class="field-label">{label}</legend>
      <div class="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            class={`cursor-pointer rounded-full border-2 px-4 py-2 text-sm font-bold transition has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-sea-500 ${
              value === o.value ? 'border-primary bg-primary text-on-primary' : 'border-line bg-surface text-fg hover:border-coral-300'
            }`}
            title={o.hint}
          >
            <input type="radio" class="sr-only" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

interface SliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onInput: (value: number) => void;
  format?: (value: number) => string;
  hint?: ComponentChildren;
}

export function Slider({ id, label, value, min, max, step = 1, onInput, format, hint }: SliderProps) {
  return (
    <div>
      <div class="flex items-baseline justify-between gap-3">
        <label for={id} class="field-label">
          {label}
        </label>
        <output for={id} class="text-sm font-bold text-link">
          {format ? format(value) : value}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        class="w-full"
        onInput={(e) => onInput(Number(e.currentTarget.value))}
        data-testid={id}
      />
      {hint && <p class="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  );
}

export function Panel({ children, class: className = '' }: { children: ComponentChildren; class?: string }) {
  return <div class={`card p-4 md:p-6 ${className}`}>{children}</div>;
}
