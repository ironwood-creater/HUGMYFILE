import { useEffect, useMemo, useState } from 'preact/hooks';
import Notice from '../shared/Notice';
import Progress from '../shared/Progress';
import { StartOverButton } from '../shared/Download';
import { PdfResultCard, PdfStart, Thumb, pdfEngine, useSinglePdf, type PdfResult } from './shared';
import { checkFormText, FORM_TEXT_PROBLEM_MESSAGE } from '../../lib/pdf/text';
import { friendlyError } from '../../lib/errors';
import { baseName } from '../../lib/format';
import type { FieldValues, FormInfo } from '../../lib/pdf/types';

function prettyName(name: string): string {
  const last = name.split('.').pop() ?? name;
  return last.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^\w/, (c) => c.toUpperCase());
}

export default function PdfFillForm() {
  const state = useSinglePdf();
  const [form, setForm] = useState<FormInfo | null>(null);
  const [values, setValues] = useState<FieldValues>({});
  const [flatten, setFlatten] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PdfResult | null>(null);
  const pdf = state.pdf;

  useEffect(() => {
    setForm(null);
    setResult(null);
    if (!pdf) return;
    setBusy('Looking for form fields…');
    pdfEngine()
      .readForm(pdf.bytes)
      .then((info) => {
        setForm(info);
        setValues(Object.fromEntries(info.fields.map((f) => [f.name, f.value])));
      })
      .catch((err) => setError(friendlyError(err).text))
      .finally(() => setBusy(null));
  }, [pdf]);

  const problem = useMemo(() => {
    for (const v of Object.values(values)) {
      if (typeof v === 'string') {
        const p = checkFormText(v);
        if (p) return p;
      }
    }
    return null;
  }, [values]);

  if (!pdf) return <PdfStart state={state} />;

  const set = (name: string, v: string | boolean | string[]) => {
    setValues((prev) => ({ ...prev, [name]: v }));
    setResult(null);
  };

  const run = async () => {
    setError(null);
    if (problem) return;
    setBusy('Filling in your form…');
    try {
      const blob = await pdfEngine().fillForm(pdf.bytes, values, flatten);
      setResult({ blob, name: `${baseName(pdf.file.name)}-filled.pdf` });
    } catch (err) {
      setError(friendlyError(err).text);
    } finally {
      setBusy(null);
    }
  };

  const reset = () => {
    state.reset();
    setForm(null);
    setValues({});
    setResult(null);
  };

  const fields = form?.fields ?? [];
  const editable = fields.filter((f) => f.type !== 'other');

  return (
    <div class="card space-y-5 p-4 md:p-6">
      <div class="flex flex-wrap items-center gap-4">
        <Thumb doc={pdf.doc} page={0} width={70} />
        <p class="font-bold">
          {pdf.file.name} · {pdf.info.pages.length} page{pdf.info.pages.length === 1 ? '' : 's'}
          {form && ` · ${editable.length} field${editable.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {form && form.xfa && !editable.length && (
        <Notice kind="warn" testId="xfa-form">
          This PDF uses an XFA form, a special format that browsers can’t fill in. You can still type on top of it with{' '}
          <a href="/add-text-to-pdf">Add Text to PDF</a>.
        </Notice>
      )}
      {form && !form.xfa && !editable.length && (
        <Notice kind="info" testId="no-fields">
          This PDF has no fillable form fields. No problem: use <a href="/add-text-to-pdf">Add Text to PDF</a> to type anywhere on the page.
        </Notice>
      )}

      {editable.length > 0 && (
        <form class="grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); run(); }} data-testid="form-fields">
          {editable.map((f) => {
            const id = `field-${f.name.replace(/[^a-z0-9]/gi, '-')}`;
            const label = prettyName(f.name);
            if (f.type === 'text') {
              return (
                <label key={f.name} class={`block ${f.multiline ? 'md:col-span-2' : ''}`}>
                  <span class="field-label">{label}</span>
                  {f.multiline ? (
                    <textarea id={id} class="field min-h-24" value={String(values[f.name] ?? '')} maxLength={f.maxLength} disabled={f.readOnly} onInput={(e) => set(f.name, e.currentTarget.value)} data-field={f.name} />
                  ) : (
                    <input id={id} class="field" value={String(values[f.name] ?? '')} maxLength={f.maxLength} disabled={f.readOnly} onInput={(e) => set(f.name, e.currentTarget.value)} data-field={f.name} />
                  )}
                </label>
              );
            }
            if (f.type === 'checkbox') {
              return (
                <label key={f.name} class="flex items-center gap-3 self-end py-2">
                  <input type="checkbox" class="size-5" checked={values[f.name] === true} disabled={f.readOnly} onChange={(e) => set(f.name, e.currentTarget.checked)} data-field={f.name} />
                  <span class="font-bold">{label}</span>
                </label>
              );
            }
            if (f.type === 'radio') {
              return (
                <fieldset key={f.name} data-field={f.name}>
                  <legend class="field-label">{label}</legend>
                  <div class="flex flex-wrap gap-4">
                    {f.options.map((o) => (
                      <label key={o} class="flex items-center gap-2">
                        <input type="radio" name={id} value={o} checked={values[f.name] === o} disabled={f.readOnly} onChange={() => set(f.name, o)} />
                        <span>{o}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              );
            }
            if (f.type === 'dropdown') {
              return (
                <label key={f.name} class="block">
                  <span class="field-label">{label}</span>
                  <select class="field" value={String(values[f.name] ?? '')} disabled={f.readOnly} onChange={(e) => set(f.name, e.currentTarget.value)} data-field={f.name}>
                    <option value="">Choose…</option>
                    {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </label>
              );
            }
            return (
              <label key={f.name} class="block">
                <span class="field-label">{label}</span>
                <select
                  class="field min-h-28"
                  multiple={f.multiSelect}
                  disabled={f.readOnly}
                  onChange={(e) => set(f.name, Array.from(e.currentTarget.selectedOptions).map((o) => o.value))}
                  data-field={f.name}
                >
                  {f.options.map((o) => <option key={o} value={o} selected={(values[f.name] as string[] | undefined)?.includes(o)}>{o}</option>)}
                </select>
              </label>
            );
          })}
        </form>
      )}

      {editable.length > 0 && (
        <label class="flex items-start gap-3">
          <input type="checkbox" class="mt-1 size-5" checked={flatten} onChange={(e) => { setFlatten(e.currentTarget.checked); setResult(null); }} data-testid="flatten" />
          <span>
            <span class="font-bold">Flatten the form</span>
            <span class="block text-sm text-muted">Turns your answers into regular page content so they can’t be changed later. Leave off to keep the form editable.</span>
          </span>
        </label>
      )}

      {problem && <Notice kind="error" testId="script-error">{FORM_TEXT_PROBLEM_MESSAGE[problem]}</Notice>}
      {error && <Notice kind="error" testId="error">{error}</Notice>}
      {busy ? (
        <Progress value={null} label={busy} />
      ) : result ? (
        <PdfResultCard result={result} onReset={reset} />
      ) : (
        <div class="flex flex-wrap gap-3">
          {editable.length > 0 && (
            <button type="button" class="btn btn-primary" onClick={run} disabled={!!problem} data-testid="run">
              Save filled PDF
            </button>
          )}
          <StartOverButton onReset={reset} />
        </div>
      )}
    </div>
  );
}
