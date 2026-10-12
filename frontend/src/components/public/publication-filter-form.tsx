import Link from 'next/link';
import type { ListQuery } from '@/lib/public/pages';
import styles from './publication-listing.module.css';
export function PublicationFilterForm({ query }: { query: ListQuery }) {
  return <form action="/publications" method="get" className={styles.filters} aria-label="Filter publications">
    {(['author','venue'] as const).map(name => <div className={styles.field} key={name}><label htmlFor={name}>{name === 'author' ? 'Author' : 'Venue'}</label><input id={name} name={name} maxLength={200} defaultValue={query.values[name] ?? ''}/></div>)}
    <div className={styles.field}><label htmlFor="year">Year</label><input id="year" name="year" type="number" min={1} max={9999} defaultValue={query.values.year ?? ''}/></div>
    <div className={styles.field}><label htmlFor="sort">Sort</label><select id="sort" name="sort" defaultValue={query.sort}><option value="-publishedAt">Recently published</option><option value="publishedAt">First published</option><option value="title">Title A–Z</option><option value="-title">Title Z–A</option><option value="-year">Year descending</option><option value="year">Year ascending</option></select></div>
    <div className={styles.field}><label htmlFor="limit">Per page</label><input id="limit" name="limit" type="number" min={1} max={100} defaultValue={query.limit}/></div>
    <div className={styles.filterActions}><button type="submit">Apply</button><Link href="/publications" prefetch={false}>Reset</Link></div>
  </form>;
}
