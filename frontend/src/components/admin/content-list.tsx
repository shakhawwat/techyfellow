"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react";
import { checkedRecord, labels, resources, type ContentList as List, type Resource } from "@/lib/admin/contracts";
import { errorOf, type ApiError } from "@/lib/admin/api";
import { useAdmin, ResourceGate } from "./session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SelectField, TextField } from "@/components/ui/form-field";
export function AdminHome() {
  const { can } = useAdmin();
  return <><div className="admin-page-heading"><div><span className="eyebrow">Content workspace</span><h1>Choose a collection</h1><p>Inspect content and manage the actions assigned to your role.</p></div></div>
    <div className="admin-collection-grid">{resources.filter(resource => can(resource, "read")).map(resource => <Card key={resource}><h2>{labels[resource]}</h2><p>{can(resource, "edit") ? "Create drafts and manage content." : "Read access to saved content."}</p><Link className="button button-secondary" href={`/admin/${resource}`}>Open {labels[resource].toLowerCase()}<ArrowRight aria-hidden="true" /></Link></Card>)}{can("leads", "read") && <Card><h2>Leads</h2><p>Review inquiries and manage their assigned workflow.</p><Link className="button button-secondary" href="/admin/leads">Open leads<ArrowRight aria-hidden="true" /></Link></Card>}</div></>;
}
export function ContentList({ resource }: { resource: Resource }) { return <ResourceGate resource={resource}><ResourceList resource={resource} /></ResourceGate>; }
function ResourceList({ resource }: { resource: Resource }) {
  const { call, can } = useAdmin();
  const [page, setPage] = useState(1); const [status, setStatus] = useState(""); const [sort, setSort] = useState("-updatedAt");
  const [slugInput, setSlugInput] = useState(""); const [slug, setSlug] = useState(""); const [filterError, setFilterError] = useState(""); const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; list?: List; error?: ApiError; checkedAt?: number }>({ key: "" });
  const query = new URLSearchParams({ page: String(page), limit: "20", sort, ...(status ? { status } : {}), ...(slug ? { slug } : {}) });
  const path = `/admin/${resource}?${query}`; const key = `${path}:${attempt}`;
  useEffect(() => {
    let active = true;
    call<List>(path).then(list => {
      if (!Array.isArray(list.data) || !list.pagination || !Number.isSafeInteger(list.pagination.total)) throw new Error("Invalid list response");
      list.data.forEach(checkedRecord); if (active) setResult({ key, list, checkedAt: Date.now() });
    }).catch(error => { if (active) setResult({ key, error: errorOf(error) }); });
    return () => { active = false; };
  }, [call, path, key]);
  const loading = result.key !== key; const list = !loading ? result.list : undefined;
  return <><div className="admin-page-heading"><div><span className="eyebrow">Content collection</span><h1>{labels[resource]}</h1><p>{can(resource, "edit") ? "Start with a draft. Publishing requires a publisher." : "Read-only access. Your role cannot change content."}</p></div>
    {can(resource, "edit") && <Link className="button button-primary" href={`/admin/${resource}/new`}><Plus aria-hidden="true" />Create draft</Link>}</div>
    <Card className="admin-filters"><SelectField id="filter-status" label="Status" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option>{["draft", "published", "archived"].map(value => <option key={value} value={value}>{value}</option>)}</SelectField>
      <SelectField id="filter-sort" label="Sort" value={sort} onChange={event => { setSort(event.target.value); setPage(1); }}><option value="-updatedAt">Recently updated</option><option value="-createdAt">Recently created</option><option value={resource === "team" ? "name" : "title"}>Name / title</option><option value="-publishedAt">Publication date</option></SelectField>
      <form onSubmit={event => { event.preventDefault(); const value = slugInput.trim(); if (value && (value.length > 160 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))) { setFilterError("Enter a valid lowercase slug."); return; } setFilterError(""); setSlug(value); setPage(1); }}><TextField id="filter-slug" label="Exact slug" value={slugInput} onChange={event => setSlugInput(event.target.value)} error={filterError} /><Button type="submit" variant="secondary">Apply filter</Button></form>
    </Card>
    {loading ? <Card><p role="status">Loading {labels[resource].toLowerCase()}…</p></Card> : result.error ? <Card><p className="admin-alert" role="alert">{result.error.message}</p><Button variant="secondary" onClick={() => setAttempt(attempt + 1)}><RefreshCw aria-hidden="true" />Retry loading</Button></Card> : list && <>
      {list.data.length === 0 ? <Card><h2>No matching content</h2><p>{status || slug ? "Change the filters to view other saved records." : "This collection has no saved records."}</p></Card> : <div className="admin-record-list">{list.data.map(record => <Card key={record.id} className="admin-record"><div><Link className="admin-record-title" href={`/admin/${resource}/${record.id}`}>{record.title ?? record.name ?? record.slug}<ArrowRight aria-hidden="true" /></Link><p className="admin-slug">{record.slug}</p></div><div className="admin-record-meta"><Badge variant={record.status === "published" ? "success" : "neutral"}>{record.status}{record.publishedAt && Date.parse(record.publishedAt) > (result.checkedAt ?? 0) ? " · scheduled" : ""}</Badge><span>Revision {record.revision}</span><span>Updated {record.updatedAt ? new Date(record.updatedAt).toLocaleDateString() : "date unavailable"}</span></div></Card>)}</div>}
      <div className="admin-pagination"><span>{list.pagination.total} matching {list.pagination.total === 1 ? "record" : "records"} · Page {page} of {Math.max(1, list.pagination.totalPages)}</span><div><Button variant="secondary" aria-label="Previous page" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft aria-hidden="true" />Previous</Button><Button variant="secondary" aria-label="Next page" disabled={page >= list.pagination.totalPages} onClick={() => setPage(page + 1)}>Next<ChevronRight aria-hidden="true" /></Button></div></div>
    </>}
  </>;
}
