'use client';
import {useEffect,useState} from 'react';
import {Pause,Play} from 'lucide-react';
import {Section} from '@/components/ui/section';
import styles from './academy-technology-slider.module.css';
// No verified technology-brand assets are installed. These are plain text references.
const technologies=['Python','ROS2','ESP32','Android','Docker','Git','Kotlin','n8n','SQL','TypeScript'];
export function AcademyTechnologySlider(){
  const [paused,setPaused]=useState(false),[reduced,setReduced]=useState(true),[hidden,setHidden]=useState(false);
  useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const sync=()=>{setReduced(media.matches);setHidden(document.hidden);};sync();media.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);return()=>{media.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);};},[]);
  return <Section tone="dark" className={styles.band} data-technology-slider data-paused={paused||reduced||hidden} aria-labelledby="academy-technologies-title"><div className={styles.header}><h2 id="academy-technologies-title">Explore the technologies behind practical learning.</h2><button type="button" aria-controls="academy-technology-track" aria-label={reduced?'Technology autoplay disabled for reduced motion':paused?'Play technology slider':'Pause technology slider'} disabled={reduced} onClick={()=>setPaused(value=>!value)}>{paused||reduced?<Play aria-hidden="true"/>:<Pause aria-hidden="true"/>}</button></div><div className={styles.viewport}><div id="academy-technology-track" className={styles.track}><ul className={styles.group} aria-label="Technology references">{technologies.map(technology=><li key={technology}>{technology}</li>)}</ul><ul className={styles.group} aria-hidden="true" data-loop-copy>{technologies.map(technology=><li key={technology}>{technology}</li>)}</ul></div></div><p className={styles.note}>Technology references do not imply partnership or endorsement.</p></Section>;
}
