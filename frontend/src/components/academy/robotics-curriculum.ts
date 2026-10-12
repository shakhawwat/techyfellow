import { academyDemos } from '@/components/public/academy-demo-data';
import { courseVideo } from '@/components/public/academy-data';
import type { CourseLesson, LessonContent } from '@/lib/academy/contracts';

// Keep the existing Academy catalog, five module headings and all course pricing unchanged.
const course=academyDemos.find(item=>item.id==='academy-demo-robotics-iot')!;
const approvedDemo=courseVideo({slug:course.id,title:course.title,summary:course.description,publishedAt:'',demo:true});
const topics:[string,string,string][][]=[
 [
  ['robotics-introduction','Introduction to robotics and safe prototypes','Identify the input, control and output stages of a small robot. Review board connections, low-voltage power requirements and the limits of a supervised prototype. The robotics introduction video has not been supplied.'],
  ['safe-connections','Safe connections and a first program','Plan a breadboard circuit, check pin assignments and voltage compatibility, then outline a simple program that reads an input and controls an indicator.'],
 ],
 [
  ['sensor-inputs','Reading digital and analog sensors','Compare digital states with analog readings. Choose an appropriate input pin, record sensor observations and distinguish a raw reading from a calibrated measurement.'],
  ['sampling-noise','Sampling and noisy measurements','Inspect how sampling interval, wiring and environment affect a sensor reading. Record repeated observations and explain the limits of basic smoothing.'],
 ],
 [
  ['motor-drivers','Motor drivers and bounded movement','Explain why a motor needs a suitable driver and separate power considerations. Outline direction, speed and bounded movement commands before testing hardware.'],
  ['safe-stopping','Power budgets and safe stopping','Check the current requirements of the motor and controller, define a stop condition and plan how to respond to a stalled motor or an unexpected input.'],
 ],
 [
  ['device-messages','Device messages and sensor logging','Structure a small sensor message and record readings with timestamps. Compare local device communication with a simple data log and identify missing fields.'],
  ['connection-recovery','Handling missing data and connection failures','Define what the prototype should do when readings are stale or communication stops. Plan bounded retries and preserve a safe output state while recovering.'],
 ],
 [
  ['integrated-prototype','Combining sensing, output and a data log','Connect a sensor reading to a bounded output and a local log. Test each stage separately before running the complete low-voltage prototype.'],
  ['prototype-documentation','Documenting tests and limitations','Record circuit connections, program configuration and test conditions. Summarize observations, unresolved faults and limitations without claiming production readiness.'],
 ],
];
export const roboticsCurriculum=topics.map((lessons,index)=>({id:['circuit-foundations','sensor-observations','motion-control','connected-data','prototype-documentation'][index],title:course.modules[index].title,
 lessons:lessons.map(([id,title,description],lessonIndex):CourseLesson=>({id,title,description,type:'video',access:index===0&&lessonIndex===0?'public':'enrolled',hasVideo:index===0&&lessonIndex===0&&!!approvedDemo,demonstration:index===0&&lessonIndex===0,resourceCount:0}))}));
export function roboticsDemoLesson(id:string):LessonContent|undefined {
 const lesson=roboticsCurriculum.flatMap(module=>module.lessons).find(item=>item.id===id);
 if(!lesson||lesson.access!=='public'||!lesson.hasVideo)return;
 return {...lesson,youtubePreview:approvedDemo?.embedUrl,demonstrationNotice:roboticsDemoNotice,demonstrationSourceUrl:'https://www.3blue1brown.com/lessons/neural-networks/',resources:[]};
}
export const roboticsDemoNotice='Player demonstration only: the existing neural-network video is not robotics instruction. Robotics lesson videos have not been supplied.';
