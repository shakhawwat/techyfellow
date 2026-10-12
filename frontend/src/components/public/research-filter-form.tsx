import Link from 'next/link';
import { researchStages, type ListQuery } from '@/lib/public/pages';
import styles from './research-listing.module.css';

export function ResearchFilterForm({ query }: { query: ListQuery }) {
  return <form action="/research" method="get" className={styles.filters} aria-label="Filter research">
    <div className={styles.field}><label htmlFor="domain">Domain</label><input id="domain" name="domain" defaultValue={query.values.domain ?? ''} maxLength={200}/></div>
    <div className={styles.field}><label htmlFor="researchStage">Research stage</label><select id="researchStage" name="researchStage" defaultValue={query.values.researchStage ?? ''}><option value="">All research stage values</option>{researchStages.map(stage => <option key={stage} value={stage}>{stage}</option>)}</select></div>
    <div className={styles.field}><label htmlFor="sort">Sort</label><select id="sort" name="sort" defaultValue={query.sort}><option value="-publishedAt">Recently published</option><option value="publishedAt">First published</option><option value="title">Title A–Z</option><option value="-title">Title Z–A</option></select></div>
    <div className={styles.field}><label htmlFor="limit">Per page</label><input id="limit" name="limit" type="number" min={1} max={100} defaultValue={query.limit}/></div>
    <div className={styles.filterActions}><button type="submit">Apply</button><Link prefetch={false} href="/research">Reset</Link></div>
  </form>;
}
