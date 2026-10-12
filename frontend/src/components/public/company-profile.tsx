'use client';
import Image from 'next/image';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {ArrowUpRight,UserRound,Star} from 'lucide-react';
import {ConfirmAction} from '@/components/admin/confirm';
import {approvedImage,createPagesLoader,safeHttps,type DetailResult} from '@/lib/public/pages';
import type {TeamProfile} from './company-data';
import styles from './home-company.module.css';
export function TeamPortrait({entry}:{entry:TeamProfile}){
 const image=entry.demo?entry.demoPortrait:entry.media?.find(photo=>approvedImage(photo.url));
 const initials=entry.title.replace(/^Example\s+/,'').split(/\s+/).slice(0,2).map(word=>word[0]).join('');
 return <div className={styles.portraitArea}>{image?<Image src={image.url} alt={image.altText} width={image.width} height={image.height} unoptimized draggable={false} style={entry.demo&&entry.demoPortrait?{objectPosition:entry.demoPortrait.position}:undefined}/>:entry.demo?<div className={styles.avatar} aria-label={`Illustrative avatar for ${entry.title}`}><span aria-hidden="true">{initials}</span></div>:<div className={styles.noPortrait}><UserRound aria-hidden="true"/><span>Profile photo unavailable</span></div>}</div>;
}
export function DemoRating({entry}:{entry:TeamProfile}){
 if(!entry.demo||typeof entry.demoRating!=='number'||!Number.isFinite(entry.demoRating)||entry.demoRating<0||entry.demoRating>10)return null;
 return <p className={styles.demoRating}><Star aria-hidden="true"/>Demo rating: {entry.demoRating.toFixed(1)}/10</p>;
}
export function CompanyProfile({entry,onClose}:{entry:TeamProfile;onClose:()=>void}){
 const [result,setResult]=useState<DetailResult|null>(null);
 useEffect(()=>{if(entry.demo)return;let active=true;async function load(){try{const base=new URL(process.env.NEXT_PUBLIC_API_BASE_URL??'/api/v1',window.location.origin).href;const data=await createPagesLoader(base).detail('team',entry.slug);if(active)setResult(data);}catch{if(active)setResult({state:'unavailable'});}}void load();return()=>{active=false;};},[entry]);
 const record=result?.state==='available'?result.data:undefined,profile=record?{...entry,...record}:entry;
 const links=entry.demo?[]:(record?.profileLinks??entry.profileLinks??[]).flatMap(link=>{const url=safeHttps(link.url);return url?[{...link,url}]:[];});
 function list(label:string,values:string[]|undefined){return values?.length?<section><h3>{label}</h3><ul>{values.map((value,index)=><li key={index}>{value}</li>)}</ul></section>:null;}
 return <ConfirmAction title={profile.title} busy={false} onCancel={onClose} presentation="details" className={styles.dialog} headerClassName={styles.dialogHeader} contentClassName={styles.dialogContent} detailsLabel="Team profile details" closeLabel="Close team profile">
 {entry.demo&&<><p className={styles.demoLabel}>Demo profile</p><p className={styles.demoNote}>This frontend-only profile illustrates a possible role. It is not a real person, confirmed team member, qualification or availability listing. The name is fictional and does not identify the person in the illustrative portrait. Ratings are layout examples, not reviews.</p></>}
 <div className={styles.profileDetails}><TeamPortrait entry={profile}/><div><h3 className={styles.memberName}>{profile.title}</h3>{profile.role&&<p className={styles.role}>{profile.role}</p>}<DemoRating entry={entry}/><section><h3>{entry.demo?'Illustrative role overview':'Biography'}</h3><p>{profile.biography??profile.summary}</p></section>{list('Expertise',profile.expertise)}</div></div>
 {list('Proposed contribution areas',entry.contributions)}
 {!entry.demo&&<>{list('Education',entry.education)}{list('Experience',entry.experience)}{list('Projects',entry.projects)}{list('Publications',entry.publications)}{list('Awards',entry.awards)}</>}
 {!entry.demo&&!result&&<p className={styles.demoNote} role="status">Loading published profile details…</p>}
 {result&&result.state!=='available'&&<p className={styles.demoNote} role="status">{result.state==='missing'?'This published profile is no longer available.':'Additional profile details are temporarily unavailable.'}</p>}
 {!!links.length&&<section><h3>Approved profile links</h3><div className={styles.actions}>{links.map((link,index)=><a key={index} href={link.url} target="_blank" rel="noopener noreferrer" className={styles.action}>{link.label}<ArrowUpRight aria-hidden="true"/></a>)}</div></section>}
 <div className={styles.actions}><Link href="/contact" prefetch={false} className={styles.action}>Contact<ArrowUpRight aria-hidden="true"/></Link>{!entry.demo&&<Link href={`/team/${entry.slug}`} prefetch={false} className={styles.action}>Published profile<ArrowUpRight aria-hidden="true"/></Link>}</div>
 </ConfirmAction>;
}
