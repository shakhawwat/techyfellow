import { academyDemos } from '@/components/public/academy-demo-data';
import type { CourseLesson, LessonContent } from '@/lib/academy/contracts';
import { roboticsCurriculum, roboticsDemoLesson } from './robotics-curriculum';

// Adapt the existing course-specific syllabus; media is never inferred from a topic.
const curricula=new Map(academyDemos.map(course=>[course.id,course.id==='academy-demo-robotics-iot'?roboticsCurriculum:course.modules.map((module,moduleIndex)=>({
 id:`${course.id}-module-${moduleIndex+1}`,title:module.title,
 lessons:[...(moduleIndex===0?[{id:`${course.id}-introduction`,title:`Introduction to ${course.title}`,description:course.description,type:'video' as const,access:'public' as const,hasVideo:false,resourceCount:0}]:[]),
 ...module.topics.filter(topic=>topic.trim()).map((topic,topicIndex):CourseLesson=>({id:`${course.id}-m${moduleIndex+1}-lesson-${topicIndex+1}`,title:topic.trim().replace(/[.!?]$/,''),description:`${topic.trim()} Module: ${module.title}.`,type:'video',access:'enrolled',hasVideo:false,resourceCount:0}))]
}))]));
export function academyDemoCurriculum(courseId:string){return curricula.get(courseId)??[];}
export function academyDemoLesson(courseId:string,lessonId:string):LessonContent|undefined {
 if(courseId==='academy-demo-robotics-iot')return roboticsDemoLesson(lessonId);
 const lesson=academyDemoCurriculum(courseId).flatMap(module=>module.lessons).find(item=>item.id===lessonId);
 if(!lesson||lesson.access!=='public')return;
 return {...lesson,resources:[]};
}
