'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronDown, LogOut } from 'lucide-react';
import { useAccountSession } from './session';
import styles from './account.module.css';
export function NavbarAccount({mobile = false, onNavigate}: {mobile?: boolean; onNavigate: () => void}) {
  const {session,refresh,logout} = useAccountSession();
  const [open,setOpen] = useState(false), [busy,setBusy] = useState(false), [error,setError] = useState('');
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => { const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); }; document.addEventListener('pointerdown',outside); return () => document.removeEventListener('pointerdown',outside); },[]);
  if (session.status === 'loading') return <div className={styles.loading} role="status" aria-label="Checking account session"/>;
  if (session.status === 'error') return <button className={styles.login} onClick={() => void refresh()}>Retry account session</button>;
  if (session.status === 'anonymous') return <div className={`${styles.actions} ${mobile ? styles.mobile : ''}`}><Link className={`${styles.login} ${styles.loginCta}`} href="/login" onClick={onNavigate}>Sign in<ArrowRight size={16} aria-hidden="true"/></Link></div>;
  const user = session.user!, name = user.name || user.email.split('@')[0], initials = name.split(/\s+/).map(part => part[0]).slice(0,2).join('').toUpperCase();
  return <div ref={root} className={`${styles.user} ${mobile ? styles.mobile : ''}`} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false); }} onKeyDown={event => { if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); } }}>
    <button ref={trigger} className={styles.userTrigger} aria-expanded={open} aria-controls={mobile ? 'mobile-account-actions' : 'desktop-account-actions'} onClick={() => { setError(''); setOpen(!open); }}><span className={styles.avatar} aria-hidden="true">{initials}</span><span className={styles.name}>{name}</span><ChevronDown size={14} aria-hidden="true"/></button>
    <div id={mobile ? 'mobile-account-actions' : 'desktop-account-actions'} className={styles.userPanel} hidden={!open}><button disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await logout(); setOpen(false); onNavigate(); } catch { setError('Logout could not be confirmed. Try again.'); } finally { setBusy(false); } }}><LogOut size={16} aria-hidden="true"/>{busy ? 'Logging out…' : 'Log out'}</button>{error && <p role="alert">{error}</p>}</div>
  </div>;
}
