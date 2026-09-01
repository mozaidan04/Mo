import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  name: string;
  defaultValue?: string | number;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  type?: string;
  dir?: "rtl" | "ltr";
};

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3 py-2.5 outline-none focus:border-primary";

export function Field({ label, name, defaultValue, placeholder, required, hint, type = "text", dir }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">
        {label} {required ? <span className="text-danger">*</span> : null}
      </span>
      <input
        className={inputClass}
        type={type}
        name={name}
        dir={dir}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
      />
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function TextArea({
  label,
  name,
  defaultValue,
  rows = 6,
  required,
  hint,
  placeholder,
}: FieldProps & { rows?: number }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">
        {label} {required ? <span className="text-danger">*</span> : null}
      </span>
      <textarea
        className={`${inputClass} leading-8`}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
      />
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function SelectField({
  label,
  name,
  defaultValue,
  options,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  options: Array<{ value: string | number; label: string }>;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      <select className={inputClass} name={name} defaultValue={defaultValue}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function CheckboxField({
  label,
  name,
  defaultChecked,
  hint,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 h-4 w-4" />
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
      </span>
    </label>
  );
}

export function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="text-lg font-bold">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
