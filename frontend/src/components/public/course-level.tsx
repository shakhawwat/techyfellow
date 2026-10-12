import styles from './academy-carousel.module.css';
export function CourseLevel({level}:{level?:string}){
 if(!level)return null;
 const tone=level==='beginner'?'beginner':level==='intermediate'?'intermediate':level==='expert'?'expert':'neutral';
 return <span className={styles.level} data-tone={tone}>{level}</span>;
}
