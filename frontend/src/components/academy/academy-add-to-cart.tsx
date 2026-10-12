'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {useAccountSession} from '@/components/account/session';
import {api} from '@/lib/admin/api';
import {useAcademyCart} from './academy-cart-context';
import {academyDemos} from '@/components/public/academy-demo-data';
import styles from './academy-course-details.module.css';
export function AcademyAddToCart({courseId,enrolled,className}:{courseId:string;enrolled?:boolean;className?:string}){
 const cart=useAcademyCart(),{session}=useAccountSession(),userId=session.user?.id,[access,setAccess]=useState<{id:string;userId:string;enrolled:boolean}|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let active=true;if(enrolled!==undefined||session.status!=='authenticated'||!userId||academyDemos.some(course=>course.id===courseId))return;api<{data:{enrolled:boolean}}>(`/academy/courses/${courseId}/access`).then(value=>{if(active)setAccess({id:courseId,userId,enrolled:value.data.enrolled});}).catch(()=>{});return()=>{active=false;};},[enrolled,session.status,userId,courseId]);
 const hasAccess=enrolled??(access?.id===courseId&&access.userId===userId&&access.enrolled);
 if(hasAccess)return null;
 return <>{cart.ids.includes(courseId)?<Link className={className??styles.action} href="/academy/cart">View cart</Link>:<button type="button" className={className??styles.action} disabled={!cart.ready||busy} onClick={async()=>{if(busy)return;setBusy(true);setError('');if(!await cart.add(courseId))setError('Could not add this course. Try again.');setBusy(false);}}>{busy?'Adding…':'Add to cart'}</button>}{error&&<span role="alert">{error}</span>}</>;
}
