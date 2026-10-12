import type { ComponentPropsWithRef, ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { classes } from "@/lib/classes";

type FieldProps = { id: string; label: string; hint?: string; error?: string };
type FrameProps = FieldProps & { required?: boolean; children: ReactNode };

function FieldFrame({ id, label, hint, error, required, children }: FrameProps) {
  return <div className="field">
    <label htmlFor={id}>{label}{required && <span className="field-required"> (required)</span>}</label>
    {children}
    {hint && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
    {error && <p id={`${id}-error`} className="field-error"><CircleAlert aria-hidden="true" />{error}</p>}
  </div>;
}

function describedBy(id: string, hint?: string, error?: string, additional?: string) {
  return classes(hint && `${id}-hint`, error && `${id}-error`, additional) || undefined;
}

export function TextField({ id, label, hint, error, className, required, ...props }:
  FieldProps & Omit<ComponentPropsWithRef<"input">, "id">) {
  return <FieldFrame {...{ id, label, hint, error, required }}>
    <input {...props} id={id} required={required} aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, hint, error, props["aria-describedby"])} className={classes("field-control", className)} />
  </FieldFrame>;
}

export function TextAreaField({ id, label, hint, error, className, required, ...props }:
  FieldProps & Omit<ComponentPropsWithRef<"textarea">, "id">) {
  return <FieldFrame {...{ id, label, hint, error, required }}>
    <textarea {...props} id={id} required={required} aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, hint, error, props["aria-describedby"])} className={classes("field-control", className)} />
  </FieldFrame>;
}

export function SelectField({ id, label, hint, error, className, required, children, ...props }:
  FieldProps & Omit<ComponentPropsWithRef<"select">, "id">) {
  return <FieldFrame {...{ id, label, hint, error, required }}>
    <select {...props} id={id} required={required} aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, hint, error, props["aria-describedby"])} className={classes("field-control", className)}>{children}</select>
  </FieldFrame>;
}
