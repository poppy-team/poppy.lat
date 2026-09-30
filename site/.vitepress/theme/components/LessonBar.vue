<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { onContentUpdated, useRoute } from 'vitepress';
import { lessonAt, lessonRoute } from '../data/courses';
import { applyCodeTab, syncCodeWrapButtons, useCourseState } from '../course-state';

/**
 * The head of every lesson, inside the lesson sheet: which lesson of the
 * module this is, a stepper with one mark per lesson (done, current, still to
 * come) and how long it takes. The same shape on every lesson, so nobody has
 * to look for it. Reading controls live in the lesson bar above.
 */
const route = useRoute();
const state = useCourseState();

const place = computed(() => lessonAt(route.path));

function enhanceCode(): void {
  applyCodeTab();
  syncCodeWrapButtons();
}

// Open every code group on the language the reader picked before, and give
// every code block its wrap button.
onMounted(enhanceCode);
onContentUpdated(enhanceCode);
watch(() => state.value.preferences.codeWrap, syncCodeWrapButtons);

// Remembered for "continue where you left off" on the course landing. Set
// after mount, once the stored state has been read, so it is not overwritten.
function rememberLesson(): void {
  const current = place.value;

  if (current) {
    state.value.lastLesson = lessonRoute(current.course, current.module, current.lesson);
  }
}

onMounted(rememberLesson);
watch(place, rememberLesson);

const steps = computed(() => {
  const current = place.value;

  if (!current) {
    return [];
  }

  return current.module.lessons.map((lesson) => {
    const route = lessonRoute(current.course, current.module, lesson);

    return {
      route,
      title: lesson.title,
      available: lesson.status === 'available',
      done: state.value.completed.includes(route),
    };
  });
});

const moduleProgress = computed(() => ({
  done: steps.value.filter((step) => step.done).length,
  total: steps.value.length,
}));
</script>

<template>
  <div id="main-content" class="lesson-head" role="region" aria-label="Sobre esta lição" tabindex="-1">
    <template v-if="place">
      <p class="lesson-head__kicker">
        <span>Lição {{ place.position }} de {{ place.module.lessons.length }}</span>
        <span aria-hidden="true">·</span>
        <span>{{ place.course.title }}</span>
      </p>

      <ol class="lesson-steps" :aria-label="`Lições do módulo: ${moduleProgress.done} de ${moduleProgress.total} concluídas`">
        <li v-for="(step, index) in steps" :key="step.route">
          <a
            v-if="step.available"
            :href="step.route"
            :class="{ 'is-done': step.done }"
            :aria-current="index + 1 === place.position ? 'step' : undefined"
            :aria-label="`Lição ${index + 1}: ${step.title}${step.done ? ' (concluída)' : ''}`"
            :title="step.title"
          />
          <span v-else class="is-soon" role="img" :aria-label="`Lição ${index + 1}: ${step.title} (em breve)`" :title="`${step.title} (em breve)`" />
        </li>
      </ol>

      <p class="lesson-head__meta">
        <span>cerca de {{ place.lesson.minutes }} min</span>
        <span aria-hidden="true">·</span>
        <span>{{ moduleProgress.done }} de {{ moduleProgress.total }} concluídas</span>
      </p>
    </template>

    <button
      v-if="state.preferences.focus"
      type="button"
      class="focus-exit"
      @click="state.preferences.focus = false"
    >
      Sair do modo foco
    </button>
  </div>
</template>
