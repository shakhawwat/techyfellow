'use client';
import {Children,useCallback,useEffect,useRef,useState,type PointerEvent,type ReactNode} from 'react';
import {ArrowLeft,ArrowRight} from 'lucide-react';
import styles from './kit-carousel.module.css';
export function KitCarousel({children}:{children:ReactNode}){
 const cards=Children.toArray(children),count=cards.length;
 const viewport=useRef<HTMLDivElement>(null),gesture=useRef<{id:number;x:number;y:number;scroll:number;horizontal:boolean}|null>(null),suppress=useRef(false);
 const [visible,setVisible]=useState<number[]>([]),[position,setPosition]=useState(0),[maximum,setMaximum]=useState(0),[dragging,setDragging]=useState(false);
 useEffect(()=>{const element=viewport.current;if(!element)return;const resize=new ResizeObserver(()=>setMaximum(element.scrollWidth-element.clientWidth));resize.observe(element);const observer=new IntersectionObserver(items=>{setVisible(previous=>{const next=new Set(previous);for(const item of items){const index=Number((item.target as HTMLElement).dataset.index);if(item.intersectionRatio>=.9)next.add(index);else next.delete(index);}return [...next];});},{root:element,threshold:[0,.9,1]});element.querySelectorAll('[data-index]').forEach(card=>observer.observe(card));return()=>{observer.disconnect();resize.disconnect();};},[count]);
 const move=useCallback((direction:number,loop=false)=>{const element=viewport.current;if(!element)return;const card=element.querySelector<HTMLElement>('[data-index]');if(!card)return;const step=card.offsetWidth+16;const target=loop&&element.scrollLeft>=element.scrollWidth-element.clientWidth-1?0:Math.max(0,Math.min(element.scrollWidth-element.clientWidth,Math.round(element.scrollLeft/step)*step+direction*step));element.scrollTo({left:target,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});},[]);
 function manual(direction:number){move(direction);}
 function start(event:PointerEvent<HTMLDivElement>){if(event.button!==0||(event.target as HTMLElement).closest('button,a,input'))return;suppress.current=false;gesture.current={id:event.pointerId,x:event.clientX,y:event.clientY,scroll:event.currentTarget.scrollLeft,horizontal:false};}
 function follow(event:PointerEvent<HTMLDivElement>){const g=gesture.current;if(!g||g.id!==event.pointerId)return;const dx=event.clientX-g.x,dy=event.clientY-g.y;if(!g.horizontal){if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>8){gesture.current=null;return;}if(Math.abs(dx)<8)return;g.horizontal=true;event.currentTarget.setPointerCapture(event.pointerId);setDragging(true);}event.currentTarget.scrollLeft=g.scroll-dx;suppress.current=true;}
 function end(event:PointerEvent<HTMLDivElement>){const g=gesture.current;if(!g||g.id!==event.pointerId)return;gesture.current=null;setDragging(false);if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);const card=event.currentTarget.querySelector<HTMLElement>('[data-index]');if(g.horizontal&&card){const step=card.offsetWidth+16;event.currentTarget.scrollTo({left:Math.round(event.currentTarget.scrollLeft/step)*step,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}}

 return <div className={styles.carousel} role="region" aria-roledescription="carousel" aria-label="Concept kit previews" onKeyDown={event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();viewport.current?.focus({preventScroll:true});manual(event.key==='ArrowRight'?1:-1);}}}>
 <div className={styles.controls}>
 <button type="button" className={styles.arrow} aria-label="Previous kit" disabled={position<=1} onClick={()=>manual(-1)}><ArrowLeft aria-hidden="true"/></button>
 <button type="button" className={styles.arrow} aria-label="Next kit" disabled={position>=maximum-1} onClick={()=>manual(1)}><ArrowRight aria-hidden="true"/></button>
 </div>
 <div ref={viewport} className={styles.viewport} data-dragging={dragging} tabIndex={0} aria-label="Drag, swipe or use arrow keys to browse kits" onScroll={event=>setPosition(event.currentTarget.scrollLeft)} onPointerDown={start} onPointerMove={follow} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={event=>{if(event.target===event.currentTarget)end(event);}} onClickCapture={event=>{if(suppress.current){event.preventDefault();event.stopPropagation();suppress.current=false;}}}>
 {cards.map((card,index)=><div key={index} data-index={index} className={styles.slide} role="group" aria-roledescription="slide" aria-label={`${index+1} of ${count}`} inert={!visible.includes(index)} aria-hidden={!visible.includes(index)}>{card}</div>)}
 </div>

 </div>;
}
