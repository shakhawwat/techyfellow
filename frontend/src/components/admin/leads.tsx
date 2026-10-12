"use client";
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { useAdmin } from './session';
import { ConfirmAction } from './confirm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SelectField, TextAreaField, TextField } from '@/components/ui/form-field';
import { errorOf, ApiError } from '@/lib/admin/api';
import { checkedLead, checkedOwners, inquiryTypes, leadStatuses, transitions, payloadLabels, type Lead, type LeadList, type LeadOwner, type OwnerList } from '@/lib/admin/leads';
function Gate({ children }: { children: ReactNode }) { const { can } = useAdmin(); return can('leads', 'read') ? children : <Card><h1>Access denied</h1><p role="alert">Your role does not permit access to lead contact data.</p></Card>; }
export function LeadsList() { return <Gate><LeadCollection/></Gate>; }
function LeadCollection() {
  const { call } = useAdmin();
  const [page, setPage] = useState(1), [status, setStatus] = useState(''), [type, setType] = useState(''), [sort, setSort] = useState('-createdAt'), [attempt, setAttempt] = useState(0);
  const [referenceInput, setReferenceInput] = useState(''), [ownerInput, setOwnerInput] = useState(''), [filters, setFilters] = useState({ reference: '', ownerId: '' }), [filterError, setFilterError] = useState('');
  const path = '/admin/leads?' + new URLSearchParams({ page: String(page), limit: '20', sort, ...(status ? { status } : {}), ...(type ? { type } : {}), ...(filters.reference ? { reference: filters.reference } : {}), ...(filters.ownerId ? { ownerId: filters.ownerId } : {}) }); const key = path + ':' + attempt;
  const [result, setResult] = useState<{ key: string; list?: LeadList; error?: ApiError }>({ key: '' });
  useEffect(() => { let active = true; call<LeadList>(path).then(list => { if (!Array.isArray(list.data) || !Number.isSafeInteger(list.pagination?.total) || !Number.isSafeInteger(list.pagination?.totalPages)) throw Error('Invalid lead list'); list.data.forEach(record => checkedLead(record)); if (active) setResult({ key, list }); }).catch(error => { if (active) setResult({ key, error: errorOf(error) }); }); return () => { active = false; }; }, [call, path, key]);
  const loading = result.key !== key, list = loading ? undefined : result.list;
  return <><div className="admin-page-heading"><div><span className="eyebrow">Inquiry workspace</span><h1>Leads</h1><p>Private contact data. Submission acknowledgment does not confirm a booking or service.</p></div></div>
    <Card><form className="admin-filters" onSubmit={event => { event.preventDefault(); const reference = referenceInput.trim(), ownerId = ownerInput.trim().toLowerCase(); if ((reference && !/^TF-[A-F0-9]{24}$/.test(reference)) || (ownerId && ownerId !== 'unassigned' && !/^[a-f0-9]{24}$/.test(ownerId))) { setFilterError('Use a complete reference and an owner ID, unassigned, or a blank owner filter.'); return; } setFilterError(''); setFilters({ reference, ownerId }); setPage(1); }}>
      <SelectField id="lead-type" label="Inquiry type" value={type} onChange={event => { setType(event.target.value); setPage(1); }}><option value="">All types</option>{inquiryTypes.map(value => <option key={value}>{value}</option>)}</SelectField>
      <SelectField id="lead-status-filter" label="Status" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option>{leadStatuses.map(value => <option key={value}>{value}</option>)}</SelectField>
      <SelectField id="lead-sort" label="Sort" value={sort} onChange={event => { setSort(event.target.value); setPage(1); }}><option value="-createdAt">Newest received</option><option value="createdAt">Oldest received</option><option value="-updatedAt">Recently updated</option></SelectField>
      <TextField id="lead-reference-filter" label="Exact reference" value={referenceInput} onChange={event => setReferenceInput(event.target.value)} maxLength={27}/><TextField id="lead-owner-filter" label="Owner ID" hint="Blank for all, or unassigned." value={ownerInput} onChange={event => setOwnerInput(event.target.value)} maxLength={24}/><Button type="submit" variant="secondary">Apply filters</Button>
      {filterError && <p className="admin-alert" role="alert">{filterError}</p>}
    </form></Card>
    {loading ? <Card><p role="status">Loading leads…</p></Card> : result.error ? <Card><p role="alert" className="admin-alert">{result.error.message}</p><Button onClick={() => setAttempt(attempt + 1)} variant="secondary"><RefreshCw aria-hidden="true"/>Retry loading</Button></Card> : list && <>
      {list.data.length ? <div className="admin-record-list">{list.data.map(lead => <Card key={lead.id} className="admin-record"><div><Link className="admin-record-title" href={'/admin/leads/' + lead.id}>{lead.reference}<ArrowRight aria-hidden="true"/></Link><p>{lead.name} · {lead.email}</p><p className="admin-slug">{lead.type}</p></div><div className="admin-record-meta"><Badge>{lead.status}</Badge><span>Revision {lead.revision}</span><span>{new Date(lead.createdAt).toLocaleDateString()}</span></div></Card>)}</div> : <Card><h2>No matching leads</h2><p>No inquiries match this selection. Adjust filters to review other saved inquiries.</p></Card>}
      <div className="admin-pagination"><span>{list.pagination.total} matching leads · Page {page} of {Math.max(1, list.pagination.totalPages)}</span><div><Button aria-label="Previous page" variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button><Button aria-label="Next page" variant="secondary" disabled={page >= list.pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button></div></div>
    </>}
  </>;
}
export function LeadDetail({ id }: { id: string }) { return <Gate><LeadEditor key={id} id={id}/></Gate>; }
function LeadEditor({ id }: { id: string }) {
  const { call, can } = useAdmin();
  const [record, setRecord] = useState<Lead | null>(null), [latest, setLatest] = useState<Lead | null>(null), [error, setError] = useState<ApiError | null>(null), [loadError, setLoadError] = useState<ApiError | null>(null), [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState(''), [owner, setOwner] = useState(''), [note, setNote] = useState(''), [owners, setOwners] = useState<LeadOwner[]>([]), [ownerPage, setOwnerPage] = useState(0), [ownerMore, setOwnerMore] = useState(false), [ownerError, setOwnerError] = useState(''), [ownerBusy, setOwnerBusy] = useState(false);
  const [busy, setBusy] = useState(false), [confirm, setConfirm] = useState(false), [success, setSuccess] = useState(''), [reviewing, setReviewing] = useState(false);
  const manage = can('leads', 'manage');
  const validId = /^[a-f0-9]{24}$/.test(id), path = '/admin/leads/' + id;
  useEffect(() => { if (!validId) return; let active = true;
    call<{ data: Lead }>(path).then(result => { const lead = checkedLead(result.data, true); if (active) { setRecord(lead); setOwner(lead.ownerId ?? ''); setLoadError(null); } }).catch(error => { if (active) setLoadError(errorOf(error)); });
    return () => { active = false; };
  }, [call, path, validId, attempt]);
  useEffect(() => { if (!manage) return; let active = true; call<OwnerList>('/admin/leads/owners?limit=100').then(result => { checkedOwners(result); if (active) { setOwners(result.data); setOwnerPage(1); setOwnerMore(result.pagination.totalPages > 1); } }).catch(() => { if (active) setOwnerError('Assignable owners are unavailable. Retry loading before changing assignment.'); }); return () => { active = false; }; }, [call, manage]);
  async function moreOwners() { setOwnerBusy(true); setOwnerError(''); try { const page = ownerPage ? ownerPage + 1 : 1, result = checkedOwners(await call<OwnerList>('/admin/leads/owners?limit=100&page=' + page)); setOwners(current => [...current, ...result.data.filter(item => !current.some(owner => owner.id === item.id))]); setOwnerPage(page); setOwnerMore(page < result.pagination.totalPages); } catch { setOwnerError('Assignable owners are unavailable. Retry loading before changing assignment.'); } finally { setOwnerBusy(false); } }
  async function review() { setReviewing(true); try { const result = await call<{ data: Lead }>(path); setLatest(checkedLead(result.data, true)); } catch (failure) { setError(errorOf(failure)); } finally { setReviewing(false); } }
  async function save() {
    if (!record) return; setBusy(true); setError(null); setSuccess('');
    try { const body = { revision: record.revision, ...(status ? { status } : {}), ...(owner !== (record.ownerId ?? '') ? { ownerId: owner || null } : {}), ...(note.trim() ? { note: note.trim() } : {}) }; const result = await call<{ data: Lead }>(path, 'PATCH', body); const saved = checkedLead(result.data, true); setRecord(saved); setStatus(''); setOwner(saved.ownerId ?? ''); setNote(''); setLatest(null); setSuccess('Lead changes saved.'); }
    catch (failure) { setError(errorOf(failure)); } finally { setBusy(false); setConfirm(false); }
  }
  if (!validId) return <Card><h1>Invalid lead ID</h1><Link href="/admin/leads">All leads</Link></Card>;
  if (!record) return <Card>{loadError ? <><h1>Unable to load lead</h1><p role="alert">{loadError.message}</p><Button onClick={() => setAttempt(attempt + 1)} variant="secondary">Retry loading</Button></> : <p role="status">Loading lead…</p>}<Link href="/admin/leads">All leads</Link></Card>;
  const fieldError = (field: string) => error?.fields.includes(field) ? 'Check this field against the saved workflow and allowed values.' : undefined;
  const changed = !!status || owner !== (record.ownerId ?? '') || !!note.trim();
  return <><Link className="public-inline-link" href="/admin/leads"><ArrowLeft aria-hidden="true"/>All leads</Link><div className="admin-page-heading"><div><span className="eyebrow">Private inquiry</span><h1>{record.reference}</h1><p>{record.type} · Revision {record.revision}</p></div><Badge>{record.status}</Badge></div>
    {success && <p className="admin-success" role="status">{success}</p>}{error && <Card><p className="admin-alert" role="alert">{error.status === 409 ? 'The saved revision or workflow conflicts with this update. Your unsaved input has been kept. Review the latest record before retrying.' : error.message}</p>{error.status === 409 && <Button variant="secondary" loading={reviewing} onClick={review}>Review latest record</Button>}</Card>}
    {latest && <Card><h2>Latest saved record</h2><p>Revision {latest.revision} · Status {latest.status} · Owner {latest.ownerId ?? 'unassigned'}</p><p>{latest.notes?.length ?? 0} saved internal notes.</p><Button variant="secondary" onClick={() => { setRecord(latest); setLatest(null); setError(null); }}>Use latest revision and keep input</Button><Button variant="ghost" onClick={() => { setRecord(latest); setOwner(latest.ownerId ?? ''); setStatus(''); setNote(''); setLatest(null); setError(null); }}>Discard input and reload</Button></Card>}
    <div className="admin-lead-columns"><Card><h2>Contact and inquiry</h2><dl className="admin-lead-fields">{Object.entries({ Name: record.name, Email: record.email, Phone: record.phone, Organization: record.organization, Source: record.source, 'Inquiry acknowledgment': record.consent ? 'Accepted' : 'Not recorded', 'Marketing consent': record.marketingConsent ? 'Opted in' : 'Not opted in', Received: new Date(record.createdAt).toLocaleString(), ...Object.fromEntries(Object.entries(record.payload ?? {}).filter(([key, value]) => payloadLabels[key] && ['string', 'number'].includes(typeof value)).map(([key, value]) => [payloadLabels[key], value])) }).filter(([, value]) => value !== undefined).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></Card>
      {can('leads', 'manage') && <Card><h2>Manage lead</h2><form onSubmit={event => { event.preventDefault(); setSuccess(''); if (note.length > 4000 || !changed) { setError(new ApiError(400, 'Add a valid change. Notes must be at most 4000 characters.', ['note'])); return; } setConfirm(true); }}>
        <SelectField id="lead-next-status" label="Status transition" value={status} error={fieldError('status')} onChange={event => setStatus(event.target.value)} disabled={busy}><option value="">Keep {record.status}</option>{leadStatuses.map(value => <option key={value} value={value} disabled={!transitions[record.status].includes(value)}>{value}</option>)}</SelectField>
        <SelectField id="lead-owner" label="Assigned owner" hint="Only enabled super administrators and sales managers can own leads." value={owner} error={fieldError('ownerId')} onChange={event => setOwner(event.target.value)} disabled={busy || !!ownerError}><option value="">Unassigned</option>{owner && !owners.some(item => item.id === owner) && <option value={owner}>Saved owner ({owner})</option>}{owners.map(item => <option key={item.id} value={item.id}>{item.email} · {item.role.replaceAll('_', ' ')}</option>)}</SelectField>
        {ownerError && <p role="alert">{ownerError}</p>}{(ownerError || ownerMore) && <Button variant="ghost" loading={ownerBusy} onClick={moreOwners}>{ownerError ? 'Retry owners' : 'Load more owners'}</Button>}
        <TextAreaField id="lead-note" label="Append internal note" hint="Private to lead managers; existing notes remain unchanged." value={note} maxLength={4000} error={fieldError('note')} onChange={event => setNote(event.target.value)} rows={5} disabled={busy}/><Button type="submit" disabled={!changed || error?.status === 409} loading={busy} loadingLabel="Saving…">Save lead changes</Button>
      </form></Card>}
    </div><Card><h2>Internal notes</h2>{record.notes?.length ? <ol className="admin-lead-notes">{record.notes.map((item, index) => <li key={index}><p>{item.text}</p><small>{new Date(item.createdAt).toLocaleString()} · Actor {item.actor}</small></li>)}</ol> : <p>No internal notes have been saved.</p>}</Card>
    {confirm && <ConfirmAction title="Save lead changes" busy={busy} onCancel={() => setConfirm(false)} onConfirm={save}><p>Save the selected workflow, assignment and internal note against revision {record.revision}?</p></ConfirmAction>}
  </>;
}
