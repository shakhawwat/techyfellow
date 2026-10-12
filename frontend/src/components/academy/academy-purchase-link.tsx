'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {useAccountSession} from '@/components/account/session';
import {api} from '@/lib/admin/api';
import type {OrderSummary} from '@/lib/academy/contracts';
export function AcademyPurchaseLink({courseId,enrolled=false,className}:{courseId:string;enrolled?:boolean;className?:string}){
 const {session}=useAccountSession(),[ready,setReady]=useState<{id:string;eligible:boolean}|null>(null);
 useEffect(()=>{let active=true;if(enrolled)return;api<{data:OrderSummary}>(`/academy/courses/${courseId}/commerce`).then(result=>{if(active)setReady({id:courseId,eligible:result.data.commerce.eligible});}).catch(()=>{});return()=>{active=false;};},[courseId,enrolled]);
 const order=`/academy/courses/${courseId}/order`,href=session.status==='anonymous'?`/academy/login?returnTo=${encodeURIComponent(order)}`:order;
 return <Link className={className} href={enrolled?`/academy/courses/${courseId}#course-content`:href}>{enrolled?'Continue learning':ready?.id===courseId&&ready.eligible?'Buy course':'View order summary'}</Link>;
}
