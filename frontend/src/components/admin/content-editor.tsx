"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Save, RefreshCw } from "lucide-react";
import { checkedRecord, labels, type ContentRecord, type ContentList, type Resource } from "@/lib/admin/contracts";
import { errorOf, type ApiError } from "@/lib/admin/api";
import { fields, patchPayload, serialize, toValues, type Values } from "@/lib/admin/fields";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TextField } from "@/components/ui/form-field";
import { useAdmin, ResourceGate } from "./session";
import { ProjectImages } from "./project-images";
import { ContentField } from "./fields";
import { ConfirmAction } from "./confirm";
type Action = "publish" | "unpublish" | "archive";
export function ContentEditor({ resource, id }: { resource: Resource; id?: string }) {
  return <ResourceGate resource={resource} edit={!id}>{id ? <LoadEditor key={`${resource}:${id}`} resource={resource} id={id} /> : <Editor key={resource} resource={resource} />}</ResourceGate>;
}
function LoadEditor({ resource, id }: { resource: Resource; id: string }) {
  const { call } = useAdmin(); const [data, setData] = useState<ContentRecord | null>(null); const [error, setError] = useState<ApiError | null>(null); const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    call<{ data: ContentRecord }>(`/admin/${resource}/${id}`).then(result => { const record = checkedRecord(result.data); if (active) setData(record); }).catch(failure => { if (active) setError(errorOf(failure)); });
    return () => { active = false; };
  }, [call, resource, id, attempt]);
  if (data) return <Editor resource={resource} initial={data} />;
  return <Card>{error ? <><p className="admin-alert" role="alert">{error.message}</p><Button variant="secondary" onClick={() => { setError(null); setAttempt(attempt + 1); }}>Retry loading</Button></> : <p role="status">Loading saved content…</p>}</Card>;
}
function Editor({ resource, initial }: { resource: Resource; initial?: ContentRecord }) {
  const router = useRouter(); const { call, can, notify } = useAdmin();
  const [record, setRecord] = useState(initial); const [values, setValues] = useState<Values>(() => toValues(resource, initial));
  const [errors, setErrors] = useState<Record<string, string>>({}); const [error, setError] = useState(""); const [success, setSuccess] = useState(""); const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false); const [latest, setLatest] = useState<ContentRecord | null>(null); const [action, setAction] = useState<Action | null>(null); const [schedule, setSchedule] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const baseline = toValues(resource, record);
  const dirtyKeys = fields[resource].filter(field => JSON.stringify(values[field.key]) !== JSON.stringify(baseline[field.key])).map(field => field.key);
  const dirty = dirtyKeys.length > 0;
  const editable = can(resource, "edit") && record?.status !== "archived" && (record?.status !== "published" || can(resource, "publish"));
  useEffect(() => {
    if (!dirty) return;
    const prevent = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", prevent); return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty]);
  function focusError(next: Record<string, string>) { setErrors(next); requestAnimationFrame(() => form.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus()); }
  function failure(failure: unknown) {
    const e = errorOf(failure); setError(e.message); setSuccess("");
    if (e.fields.length) focusError(Object.fromEntries(e.fields.map(field => [field, "Check this field; it may be required before publication."])));
    if (e.status === 409) { setConflict(true); setLatest(null); if (!record) setErrors({ slug: "This slug may already belong to another record. Choose a unique slug." }); }
  }
  function confirmed(result: ContentRecord, message: string) { const verified = checkedRecord(result); setRecord(verified); setValues(toValues(resource, verified)); setConflict(false); setLatest(null); setErrors({}); setError(""); setSuccess(message); }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSuccess(""); setError("");
    const parsed = record ? patchPayload(resource, values, record) : serialize(resource, values);
    if (Object.keys(parsed.errors).length) { focusError(parsed.errors); setError("Check the highlighted fields."); return; }
    const changes = "changes" in parsed ? parsed.changes : parsed.data;
    if (record && Object.keys(changes).length === 0) { setError("There are no changed fields to save."); return; }
    setBusy(true);
    try {
      const result = await call<{ data: ContentRecord }>(`/admin/${resource}${record ? `/${record.id}` : ""}`, record ? "PATCH" : "POST", record ? { ...changes, revision: record.revision } : changes);
      const verified = checkedRecord(result.data);
      if (!record) { notify("Draft created. The server confirmed the saved record."); router.replace(`/admin/${resource}/${verified.id}`); }
      else confirmed(verified, "Changes saved.");
    } catch (e) { failure(e); } finally { setBusy(false); }
  }
  function openAction(next: Action) {
    setSuccess(""); setError(""); setErrors({}); setSchedule("");
    if (next === "publish") { const parsed = serialize(resource, values, true); if (Object.keys(parsed.errors).length) { focusError(parsed.errors); setError("Complete the highlighted publication fields before publishing."); return; } }
    setAction(next);
  }
  async function performAction() {
    if (!record || !action) return;
    let publishedAt: string | undefined;
    if (action === "publish" && schedule) {
      const date = new Date(schedule); if (!Number.isFinite(date.getTime())) { setError("Choose a valid publication date."); return; } publishedAt = date.toISOString();
    }
    setBusy(true);
    try {
      const result = await call<{ data: ContentRecord }>(`/admin/${resource}/${record.id}/${action}`, "POST", { revision: record.revision, ...(publishedAt ? { publishedAt } : {}) });
      const message = action === "publish" ? (publishedAt && Date.parse(publishedAt) > Date.now() ? "Publication scheduled." : "Content published.") : action === "unpublish" ? "Content returned to draft." : "Content archived.";
      confirmed(result.data, message); setAction(null);
    } catch (e) { setAction(null); failure(e); } finally { setBusy(false); }
  }
  async function review() {
    setBusy(true); setError("");
    try {
      const result = record ? (await call<{ data: ContentRecord }>(`/admin/${resource}/${record.id}`)).data : (await call<ContentList>(`/admin/${resource}?slug=${encodeURIComponent(String(values.slug).trim())}&limit=1`)).data[0];
      if (!result) { setError("No saved record currently uses this slug. Choose a unique slug and retry creating the draft."); return; }
      setLatest(checkedRecord(result));
    } catch (e) { failure(e); } finally { setBusy(false); }
  }
  function adoptLatest(discard: boolean) {
    if (!latest) return;
    if (discard && dirty && !window.confirm("Discard your unsaved input and reload the saved version?")) return;
    const next = toValues(resource, latest);
    if (!discard) for (const key of dirtyKeys) next[key] = values[key];
    setValues(next); setRecord(latest); setLatest(null); setConflict(false); setError(""); setSuccess(""); setErrors({});
  }
  return <><Link className="admin-back" href={`/admin/${resource}`}><ArrowLeft aria-hidden="true" />{labels[resource]}</Link>
    <div className="admin-page-heading"><div><span className="eyebrow">{record ? "Saved content" : "New draft"}</span><h1>{record ? record.title ?? record.name ?? record.slug : `Create ${labels[resource].toLowerCase()} draft`}</h1><p>{record ? `Revision ${record.revision} · ${record.slug}` : "New content is always saved as a draft."}</p></div>{record && <Badge variant={record.status === "published" ? "success" : "neutral"}>{record.status}</Badge>}</div>
    {!editable && <p className="admin-info">{record?.status === "archived" ? "Archived content is read-only." : record?.status === "published" && can(resource, "edit") ? "Published edits require a publisher. Ask a publisher to unpublish this record before editing." : "Your role has read-only access."}</p>}
    {error && <p className="admin-alert" role="alert">{error}</p>}{success && <p className="admin-success" role="status">{success}</p>}
    {conflict && <Card className="admin-conflict"><h2>Review the current version</h2><p>Your unsaved input is unchanged. Load the latest saved version to review the conflict.</p><Button variant="secondary" loading={busy} onClick={review}><RefreshCw aria-hidden="true" />Review latest saved version</Button></Card>}
    {latest && <Card className="admin-review"><h2>Latest saved version · revision {latest.revision}</h2><p>Status: {latest.status}. Compare your changed fields before deciding how to continue.</p>
      {fields[resource].filter(field => dirtyKeys.includes(field.key)).map(field => <div className="admin-difference" key={field.key}><h3>{field.label}</h3><div><p>Your input</p><pre>{typeof values[field.key] === "string" ? String(values[field.key]) : JSON.stringify(values[field.key], null, 2)}</pre></div><div><p>Latest saved</p><pre>{typeof toValues(resource, latest)[field.key] === "string" ? String(toValues(resource, latest)[field.key]) : JSON.stringify(toValues(resource, latest)[field.key], null, 2)}</pre></div></div>)}
      {record ? <div className="admin-actions"><Button variant="secondary" onClick={() => adoptLatest(true)}>Reload saved version</Button><Button onClick={() => adoptLatest(false)}>Keep my changes on latest revision</Button></div> : <><p>This slug belongs to an existing record. Choose another slug for your new draft.</p><Link className="button button-secondary" href={`/admin/${resource}/${latest.id}`} target="_blank" rel="noopener noreferrer">Open existing record in a new tab</Link></>}
    </Card>}
    <form ref={form} className="admin-editor-form" noValidate onSubmit={save}>
      <Card><div className="admin-form-heading"><h2>Content details</h2><p>Drafts may be incomplete. Required publication fields are marked with a hint.</p></div><div className="admin-form-grid">
        {fields[resource].map(field => resource === "projects" && field.key === "media" ? <ProjectImages key={field.key} value={values.media} disabled={!editable || busy} errors={errors} onChange={value => { setValues(previous => ({ ...previous, media: value })); setSuccess(""); }} /> : <ContentField key={field.key} field={field} value={values[field.key]} path={field.key} errors={errors} disabled={!editable || busy} onChange={value => { setValues(previous => ({ ...previous, [field.key]: value })); setSuccess(""); }} />)}
      </div></Card>
      {editable && <div className="admin-save-bar"><span>{dirty ? "Unsaved changes" : record ? "Saved version" : "Draft not yet created"}</span><Button type="submit" loading={busy} loadingLabel="Saving…" disabled={!!record && (!dirty || conflict)}><Save aria-hidden="true" />{record ? "Save changes" : "Create draft"}</Button></div>}
    </form>
    {record && record.status !== "archived" && <Card className="admin-publication"><h2>Publication</h2><p>{dirty ? "Save your changes before publishing or changing status." : "Status changes are confirmed by the server and recorded in the audit log."}</p>
      {record.publishedAt && <p>Publication time: {new Date(record.publishedAt).toLocaleString()}</p>}
      <div className="admin-actions">
        {record.status === "draft" && can(resource, "publish") && <Button disabled={busy || dirty || conflict} onClick={() => openAction("publish")}>Publish</Button>}
        {record.status === "published" && can(resource, "publish") && <Button variant="secondary" disabled={busy || dirty || conflict} onClick={() => openAction("unpublish")}>Unpublish</Button>}
        {can(resource, "edit") && (record.status !== "published" || can(resource, "publish")) && <Button variant="secondary" disabled={busy || dirty || conflict} onClick={() => openAction("archive")}>Archive</Button>}
      </div>
    </Card>}
    {action && <ConfirmAction title={action === "publish" ? "Publish" : action === "unpublish" ? "Unpublish" : "Archive"} busy={busy} onCancel={() => setAction(null)} onConfirm={performAction}>
      <p>{action === "publish" ? "Make this saved version publicly available at its publication time?" : action === "unpublish" ? "Remove this record from public view and return it to a draft?" : "Archive this record? Archived records are read-only and cannot be restored here."}</p><p>Revision {record?.revision} · {record?.title ?? record?.name}</p>
      {action === "publish" && <TextField id="publish-schedule" label="Publish at (optional, local time)" type="datetime-local" value={schedule} disabled={busy} onChange={event => setSchedule(event.target.value)} hint="Leave blank to publish now. Future dates keep content hidden until that time." />}
    </ConfirmAction>}
  </>;
}
