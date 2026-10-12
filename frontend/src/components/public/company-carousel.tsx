'use client';
import {useEffect,useRef,useState,type PointerEvent,type ReactNode} from 'react';
import type {TeamProfile} from './company-data';
import styles from './company-carousel.module.css';
export function CompanyCarousel({profiles,renderProfile,popupOpen=false}:{profiles:TeamProfile[];popupOpen?:boolean;renderProfile:(profile:TeamProfile)=>ReactNode}){
 const initial=Math.min(2,Math.floor(profiles.length/2)),[center,setCenter]=useState(initial),[dragging,setDragging]=useState(false),[visible,setVisible]=useState<number[]>([]);
 const [paused,setPaused]=useState(false),[hovered,setHovered]=useState(false),[hidden,setHidden]=useState(false),[reduced,setReduced]=useState(false);
 const direction=useRef(1);
 const viewport=useRef<HTMLDivElement>(null),centerRef=useRef(initial),gesture=useRef<{id:number;x:number;y:number;scroll:number;horizontal:boolean}|null>(null),suppress=useRef(false);
 function go(index:number){const element=viewport.current;if(!element)return;const card=element.querySelector<HTMLElement>('[data-profile-index]');if(!card)return;const target=Math.max(0,Math.min(profiles.length-1,index));centerRef.current=target;setCenter(target);if(element.dataset.groupCentered==='true'){centerRef.current=target;setCenter(target);return;}element.scrollTo({left:target*(card.offsetWidth+12),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
 const profileKey=profiles.map(profile=>profile.slug).join('|');
 useEffect(()=>{const element=viewport.current;if(!element)return;
 let frame=0;const reset=Math.min(2,Math.floor(element.children.length/2));centerRef.current=reset;
 const measure=()=>{const count=window.innerWidth>=1024?5:window.innerWidth>=768?3:element.clientWidth>=480?2:1;const width=count===1?element.clientWidth*.78:(element.clientWidth-(count-1)*12)/count;const total=element.children.length;
 element.style.setProperty('--card-width',`${width}px`);element.dataset.columns=String(count);
 const groupCentered=total<=count&&total*width+Math.max(0,total-1)*12<=element.clientWidth;
 element.dataset.groupCentered=String(groupCentered);
 const target=Math.max(0,Math.min(total-1,centerRef.current));centerRef.current=target;
 element.scrollTo({left:groupCentered?0:target*(width+12),behavior:'instant'});
 cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{setCenter(target);setDragging(false);});
 };measure();const resize=new ResizeObserver(measure);resize.observe(element,{box:'border-box'});
 const observer=new IntersectionObserver(items=>setVisible(previous=>{const next=new Set(previous);for(const item of items){const index=Number((item.target as HTMLElement).dataset.profileIndex);if(item.intersectionRatio>.4)next.add(index);else next.delete(index);}return [...next];}),{root:element,threshold:[0,.4,1]});element.querySelectorAll('[data-profile-index]').forEach(slide=>observer.observe(slide));
 gesture.current=null;suppress.current=false;
 return()=>{cancelAnimationFrame(frame);resize.disconnect();observer.disconnect();};},[profileKey]);
 useEffect(()=>{const motion=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>{setReduced(motion.matches);setHidden(document.hidden);};update();motion.addEventListener('change',update);document.addEventListener('visibilitychange',update);return()=>{motion.removeEventListener('change',update);document.removeEventListener('visibilitychange',update);};},[]);
 useEffect(()=>{if(paused||hovered||hidden||reduced||dragging||popupOpen||profiles.length<2)return;const timer=window.setInterval(()=>{const current=centerRef.current;if(current>=profiles.length-1)direction.current=-1;else if(current<=0)direction.current=1;go(current+direction.current);},2000);return()=>window.clearInterval(timer);
 // The timer uses the current center ref and is recreated for filtered results.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[paused,hovered,hidden,reduced,dragging,popupOpen,profileKey,profiles.length]);
 function start(event:PointerEvent<HTMLDivElement>){if(event.button!==0||(event.target as HTMLElement).closest('button,a,input'))return;suppress.current=false;gesture.current={id:event.pointerId,x:event.clientX,y:event.clientY,scroll:event.currentTarget.scrollLeft,horizontal:false};}
 function follow(event:PointerEvent<HTMLDivElement>){const g=gesture.current;if(!g||g.id!==event.pointerId)return;const dx=event.clientX-g.x,dy=event.clientY-g.y;if(!g.horizontal){if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>8){gesture.current=null;return;}if(Math.abs(dx)<8)return;g.horizontal=true;event.currentTarget.setPointerCapture(event.pointerId);setDragging(true);}suppress.current=true;event.currentTarget.scrollLeft=g.scroll-dx;}
 function end(event:PointerEvent<HTMLDivElement>){const g=gesture.current;if(!g||g.id!==event.pointerId)return;gesture.current=null;setDragging(false);if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);const card=event.currentTarget.querySelector<HTMLElement>('[data-profile-index]');if(g.horizontal&&card)go(Math.round(event.currentTarget.scrollLeft/(card.offsetWidth+12)));}
 return <div className={styles.carousel} role="region" aria-roledescription="carousel" aria-label="Team profiles" onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocusCapture={event=>{if(!(event.target as HTMLElement).closest('[data-autoplay-control]'))setPaused(true);}} onKeyDown={event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();setPaused(true);viewport.current?.focus({preventScroll:true});go(center+(event.key==='ArrowRight'?1:-1));}}}>
 {profiles.length>1&&!reduced&&<button type="button" data-autoplay-control className={styles.accessiblePlayback} onClick={()=>setPaused(value=>!value)}>{paused?'Resume team carousel':'Pause team carousel'}</button>}
 <div ref={viewport} className={styles.viewport} tabIndex={0} aria-label="Drag, swipe or use arrow keys to browse team profiles" data-dragging={dragging} onScroll={event=>{if(event.currentTarget.dataset.groupCentered==='true')return;const card=event.currentTarget.querySelector<HTMLElement>('[data-profile-index]');if(!card)return;const index=Math.max(0,Math.min(profiles.length-1,Math.round(event.currentTarget.scrollLeft/(card.offsetWidth+12))));centerRef.current=index;setCenter(index);}} onPointerDown={start} onPointerMove={follow} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={event=>{if(event.target===event.currentTarget)end(event);}} onClickCapture={event=>{if(suppress.current){event.preventDefault();event.stopPropagation();suppress.current=false;}}}>
 {profiles.map((profile,index)=><div key={profile.slug} data-profile-index={index} data-center={center===index} data-distance={Math.min(2,Math.abs(center-index))} className={styles.slide} role="group" aria-roledescription="slide" aria-label={`${index+1} of ${profiles.length}: ${profile.title}`} inert={!visible.includes(index)} aria-hidden={!visible.includes(index)} onClick={event=>{if(!(event.target as HTMLElement).closest('button,a')&&index!==center){go(index);}}}>{renderProfile(profile)}</div>)}
 </div><p className={styles.status} aria-live="polite">{profiles[center]?.title}, {center+1} of {profiles.length}</p>
 </div>;
}
