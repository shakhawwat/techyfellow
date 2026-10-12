'use client';

import { useId, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { ChevronDown, FileText } from 'lucide-react';
import styles from './expandable-media-list.module.css';

export type ListMedia = { src: string; alt: string; illustrative?: boolean; position?: string };
export type ExpandableMediaItem = {
  id: string; title: string; description: string; metadata?: ReactNode;
  media?: ListMedia; overviewTitle?: string; mediaCaption?: string; fallback?: ReactNode; details: ReactNode;
};
export function ListImage({ media, expanded = false, fallback }: { media?: ListMedia; expanded?: boolean; fallback?: ReactNode }) {
  return <div className={expanded ? styles.preview : styles.thumbnail}>
    {media ? <Image src={media.src} alt={expanded ? media.alt : ''} fill loading="lazy" sizes={expanded ? '(max-width: 767px) calc(100vw - 48px), 320px' : '(max-width: 767px) 72px, 112px'} style={{ objectFit: 'cover', objectPosition: media.position ?? '50% 50%' }}/>
      : fallback ?? <FileText aria-hidden="true"/>}
  </div>;
}
export function ExpandableMediaList({ items, label, viewLabel = 'View details', hideLabel = 'Hide details' }: { items: readonly ExpandableMediaItem[]; label: string; viewLabel?: string; hideLabel?: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const listId = useId();
  return <div className={styles.list} aria-label={label}>{items.map((item, index) => {
    const open = openId === item.id;
    const titleId = `${listId}-title-${index}`, buttonId = `${listId}-button-${index}`, panelId = `${listId}-panel-${index}`;
    return <article key={item.id} className={styles.row}>
      <div className={styles.summary}>
        <ListImage media={item.media} fallback={item.fallback}/>
        <div className={styles.description}><h3 id={titleId}>{item.title}</h3>{item.metadata && <div className={styles.metadata}>{item.metadata}</div>}<p>{item.description}</p>{item.media?.illustrative && <p className={styles.mediaLabel}>Illustrative media</p>}</div>
        <button id={buttonId} type="button" aria-expanded={open} aria-controls={panelId} aria-labelledby={`${buttonId} ${titleId}`} onClick={() => setOpenId(open ? null : item.id)}>{open ? hideLabel : viewLabel}<ChevronDown aria-hidden="true"/></button>
      </div>
      <div id={panelId} role="region" aria-labelledby={titleId} aria-hidden={!open} inert={!open} data-open={open} className={styles.panel}><div className={styles.panelInner}><div className={styles.details}>
        <div className={styles.overview}><figure><ListImage media={item.media} expanded fallback={item.fallback}/>{item.media?.illustrative && <figcaption>{item.mediaCaption ?? 'Illustrative media — not evidence of delivered Techyfellow work.'}</figcaption>}{!item.media && <figcaption>Image unavailable; section icon shown.</figcaption>}</figure><section><h4>{item.overviewTitle ?? 'Overview'}</h4><p>{item.description}</p></section></div>
        {item.details}
      </div></div></div>
    </article>;
  })}</div>;
}
