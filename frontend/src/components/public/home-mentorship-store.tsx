'use client';
import Image from 'next/image';
import {HomeMentorship} from './home-mentorship';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,ArrowUpRight,Bot,BrainCircuit,Package,type LucideIcon} from 'lucide-react';
import {Container} from '@/components/ui/container';
import {ConfirmAction} from '@/components/admin/confirm';
import {homeCopy} from '@/content/home';
import styles from './home-mentorship-store.module.css';
import {demoKits,kitTotal,bdt,type KitData,type KitPreview} from './kit-data';
import {KitDetails} from './kit-details';
import {KitCarousel} from './kit-carousel';
type Preview={id:string;kind:'mentor'|'kit';title:string;summary:string;Icon:LucideIcon;image?:{url:string;alt:string;width:number;height:number};details:{heading:string;items:string[]}[];kit?:KitData};
const integrity='Technical mentorship with clear scope. Students retain responsibility for assessed work.';
const kits:Preview[]=demoKits.map(kit=>({...kit,Icon:kit.id==='vision-kit'?BrainCircuit:kit.id==='esp32-kit'||kit.id==='agriculture-kit'?Package:Bot}));
function Action({href,children}:{href:string;children:React.ReactNode}){return <Link prefetch={false} href={href} className={styles.action}>{children}<ArrowRight aria-hidden="true"/></Link>;}
function Details({entry,onClose}:{entry:Preview;onClose:()=>void}){
 const mentor=entry.kind==='mentor';
 return <ConfirmAction title={entry.title} busy={false} onCancel={onClose} presentation="details" className={styles.dialog} headerClassName={styles.dialogHeader} contentClassName={styles.dialogContent} detailsLabel={mentor?'Mentorship guidance':'Concept kit details'} closeLabel="Close preview details">
  <p className={styles.label}>{mentor?'Demo mentor profile':'Concept kit · Demo pricing'}</p><p className={styles.notice}>{mentor?'This illustrative role is not a confirmed mentor, availability listing or booking. Support areas and session topics are proposed.':'The bill of materials is illustrative, not a confirmed package or offer. '+homeCopy.store.availability}</p>
  {mentor&&entry.image&&<Image className={styles.dialogImage} src={entry.image.url} alt={entry.image.alt} width={entry.image.width} height={entry.image.height} unoptimized/>}
  <p className={styles.summary}>{entry.summary}</p>{entry.kit&&<KitDetails kit={entry.kit} title={entry.title}/>} {entry.details.map(detail=><section key={detail.heading}><h3>{detail.heading}</h3><ul>{detail.items.map(item=><li key={item}>{item}</li>)}</ul></section>)}
  {mentor&&<section><h3>Academic integrity</h3><p>{integrity} Mentorship must follow the learner’s institution and assessment rules.</p></section>}
  {mentor&&<div className={styles.dialogActions}><Action href={mentor?'/contact?type=mentorship':'/contact'}>{mentor?'Discuss mentorship':'Discuss hardware requirements'}</Action><p className={styles.notice}>Mention “{entry.title}” in your inquiry. {mentor?'An inquiry does not confirm a mentor or session.':'No catalog purchase or checkout is available here.'}</p></div>}
 </ConfirmAction>;
}
export function HomeMentorshipStore(){
 const [selected,setSelected]=useState<Preview|null>(null),root=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!root.current||!('IntersectionObserver'in window))return;const motion=window.matchMedia('(prefers-reduced-motion: reduce)'),animations:Animation[]=[];const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;observer.unobserve(entry.target);if(!motion.matches)animations.push(entry.target.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:350,easing:'ease-out'}));}),{threshold:.15});root.current.querySelectorAll('#store [data-preview-reveal]').forEach(element=>observer.observe(element));const cancel=()=>{if(motion.matches)animations.forEach(animation=>animation.cancel());};motion.addEventListener('change',cancel);return()=>{observer.disconnect();animations.forEach(animation=>animation.cancel());motion.removeEventListener('change',cancel);};},[]);
 function cards(entries:Preview[],carousel=false){const items=entries.map(entry=><article key={entry.id} className={styles.card} data-preview-reveal>{entry.image?<div className={styles.image}><Image src={entry.image.url} alt={entry.image.alt} width={entry.image.width} height={entry.image.height} unoptimized draggable={entry.kind==='kit'?false:undefined}/><span>Illustrative image</span></div>:<entry.Icon className={styles.roleIcon} aria-hidden="true"/>}<div className={styles.cardContent}><p className={styles.label}>{entry.kind==='mentor'?'Demo mentor profile':'Concept kit · Demo pricing'}</p><h3>{entry.title}</h3><p className={styles.summary}>{entry.summary}</p>{entry.kit&&<p className={styles.kitPrice}>{bdt(kitTotal(entry.kit))}<span>Illustrative component estimate</span></p>}<button type="button" className={styles.previewAction} aria-haspopup="dialog" aria-label={`${entry.kind==='mentor'?'View guidance':'View kit'}: ${entry.title}`} onClick={event=>{event.currentTarget.focus({preventScroll:true});setSelected(entry);}}>{entry.kind==='mentor'?'View guidance':'View kit'}<ArrowUpRight aria-hidden="true"/></button></div></article>);return carousel?<KitCarousel>{items}</KitCarousel>:<div className={styles.grid}>{items}</div>;}
 return <div ref={root}><HomeMentorship/>
 <section id="store" tabIndex={-1} data-theme="dark" className={`${styles.section} ${styles.store}`} aria-labelledby="store-title"><Container><header className={styles.heading} data-preview-reveal><p className={styles.label}>ROBOTICS STORE</p><h2 id="store-title">Hardware for the physical world.</h2><p>{homeCopy.store.text}</p></header>{cards(kits,true)}<Action href="/store/kits">View all kits</Action><p className={styles.notice}>{homeCopy.store.availability}</p></Container></section>{selected&&<Details key={selected.id} entry={selected} onClose={()=>setSelected(null)}/>}</div>;
}

export function KitPopup({entry,onClose}:{entry:KitPreview;onClose:()=>void}){return <Details entry={{...entry,Icon:Package}} onClose={onClose}/>;}
