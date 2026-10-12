'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { createPagesLoader, researchStages, type ListQuery, type Pagination, type PublicRecord } from '@/lib/public/pages';
import { ResearchMetadata, ResearchRecordContent } from './research-record-content';
import styles from './research-listing.module.css';

export function ResearchProjectList({ records: initialRecords, pagination: initialPagination, query }: { records: readonly PublicRecord[]; pagination: Pagination; query: ListQuery }) {
  const [records, setRecords] = useState(() => [...new Map(initialRecords.map(record => [record.slug, record])).values()]);
  const [pagination, setPagination] = useState(initialPagination);
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false), [error, setError] = useState(false);
  const pending = useRef(false), mounted = useRef(true);
  const loader = useRef<ReturnType<typeof createPagesLoader> | null>(null);
  const id = useId();
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function showMore() {
    if (pending.current || pagination.page >= pagination.totalPages) return;
    pending.current = true; setLoading(true); setError(false);
    try {
      loader.current ??= createPagesLoader(new URL(process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/v1', window.location.origin).href);
      const page = pagination.page + 1, params = new URLSearchParams(query.params);
      params.set('page', String(page));
      const result = await loader.current.list('research', { ...query, page, params: params.toString() });
      if (!mounted.current) return;
      if (result.state !== 'available') { setError(true); return; }
      setRecords(previous => {
        const seen = new Set(previous.map(record => record.slug));
        return [...previous, ...result.data.filter(record => { if (seen.has(record.slug)) return false; seen.add(record.slug); return true; })];
      });
      setPagination(result.pagination);
    } catch { if (mounted.current) setError(true); }
    finally { pending.current = false; if (mounted.current) setLoading(false); }
  }
  return <div className={styles.results}>
    <ul className={styles.list} aria-label="Research projects">{records.map((record, index) => {
      const open = openId === record.slug, titleId = `${id}-title-${index}`, panelId = `${id}-panel-${index}`;
      const stage = researchStages.find(value => value === record.researchStage);
      return <li key={record.slug} className={styles.row}>
        <div className={styles.summary}><div><h2 id={titleId}>{record.title}</h2>{stage && <p className={styles.status}>{stage}</p>}</div><button type="button" aria-label={`${open ? 'Less' : 'More'}: ${record.title}`} aria-expanded={open} aria-controls={panelId} onClick={() => setOpenId(open ? null : record.slug)}>{open ? 'Less' : 'More'}</button></div>
        <div id={panelId} role="region" aria-labelledby={titleId} hidden={!open} className={styles.details}>
          <ResearchMetadata record={record}/>
          <ResearchRecordContent record={record}/>
          <div className={styles.recordNavigation}><p>Published <time dateTime={record.publishedAt}>{record.publishedAt.slice(0, 10)}</time></p><Link prefetch={false} href={`/research/${record.slug}`}>Open research record<ArrowUpRight aria-hidden="true"/></Link></div>
        </div>
      </li>;
    })}</ul>
    {pagination.page < pagination.totalPages && <div className={styles.loadMore}><button type="button" disabled={loading} onClick={() => void showMore()}>{loading ? 'Loading research…' : 'Show more research'}</button><p role="status" aria-live="polite">{loading ? 'Loading the next research batch…' : error ? 'More research is temporarily unavailable. Your loaded records are preserved. Try again.' : ''}</p></div>}
  </div>;
}
