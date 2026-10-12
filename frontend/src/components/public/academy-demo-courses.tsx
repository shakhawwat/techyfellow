'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useId, useState } from 'react';
import { ArrowUpRight, Bot, BrainCircuit, ChevronDown, Cpu, FlaskConical } from 'lucide-react';
import { academyDemos, academyDemoNotice, type AcademyDemo } from './academy-demo-data';
import {AcademyAddToCart} from '@/components/academy/academy-add-to-cart';
import { AcademyPrice } from '@/components/academy/academy-price';
import styles from './academy-demo-courses.module.css';
const icons = { robot:Bot, chip:Cpu, vision:BrainCircuit, research:FlaskConical };
function Media({ entry }: { entry: AcademyDemo }) {
  const [failed, setFailed] = useState(false), Icon = icons[entry.icon];
  return <figure className={styles.media}><div className={styles.image}>{entry.image && !failed ? <Image src={entry.image.src} alt={entry.image.alt} fill sizes="(max-width:767px) 88px, 128px" onError={() => setFailed(true)}/> : <Icon aria-hidden="true"/>}</div><figcaption>{entry.image && !failed ? 'Illustrative media' : 'Course icon'}</figcaption></figure>;
}
export function AcademyDemoCourses() {
  const [openId, setOpenId] = useState<string | null>(null), id = useId();
  return <div className={styles.previews}><p className={styles.notice}>{academyDemoNotice}</p><ul className={styles.list} aria-label="Illustrative Academy course previews">{academyDemos.map(entry => {
    const open = entry.id === openId, titleId = `${id}-${entry.id}-title`, panelId = `${id}-${entry.id}-syllabus`;
    const details = [{title:'Learning objectives',items:entry.objectives},{title:'Prerequisites',items:entry.prerequisites},{title:'Hardware requirements',items:entry.hardware},{title:'Software requirements',items:entry.software}];
    return <li key={entry.id} data-demo-id={entry.id} className={styles.row}>
      <div className={styles.summary}><Media entry={entry}/><div className={styles.description}><span className={styles.level} data-level={entry.level}>{entry.level}</span><h3 id={titleId}>{entry.title}</h3><p>{entry.description}</p><AcademyPrice courseId={entry.id}/><AcademyAddToCart courseId={entry.id}/><p className={styles.timing}>Duration: {entry.duration} · Schedule: {entry.schedule}</p></div><button type="button" className={styles.toggle} aria-label={`${open ? 'Hide syllabus' : 'View syllabus'}: ${entry.title}`} aria-expanded={open} aria-controls={panelId} onClick={() => setOpenId(open ? null : entry.id)}>{open ? 'Hide syllabus' : 'View syllabus'}<ChevronDown aria-hidden="true"/></button></div>
      <div id={panelId} className={styles.panel} data-open={open} role="region" aria-labelledby={titleId} aria-hidden={!open} inert={!open}><div className={styles.panelInner}><div className={styles.details}>
        <p className={styles.notice}>{academyDemoNotice}</p>
        {details.slice(0,2).map(section => <section key={section.title}><h4>{section.title}</h4><ul>{section.items.map(item => <li key={item}>{item}</li>)}</ul></section>)}
        <section><h4>Proposed modules</h4><ol className={styles.modules}>{entry.modules.map(module => <li key={module.title}><h5>{module.title}</h5><ul>{module.topics.map(topic => <li key={topic}>{topic}</li>)}</ul></li>)}</ol></section>
        <section><h4>Example practical project</h4><p>{entry.project}</p></section>
        {details.slice(2).map(section => <section key={section.title}><h4>{section.title}</h4><ul>{section.items.map(item => <li key={item}>{item}</li>)}</ul></section>)}
        <section><h4>Duration and schedule</h4><p>Duration: {entry.duration}. Schedule: {entry.schedule}.</p></section>
        <Link prefetch={false} href="/contact?type=course-interest" className={styles.interest}>Express interest<ArrowUpRight aria-hidden="true"/></Link><p className={styles.note}>Mention “{entry.title}” as an illustrative preview. An inquiry does not confirm a program or place.</p>
      </div></div></div>
    </li>;
  })}</ul></div>;
}
