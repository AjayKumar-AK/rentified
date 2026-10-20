import type { ReactNode } from 'react';

export function Field({
  id, label, optional, hint, error, wide, children,
}: { id: string; label: string; optional?: boolean; hint?: string; error?: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={`field${wide ? ' field--wide' : ''}`}>
      <label htmlFor={id}>
        {label} {optional && <span className="opt">(optional)</span>}
      </label>
      {children}
      {hint && <div className="hint" id={`${id}-hint`}>{hint}</div>}
      {error && <div className="error" id={`${id}-error`} role="alert">{error}</div>}
    </div>
  );
}

function describedBy(id: string, hint?: string, error?: string) {
  return [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
}

export function TextInput(props: {
  id: string; name?: string; label: string; optional?: boolean; hint?: string; error?: string; wide?: boolean;
  type?: string; inputMode?: 'numeric' | 'tel' | 'email' | 'text'; autoComplete?: string; defaultValue?: string; required?: boolean;
  maxLength?: number; min?: number | string; max?: number | string; placeholder?: string;
}) {
  const { id, name, label, optional, hint, error, wide, ...rest } = props;
  return (
    <Field id={id} label={label} optional={optional} hint={hint} error={error} wide={wide}>
      <input
        id={id} name={name ?? id} className="input" aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)} {...rest}
      />
    </Field>
  );
}

export function TextArea(props: {
  id: string; name?: string; label: string; optional?: boolean; hint?: string; error?: string; wide?: boolean;
  defaultValue?: string; required?: boolean; maxLength?: number; rows?: number; placeholder?: string;
}) {
  const { id, name, label, optional, hint, error, wide, ...rest } = props;
  return (
    <Field id={id} label={label} optional={optional} hint={hint} error={error} wide={wide ?? true}>
      <textarea id={id} name={name ?? id} className="textarea" aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error)} {...rest} />
    </Field>
  );
}

export function Select(props: {
  id: string; name?: string; label: string; optional?: boolean; hint?: string; error?: string; wide?: boolean;
  options: { value: string; label: string }[]; defaultValue?: string; required?: boolean; placeholder?: string;
}) {
  const { id, name, label, optional, hint, error, wide, options, placeholder, ...rest } = props;
  return (
    <Field id={id} label={label} optional={optional} hint={hint} error={error} wide={wide}>
      <select id={id} name={name ?? id} className="select" aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error)} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}

/** Multi-select as accessible checkbox chips. */
export function ChipGroup({
  name, legend, options, defaultValues, error, hint,
}: { name: string; legend: string; options: { value: string; label: string }[]; defaultValues?: string[]; error?: string; hint?: string }) {
  return (
    <fieldset className="field field--wide" style={{ border: 0, padding: 0, margin: 0 }} aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="label" style={{ fontFamily: 'inherit', fontSize: '0.93rem', fontWeight: 600, padding: 0, marginBottom: 8 }}>{legend}</legend>
      <div className="checks">
        {options.map((o) => (
          <label key={o.value} className="chip">
            <input type="checkbox" name={name} value={o.value} defaultChecked={defaultValues?.includes(o.value)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
      {hint && <div className="hint">{hint}</div>}
      {error && <div className="error" id={`${name}-error`} role="alert">{error}</div>}
    </fieldset>
  );
}

export function Consent({
  name, label, detail, error, tone,
}: { name: string; label: ReactNode; detail?: ReactNode; error?: string; tone?: 'public' }) {
  // Never pre-checked: consent must be an active choice.
  return (
    <div>
      <label className={`consent${tone === 'public' ? ' consent--public' : ''}`}>
        <input type="checkbox" name={name} aria-invalid={error ? true : undefined} />
        <span>
          <strong>{label}</strong>
          {detail && <span className="small muted">{detail}</span>}
        </span>
      </label>
      {error && <div className="error" role="alert" style={{ marginTop: 6 }}>{error}</div>}
    </div>
  );
}

export function FormSummary({ state }: { state: { status: string; message?: string; errors?: Record<string, string> } }) {
  if (state.status !== 'error' || !state.message) return null;
  const items = Object.entries(state.errors ?? {});
  return (
    <div className="alert alert--error" role="alert" tabIndex={-1} data-form-summary>
      <strong>{state.message}</strong>
      {items.length > 0 && (
        <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
          {items.map(([k, v]) => <li key={k}>{v}</li>)}
        </ul>
      )}
    </div>
  );
}

/** Hidden spam trap. Humans never see or fill this. */
export function Honeypot() {
  return (
    <div className="honeypot" aria-hidden="true">
      <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
    </div>
  );
}
