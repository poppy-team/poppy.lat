<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vitepress';
import { lessonAt, lessonRoute } from '../data/courses';
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
    <p class="lesson-footer__feedback">
      Algo ficou confuso? <a :href="feedbackHref" target="_blank" rel="noreferrer">Conte para a gente</a>. Cada
      lição é revisada a partir dessas mensagens.
    </p>
  </section>
</template>
