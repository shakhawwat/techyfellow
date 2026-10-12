'use client';
import { useEffect, useRef, useState } from 'react';
import { Film, FileText, Lock } from 'lucide-react';
import { apiBase } from '@/lib/admin/api';
import type { CourseLesson, LessonContent } from '@/lib/academy/contracts';
import styles from './academy-course-details.module.css';
function Playback({lesson}:{lesson:LessonContent}) {
 const embed=lesson.embedUrl??lesson.youtubePreview;
 const video=useRef<HTMLVideoElement>(null),iframe=useRef<HTMLIFrameElement>(null),[failed,setFailed]=useState(false);
 useEffect(()=>{const media=video.current,frame=iframe.current;if(media&&lesson.video)media.src=apiBase()+lesson.video;if(frame&&embed)frame.src=embed;
  return()=>{if(media){media.pause();media.removeAttribute('src');media.load();}if(frame)frame.src='about:blank';};
 },[lesson.video,embed]);
 return <>{lesson.demonstration&&<p className={styles.notice}>{lesson.demonstrationNotice??'Player demonstration only, not course instruction.'} {lesson.demonstrationSourceUrl&&<a href={lesson.demonstrationSourceUrl} target="_blank" rel="noopener noreferrer">Video source</a>}</p>}
 {lesson.description&&<p className={styles.description}>{lesson.description}</p>}
 {lesson.type==='video'&&!lesson.video&&!embed&&<p role="status">Video not supplied</p>}
 {lesson.video&&<video ref={video} controls playsInline preload="metadata" aria-label={`${lesson.title} video`} onError={()=>setFailed(true)}/>}
 {embed&&<div className={styles.preview}><iframe ref={iframe} title={lesson.demonstration?'Public player demonstration — not course instruction':`${lesson.title} video`} allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/></div>}
 {failed&&<p role="alert" className={styles.error}>Video is unavailable. Contact Academy for the supplied lesson media.</p>}
 {lesson.text&&<p className={styles.description}>{lesson.text}</p>}
 {!!lesson.resources.length&&<div className={styles.resources}>{lesson.resources.map(resource=><a key={resource.id} href={apiBase()+resource.path}>{resource.title} ↓</a>)}</div>}
 </>;
}
export function AcademyLessonViewer({lesson,modules,selectedId,busy,available,onSelect}:{lesson:LessonContent|null;modules:{id:string;title:string;lessons:CourseLesson[]}[];selectedId:string|null;busy:boolean;available:(item:CourseLesson)=>boolean;onSelect:(item:CourseLesson,event:React.MouseEvent<HTMLButtonElement>)=>void}) {
 return <div className={styles.lessonViewerLayout}><section aria-label="Selected lesson" className={styles.selectedLesson}>{busy?<p role="status">Loading lesson…</p>:lesson?<Playback key={lesson.id} lesson={lesson}/>:<p>Select an available lesson.</p>}</section>
 <nav aria-label="Lesson selection" className={styles.lessonSelection}>{modules.map(module=><section key={module.id}><h3>{module.title}</h3>{module.lessons.map(item=><button key={item.id} type="button" disabled={busy||!available(item)} aria-pressed={selectedId===item.id} onClick={event=>onSelect(item,event)}>{item.type==='video'?<Film aria-hidden="true"/>:<FileText aria-hidden="true"/>}<span>{item.title}<small>{!available(item)?'Enroll to access':item.type==='video'&&!item.hasVideo?'Video not supplied':item.demonstration?'Public demonstration':item.access==='public'?'Public introduction':'Available lesson'}</small></span>{!available(item)&&<Lock aria-label="Enroll to access"/>}</button>)}</section>)}</nav>
 </div>;
}
