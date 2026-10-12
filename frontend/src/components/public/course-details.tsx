'use client';
import Link from 'next/link';
import {AcademyPrice} from '@/components/academy/academy-price';
import {CoursePrice} from './course-price';
import {CourseLevel} from './course-level';
import {CourseGallery} from './course-gallery';
import {useEffect,useId,useState} from 'react';
import {ArrowRight,ArrowUpRight,ChevronDown} from 'lucide-react';
import {ConfirmAction} from '@/components/admin/confirm';
import {createPagesLoader,deliveryModes,safeHttps,type DetailResult} from '@/lib/public/pages';
import {type CoursePreview} from './academy-data';
import styles from './course-details.module.css';
function Module({title,topics}:{title:string;topics:string[]}){
 const id=useId(),[open,setOpen]=useState(false);
 return <li className={styles.module}><button type="button" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(value=>!value)}>{title}<ChevronDown aria-hidden="true" data-open={open}/></button><div id={id} hidden={!open}>{topics.length>0&&<ul>{topics.map((topic,index)=><li key={index}>{topic}</li>)}</ul>}</div></li>;
}
export function CourseDetails({entry,onClose,academyPricing=false}:{entry:CoursePreview;onClose:()=>void;academyPricing?:boolean}){
 const [result,setResult]=useState<DetailResult|null>(null);
 useEffect(()=>{if(entry.demo)return;let mounted=true;async function load(){try{const base=new URL(process.env.NEXT_PUBLIC_API_BASE_URL??'/api/v1',window.location.origin).href,data=await createPagesLoader(base).detail('courses',entry.slug);if(mounted)setResult(data);}catch{if(mounted)setResult({state:'unavailable'});}}void load();return()=>{mounted=false;};},[entry]);
 const record=result?.state==='available'?result.data:undefined,level=record?.level??entry.level,delivery=deliveryModes.find(value=>value===(record?.deliveryMode??entry.deliveryMode)),duration=record?.duration??entry.duration;
 const modules=record?.syllabus??entry.modules,enrollment=entry.demo?undefined:safeHttps(entry.enrollmentUrl),title=record?.title??entry.title;
 function paragraph(label:string,value:string|undefined){return value?<section><h3>{label}</h3><p>{value}</p></section>:null;}
 function list(label:string,values:string[]|undefined){return values?.length?<section><h3>{label}</h3><ul>{values.map((value,index)=><li key={index}>{value}</li>)}</ul></section>:null;}
 return <ConfirmAction title={title} busy={false} onCancel={onClose} presentation="details" className={styles.dialog} headerClassName={styles.header} contentClassName={styles.content} detailsLabel="Course details" closeLabel="Close course details">
  {entry.demo&&<><p className={styles.label}>Course preview</p><p className={styles.note}>Proposed programs; schedules and enrollment are not yet confirmed. Curriculum and outcomes below are proposed.</p></>}
  <CourseGallery key={entry.slug} entry={record?{...entry,media:record.media}:entry}/>
  <>{academyPricing?<AcademyPrice courseId={entry.slug}/>:<CoursePrice entry={entry}/>}</>
  {paragraph('Overview',record?.summary??entry.summary)}
  {level&&<section><h3>Level</h3><CourseLevel level={level}/></section>}
  {list(entry.demo?'Proposed prerequisites':'Prerequisites',record?.prerequisites??entry.prerequisites)}
  {list(entry.demo?'Proposed learning objectives':'Learning objectives',entry.objectives)}
  {!!modules?.length&&<section><h3>{entry.demo?'Proposed modules':'Modules'}</h3><ul className={styles.modules}>{modules.map((module,index)=><Module key={`${module.title}-${index}`} title={module.title} topics={module.topics}/>)}</ul></section>}
  {list(entry.demo?'Proposed practical projects':'Practical projects',entry.projects)}
  {list(entry.demo?'Proposed learning outcomes':'Expected learning outcomes',entry.outcomes)}
  {list(entry.demo?'Suggested hardware for the proposed program':'Required hardware',entry.hardware)}
  {list(entry.demo?'Suggested software for the proposed program':'Required software',entry.software)}
  {paragraph('Delivery mode',delivery?.replaceAll('-',' '))}
  {duration&&paragraph('Duration',`${duration.value} ${duration.unit}`)}
  {!entry.demo&&<>{paragraph('Instructor',entry.instructor)}{paragraph('Schedule',entry.schedule)}{paragraph('Price',entry.price)}{paragraph('Enrollment status',entry.enrollmentStatus)}</>}
  {!entry.demo&&!result&&<p className={styles.note} role="status">Loading available course details…</p>}
  {result&&result.state!=='available'&&<p className={styles.note} role="status">{result.state==='missing'?'The published course is no longer available.':'Additional course details are temporarily unavailable.'}</p>}
  <section className={styles.actions}><Link prefetch={false} href={enrollment??(entry.demo?'/contact':`/academy/courses/${entry.slug}#course-inquiry`)} className={styles.action} {...(enrollment?{target:'_blank',rel:'noopener noreferrer'}:{})}>{enrollment?'Enroll':'Express interest'}<ArrowRight aria-hidden="true"/></Link>
   {entry.demo?<p className={styles.note}>Enrollment is not open. Mention “{title}” in your contact message. Expressing interest does not reserve a place.</p>:!enrollment&&<p className={styles.note}>The course-interest form preselects this published course. An inquiry does not confirm enrollment.</p>}
   {!entry.demo&&<Link prefetch={false} className={styles.recordLink} href={`/academy/courses/${entry.slug}`}>Published course record<ArrowUpRight aria-hidden="true"/></Link>}
  </section>
 </ConfirmAction>;
}
