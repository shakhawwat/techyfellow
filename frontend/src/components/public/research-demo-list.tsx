'use client';

import { useId, useState } from 'react';
import { ResearchCollaboration } from './research-record-content';
import { researchDemoLabel, type ResearchDemo } from './research-demo-data';
import styles from './research-listing.module.css';

export function ResearchDemoList({ records }: { records: readonly ResearchDemo[] }) {
  const [openId, setOpenId] = useState<string | null>(null), id = useId();
  return <div className={styles.results}>
    {records.length ? <ul className={styles.list} aria-label="Illustrative research previews">{records.map(entry => {
      const open = openId === entry.id, titleId = `${id}-${entry.id}-title`, panelId = `${id}-${entry.id}-details`;
      const sections = [{ heading: 'Objectives', items: entry.objectives }, { heading: 'Proposed methodology', items: entry.methodology }, { heading: 'Evaluation plan', items: entry.evaluationPlan }, { heading: 'Required resources', items: entry.resources }, { heading: 'Potential contributor roles', items: entry.contributorRoles }];
      return <li key={entry.id} data-demo-id={entry.id} className={styles.row}>
        <div className={styles.summary}><div><h2 id={titleId}>{entry.title}</h2><p className={`${styles.status} ${styles.demoStatus}`}>Illustrative stage: {entry.stage} · {entry.teamRequirement}</p></div><button type="button" aria-label={`${open ? 'Less' : 'More'}: ${entry.title}`} aria-expanded={open} aria-controls={panelId} onClick={() => setOpenId(open ? null : entry.id)}>{open ? 'Less' : 'More'}</button></div>
        <div id={panelId} role="region" aria-labelledby={titleId} hidden={!open} className={`${styles.details} ${styles.demoDetails}`}>
          <p className={styles.demoNotice}>{researchDemoLabel}</p><p className={styles.demoNote}>Domain: {entry.domain}</p>
          <section><h3>Overview</h3><p>{entry.summary}</p></section><section><h3>Motivation</h3><p>{entry.motivation}</p></section>
          {sections.map(section => <section key={section.heading}><h3>{section.heading}</h3><ul>{section.items.map(item => <li key={item}>{item}</li>)}</ul></section>)}
          <section><h3>Illustrative stage and team requirement</h3><p>{entry.stage} · {entry.teamRequirement} These are proposed layout details, not evidence of ongoing work or an actual team opening.</p></section>
          <section><h3>Collaboration inquiries</h3><ResearchCollaboration/><p className={styles.demoNote}>Mention “{entry.title}” as an illustrative preview in your inquiry. No researchers, supervisors, results or publications are claimed.</p></section>
        </div>
      </li>;
    })}</ul> : <p className={styles.demoNotice} role="status">No illustrative research previews match these filters.</p>}
  </div>;
}
