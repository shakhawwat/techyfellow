'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import styles from './public-navbar.module.css';

// Memory belongs to this document, so client navigation/remounts cannot replay it.
let attemptedThisPage = false;

export function NavbarLogo() {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false), [imageFailed, setImageFailed] = useState(false);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let mounted = true;
    queueMicrotask(() => {
      if (mounted && !attemptedThisPage) {
        attemptedThisPage = true;
        if (!motion.matches) setPlaying(true);
      }
    });
    const changed = () => { if (motion.matches) setPlaying(false); };
    motion.addEventListener('change', changed);
    return () => { mounted = false; motion.removeEventListener('change', changed); };
  }, []);
  useEffect(() => {
    if (!playing || !video.current) return;
    const element = video.current;
    element.muted = true;
    // Fallback remains behind the video until an actual playing event.
    const ready = () => { element.dataset.playing = 'true'; clearTimeout(timeout); };
    const timeout = setTimeout(() => setPlaying(false), 8000);
    element.addEventListener('playing', ready);
    element.play().catch(() => setPlaying(false));
    return () => { clearTimeout(timeout); element.removeEventListener('playing', ready); };
  }, [playing]);
  return <span className={styles.logoFrame} aria-hidden="true">
    {imageFailed ? <span className={styles.logoText}>Techy Fellow</span> : <Image src="/brand/icon_logo.jpeg" alt="" width={1303} height={1207} unoptimized className={styles.logoStatic} onError={() => setImageFailed(true)}/>}
    {playing && <video ref={video} src="/brand/logo.mp4" className={styles.logoVideo} muted autoPlay playsInline preload="auto" onEnded={() => setPlaying(false)} onError={() => setPlaying(false)}/>}
  </span>;
}
