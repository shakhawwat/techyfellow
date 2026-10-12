'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {useAccountSession} from '@/components/account/session';
import {api} from '@/lib/admin/api';
import styles from './academy-course-details.module.css';
type EnrolledCourse={course:{slug:string;title:string};enrolledAt:string;configured:boolean};
export function AcademyMyLearning(){
 const {session}=useAccountSession(),userId=session.user?.id,[result,setResult]=useState<{userId:string;courses:EnrolledCourse[]}|null>(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;if(session.status!=='authenticated'||!userId)return;api<{data:EnrolledCourse[]}>('/academy/my-learning').then(value=>{if(active){setResult({userId,courses:value.data});setError('');}}).catch(()=>{if(active)setError('Your enrollments could not be loaded. Reload to check your access.');});return()=>{active=false;};},[session.status,userId]);
 const courses=session.status==='authenticated'&&result?.userId===userId?result?.courses:null;
 return <main id="public-main" className={styles.page}><section className={styles.section}><h1>My Learning</h1><p>Your active course enrollments, verified by the server.</p>{session.status==='anonymous'?<Link className={styles.action} href="/academy/login?returnTo=%2Facademy%2Fmy-learning">Log in to view My Learning</Link>:session.status==='error'?<p role="alert">Account service unavailable. Reload to check your session.</p>:error?<p role="alert">{error}</p>:!courses?<p role="status">Loading your enrolled courses…</p>:courses.length?<ul className={styles.list}>{courses.map(item=><li key={item.course.slug}><h2>{item.course.title}</h2>{item.configured?<Link className={`${styles.action} ${styles.primary}`} href={`/academy/courses/${item.course.slug}#course-content`}>Continue learning</Link>:<><p>Course lesson access is currently unavailable.</p><Link href={`/academy/courses/${item.course.slug}`}>View course</Link></>}</li>)}</ul>:<p>No active course enrollments yet. Apply a supplied scholarship code and confirm your order, or use an available enrollment option.</p>}<Link href="/academy/courses">Browse courses</Link></section></main>;
}
