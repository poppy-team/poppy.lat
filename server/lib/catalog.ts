import { courseTracks, lessonRoute } from '../../site/.vitepress/theme/data/courses.ts';

/**
 * The lessons that exist, read from the same catalogue that draws the site.
 * The API only accepts ids that are in it, so a made-up id can never reach
 * the database. An id is the route without the area prefix:
 * `pensar-em-codigo/primeiro-programa/ola`.
 */
const prefix = '/aprender/';

function build() {
  const all = new Set<string>();
  const available = new Set<string>();

  for (const track of courseTracks) {
    for (const course of track.courses) {
      for (const module of course.modules) {
        for (const lesson of module.lessons) {
          const id = lessonRoute(course, module, lesson).slice(prefix.length);

          all.add(id);

          if (lesson.status === 'available') {
            available.add(id);
          }
        }
      }
    }
  }

  return { all, available };
}

const catalog = build();

export function isLessonId(id: string): boolean {
  return catalog.available.has(id);
}

export function lessonIds(): string[] {
  return [...catalog.available];
}
