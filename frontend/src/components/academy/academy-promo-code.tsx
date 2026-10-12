'use client';
import {useId,useRef,useState} from 'react';
import {api,ApiError} from '@/lib/admin/api';
import type {CourseQuote} from '@/lib/academy/contracts';
import {formatAcademyMoney} from '@/lib/academy/pricing';
import styles from './academy-course-details.module.css';
export function AcademyPromoCode({courseId,disabled=false,value,onValueChange,editable=false,applyUnavailableReason,onChange,onBusyChange,children}:{courseId:string;disabled?:boolean;value?:string;onValueChange?:(value:string)=>void;editable?:boolean;applyUnavailableReason?:string;onChange:(quote:CourseQuote|null,code:string)=>void;onBusyChange?:(busy:boolean)=>void;children?:React.ReactNode}){
 const id=useId(),[localCode,setLocalCode]=useState(''),[quote,setQuote]=useState<CourseQuote|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),pending=useRef(false),revision=useRef(0);
 const code=value??localCode;
 function change(text:string){revision.current++;setLocalCode(text);onValueChange?.(text);setQuote(null);setError('');onChange(null,'');}
 async function apply(){if(pending.current||disabled||!code.trim())return;if(applyUnavailableReason){setError(applyUnavailableReason);return;}const submitted=code.trim(),version=revision.current;pending.current=true;onBusyChange?.(true);setBusy(true);setError('');try{const result=await api<{data:CourseQuote}>(`/academy/courses/${courseId}/quote`,'POST',{code:submitted});if(version!==revision.current)return;setQuote(result.data);onChange(result.data,submitted);}catch(cause){if(version!==revision.current)return;setQuote(null);onChange(null,'');setError(cause instanceof ApiError?cause.message:'This code could not be applied.');}finally{pending.current=false;setBusy(false);onBusyChange?.(false);}}
 function remove(){change('');}
 return <div className={styles.code}><p className={styles.small}>One code per order. Sale and code discounts do not stack; the better single discount applies.</p><label htmlFor={id}>Scholarship / promo code</label><div><input id={id} value={code} maxLength={64} autoComplete="off" disabled={!editable&&(disabled||busy)} aria-invalid={!!error} aria-describedby={error?`${id}-error`:undefined} onChange={event=>change(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();void apply();}}}/><button type="button" className={styles.action} disabled={disabled||busy||!code.trim()} onClick={()=>void apply()}>{busy?'Applying…':'Apply'}</button></div>
 {error&&<p id={`${id}-error`} role="alert" className={styles.error}>{error}</p>}{quote&&<><dl><dt>Subtotal</dt><dd>{formatAcademyMoney(quote.subtotalMinor)}</dd><dt>Discount</dt><dd>−{formatAcademyMoney(quote.discountMinor)}</dd><dt>Final amount</dt><dd>{formatAcademyMoney(quote.finalMinor)}</dd></dl><button type="button" className={styles.action} disabled={disabled||busy} onClick={remove}>Remove code</button>{children}</>}</div>;
}
