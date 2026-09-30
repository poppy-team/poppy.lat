import { coursesRoot, lessonAt } from '../data/courses';

/** Where a comment thread lives: the lesson id the API stores, as a page address. */
export function lessonHref(lessonId: string): string {
  return `${coursesRoot}/${lessonId}#comments-title`;
}

/** The title of a lesson from the id the API stores, or a plain fallback. */
export function lessonTitle(lessonId: string): string {
  return lessonAt(`${coursesRoot}/${lessonId}`)?.lesson.title ?? 'uma aula';
}
