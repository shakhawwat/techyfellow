'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { heroSlides } from '@/content/hero-slides';
import styles from './hero-slider.module.css';

export function HeroSlider() {
  const [active, setActive] = useState(0), [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false), [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false), [reduced, setReduced] = useState(true);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => { setReduced(motion.matches); setHidden(document.hidden); };
    queueMicrotask(sync);
    motion.addEventListener('change', sync); document.addEventListener('visibilitychange', sync);
    return () => { motion.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync); };
  }, []);
  useEffect(() => {
    if (paused || hovered || focused || hidden || reduced) return;
    const timer = setInterval(() => setActive(current => (current + 1) % heroSlides.length), 6000);
    return () => clearInterval(timer);
  }, [paused, hovered, focused, hidden, reduced]);
  function select(index: number) { setPaused(true); setActive((index + heroSlides.length) % heroSlides.length); }
  return <section className={styles.hero} data-theme="dark" aria-label="Techy Fellow highlights" aria-roledescription="carousel"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false); }}>
    <Container className={styles.container}>
      <div className={styles.slides} aria-live="off">
        {heroSlides.map((slide, index) => <div key={slide.label} className={styles.slide} data-active={active === index} aria-hidden={active !== index} inert={active !== index} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${heroSlides.length}: ${slide.label}`}>
          <div className={styles.backdrop} aria-hidden="true"><Image src={slide.image.src} alt="" fill sizes="100vw" priority={index === 0} className={styles.image} style={{ objectPosition: slide.image.position }}/></div>
          <div className={styles.copy}><span className={styles.technicalLabel}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{slide.label}</span><h1>{slide.title}</h1><p>{slide.description}</p><Link prefetch={false} className="button button-primary" href={slide.href} onClick={() => setPaused(true)}>{slide.cta}<ArrowRight aria-hidden="true"/></Link></div>
        </div>)}
      </div>
      <div className={styles.controls}>
        <div className={styles.direction}><Button variant="ghost" aria-label="Previous slide" onClick={() => select(active - 1)}><ArrowLeft aria-hidden="true"/></Button><Button variant="ghost" aria-label="Next slide" onClick={() => select(active + 1)}><ArrowRight aria-hidden="true"/></Button></div>
      </div>
    </Container>
  </section>;
}
