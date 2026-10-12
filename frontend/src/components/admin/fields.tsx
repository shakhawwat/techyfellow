"use client";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextAreaField, TextField, SelectField } from "@/components/ui/form-field";
import { emptyRow, type Field, type Value, type Values } from "@/lib/admin/fields";
export function ContentField({ field, value, path, onChange, errors, disabled }: { field: Field; value: Value; path: string; onChange: (value: Value) => void; errors: Record<string, string>; disabled: boolean }) {
  const id = `content-${path.replaceAll(".", "-")}`;
  if (field.type === "object" || field.type === "repeater") {
    const rows: Values[] = field.type === "object" ? [value as Values] : value as Values[];
    return <fieldset className="admin-fieldset" disabled={disabled}><legend>{field.label}</legend>{field.hint && <p className="field-hint">{field.hint}</p>}{errors[path] && <p className="field-error" role="alert">{errors[path]}</p>}
      {rows.map((row, index) => <div key={index} className={field.type === "repeater" ? "admin-repeat-row" : "admin-nested-grid"}>
        {field.type === "repeater" && <div className="admin-repeat-heading"><span>{field.label} {index + 1}</span><Button variant="ghost" aria-label={`Remove ${field.label.toLowerCase()} ${index + 1}`} onClick={() => onChange(rows.filter((_, i) => i !== index))}><Trash2 aria-hidden="true" />Remove</Button></div>}
        {(field.fields ?? []).map(child => <ContentField key={child.key} field={child} value={row[child.key]} path={`${path}${field.type === "repeater" ? `.${index}` : ""}.${child.key}`} errors={errors} disabled={disabled}
          onChange={next => { const updated = { ...row, [child.key]: next }; onChange(field.type === "object" ? updated : rows.map((item, i) => i === index ? updated : item)); }} />)}
      </div>)}
      {field.type === "repeater" && !disabled && <Button variant="secondary" disabled={rows.length >= 100} onClick={() => onChange([...rows, emptyRow(field)])}><Plus aria-hidden="true" />Add {field.label.toLowerCase()}</Button>}
      {field.type === "repeater" && rows.length === 0 && <p className="field-hint">No entries.</p>}
    </fieldset>;
  }
  if (field.type === "checkbox") return <div className="field"><label className="admin-checkbox" htmlFor={id}><input id={id} type="checkbox" checked={value === true} disabled={disabled} onChange={event => onChange(event.target.checked)} />{field.label}</label></div>;
  const props = { id, label: field.label, value: String(value), onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange(e.target.value), error: errors[path], disabled, required: field.required, hint: field.hint ?? (field.publish ? "Required before publishing." : undefined) };
  if (field.type === "select") return <SelectField {...props}><option value="">Choose an option</option>{field.choices?.map(choice => <option key={choice} value={choice}>{choice.replaceAll("-", " ")}</option>)}</SelectField>;
  if (field.type === "textarea" || field.type === "lines") return <TextAreaField {...props} rows={field.type === "lines" ? 3 : 4} maxLength={field.type === "lines" ? undefined : field.max} />;
  return <TextField {...props} type={field.type === "number" ? "number" : "text"} inputMode={field.type === "number" ? "decimal" : undefined} min={field.min} max={field.type === "number" ? field.max : undefined} step={field.integer ? "1" : "any"} maxLength={field.type === "number" ? undefined : field.max} />;
}
