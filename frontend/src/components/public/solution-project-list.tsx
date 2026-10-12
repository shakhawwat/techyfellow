'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { ProjectPathway } from '@/content/solution-projects';
import { serviceCopy } from '@/content/services';
import { inquiryHref } from '@/lib/inquiry/schema';
import styles from './solution-project-list.module.css';
import { ExpandableMediaList, type ListMedia } from './expandable-media-list';

function ScopeList({ title, items }: { title: string; items: readonly string[] }) {
  return <section><h4>{title}</h4><ul>{items.map(item => <li key={item}>{item}</li>)}</ul></section>;
}

export function SolutionProjectList({ projects, media }: { projects: readonly ProjectPathway[]; media?: ListMedia }) {
  return <ExpandableMediaList label="Proposed project pathways" items={projects.map(project => ({
    id: project.title, title: project.title, description: project.description, media,
    metadata: serviceCopy.proposed,
    details: <div className={styles.scope}>
      <ScopeList title="Problem and intended use" items={project.problems}/>
      <section><h4>Proposed technical approach</h4><p>{project.approach}</p></section>
      <ScopeList title="Relevant capabilities" items={project.capabilities}/>
      <section><h4>Indicative deliverables</h4><p className={styles.note}>{serviceCopy.deliverablesNote}</p><ul>{project.deliverables.map(item => <li key={item}>{item}</li>)}</ul></section>
      <ScopeList title="Information and resources required" items={project.requirements}/>
      <section><h4>Evaluation questions and scope limitations</h4><p>{project.evaluation}</p><p className={styles.note}>This is a proposed project type for discussion. The prototype or implementation scope and review criteria must be agreed before work is scheduled.</p></section>
      <Link prefetch={false} className={styles.action} href={inquiryHref('engineering')}>Discuss this project<ArrowUpRight aria-hidden="true"/></Link>
    </div>,
  }))}/>;
}
