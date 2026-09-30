<script setup lang="ts">
import CommentsSection from '../accounts/CommentsSection.vue';
import { computed } from 'vue';
import { useRoute } from 'vitepress';
import { coursesRoot, lessonAt, lessonRoute } from '../data/courses';
import { isCompleted, setCompleted, useCourseState } from '../course-state';

/**
 * The end of every lesson: mark it done, and tell us when something was
 * confusing. Feedback opens a GitHub issue already naming the lesson, so the
 * course can keep improving from what readers actually hit.
 */
const route = useRoute();
useCourseState();

const place = computed(() => lessonAt(route.path));
const current = computed(() =>
  place.value ? lessonRoute(place.value.course, place.value.module, place.value.lesson) : '',
);
const done = computed(() => isCompleted(current.value));

/** The lessons of this course that exist, in reading order, to find the neighbours of this one. */
const neighbours = computed(() => {
  const here = place.value;

  if (!here) {
    return { previous: undefined, next: undefined };
  }

  const written = here.course.modules.flatMap((module) =>
    module.lessons
      .filter((lesson) => lesson.status === 'available')
      .map((lesson) => ({ title: lesson.title, route: lessonRoute(here.course, module, lesson) })),
  );
  const index = written.findIndex((item) => item.route === current.value);

  return { previous: written[index - 1], next: written[index + 1] };
});

const feedbackHref = computed(() => {
  const title = `Aprender: ${place.value?.lesson.title ?? ''}`;
  const body = `Lição: https://poppy.lat${current.value}\n\nO que ficou confuso ou pode melhorar?\n\n`;

  return `https://github.com/poppy-team/poppy.lat/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
});
</script>

<template>
  <section v-if="place" class="lesson-footer" aria-label="Fim da lição">
    <button type="button" class="lesson-footer__done" :aria-pressed="done" @click="setCompleted(current, !done)">
      {{ done ? '✓ Lição concluída' : 'Marcar como concluída' }}
    </button>
    <nav class="lesson-pager" aria-label="Outras lições do curso">
      <a v-if="neighbours.previous" class="lesson-pager__link lesson-pager__link--previous" :href="neighbours.previous.route">
        <span class="lesson-pager__hint">Lição anterior</span>
        <span class="lesson-pager__title">{{ neighbours.previous.title }}</span>
      </a>
      <a v-if="neighbours.next" class="lesson-pager__link lesson-pager__link--next" :href="neighbours.next.route">
        <span class="lesson-pager__hint">Próxima lição</span>
        <span class="lesson-pager__title">{{ neighbours.next.title }}</span>
      </a>
      <a v-else class="lesson-pager__link lesson-pager__link--next lesson-pager__link--end" :href="`${coursesRoot}/#${place.course.slug}`">
        <span class="lesson-pager__hint">Fim das lições por enquanto</span>
        <span class="lesson-pager__title">Voltar ao curso {{ place.course.title }}</span>
      </a>
    </nav>
    <p class="lesson-footer__feedback">
      Algo ficou confuso? <a :href="feedbackHref" target="_blank" rel="noreferrer">Conte para a gente</a>. Cada
      lição é revisada a partir dessas mensagens.
    </p>
    <CommentsSection />
  </section>
</template>
