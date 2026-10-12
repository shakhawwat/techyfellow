'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { accountRequest } from '@/lib/account/api';
import { useAccountSession } from './session';
import styles from './account.module.css';
export function AccountForm({signup = false}: {signup?: boolean}) {
 const router = useRouter(), {refresh} = useAccountSession();
 const [busy,setBusy] = useState(false), [error,setError] = useState(''), [success,setSuccess] = useState('');
 async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault(); if (busy) return; setError('');
  const form = event.currentTarget, values = new FormData(form), email = String(values.get('email')).trim().toLowerCase(), password = String(values.get('password')), passwordConfirmation = String(values.get('passwordConfirmation') ?? '');
  if (signup && password !== passwordConfirmation) { setError('Passwords must match.'); return; }
  setBusy(true);
  try {
   if (signup) { const result = await accountRequest<{data:{verification:{status:string}}}>('register','POST',{name:String(values.get('name')).trim(),email,password,passwordConfirmation}); form.reset(); setSuccess(result.data.verification.status === 'pending' ? 'Account created. Email verification is pending. You can now log in.' : 'Account created. Email verification is unavailable; your account remains unverified. You can now log in.'); }
   else { await accountRequest('login','POST',{email,password}); form.reset(); await refresh(); router.push('/'); }
  } catch (cause) { setError(cause instanceof Error ? cause.message : 'The request could not be confirmed.'); }
  finally { setBusy(false); }
 }
 return <main id="public-main" className={`${styles.page} ${signup ? '' : styles.loginPage}`}><form className={styles.form} onSubmit={submit} aria-busy={busy}>
  <h1>{signup ? 'Create account' : 'Log in'}</h1><p>{signup ? 'Create your public Techy Fellow account.' : 'Sign in to your public Techy Fellow account.'}</p>
  {success ? <><p role="status">{success}</p><Link href="/login">Log in</Link></> : <>
   {signup && <label>Name<input name="name" autoComplete="name" required maxLength={120}/></label>}
   <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>
   <label>Password<input name="password" type="password" autoComplete={signup ? 'new-password' : 'current-password'} required minLength={signup ? 12 : undefined} maxLength={128} aria-describedby={signup ? 'password-guidance' : undefined}/></label>
   {signup && <><p id="password-guidance">Use at least 12 characters.</p><label>Confirm password<input name="passwordConfirmation" type="password" autoComplete="new-password" required minLength={12} maxLength={128}/></label></>}
   {error && <p role="alert">{error}</p>}<button className={styles.submit} disabled={busy}>{busy ? 'Please wait…' : signup ? 'Create account' : 'Log in'}</button>
   <p>{signup ? 'Already have an account? ' : 'New here? '}<Link href={signup ? '/login' : '/signup'}>{signup ? 'Log in' : 'Create account'}</Link></p>
  </>}
 </form></main>;
}
