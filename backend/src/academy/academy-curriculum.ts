import type { ContentRecord } from '../content/content.types';
import type { LearningCourse, Lesson } from './academy.schemas';

// Read-only placeholders from the published syllabus. No video, duration, price or enrollment is inferred.
export function syllabusCurriculum(course: ContentRecord): LearningCourse['modules'] {
    const syllabus = course.syllabus?.length ? course.syllabus : [{ title: 'Introduction', topics: [] }];
    return syllabus.map((module, index) => ({ id: `syllabus-module-${index + 1}`, title: module.title,
        lessons: [...(index === 0 ? [{ id: 'course-introduction', title: `Introduction to ${course.title}`,
            description: course.summary, type: 'video' as const, access: 'public' as const, resources: [] }] : []),
        ...module.topics.filter(topic => topic.trim()).map((topic, topicIndex): Lesson => ({
            id: `syllabus-module-${index + 1}-lesson-${topicIndex + 1}`, title: topic.trim().replace(/[.!?]$/, ''),
            description: `${topic.trim()} Module: ${module.title}.`, type: 'video', access: 'enrolled', resources: []
        }))]
    }));
}
