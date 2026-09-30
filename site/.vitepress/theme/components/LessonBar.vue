<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { onContentUpdated, useRoute } from 'vitepress';
import { coursesRoot, lessonAt, lessonRoute } from '../data/courses';
import { applyCodeTab, useCourseState } from '../course-state';
import ReadingPreferences from './ReadingPreferences.vue';

/**
 * The fixed head of every lesson: where it sits, how long it takes, how far
 * the reader is in the module, and the reading controls. The same shape on
 * every lesson, so nobody has to look for it.
 */
const route = useRoute();
const state = useCourseState();

const place = computed(() => lessonAt(route.path));

// Open every code group on the language the reader picked before.
onMounted(applyCodeTab);
onContentUpdated(applyCodeTab);

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

const moduleProgress = computed(() => {
  const current = place.value;

  if (!current) {
    return { done: 0, total: 0 };
  }

  const routes = current.module.lessons.map((lesson) => lessonRoute(current.course, current.module, lesson));

  return {
    done: routes.filter((item) => state.value.completed.includes(item)).length,
    total: routes.length,
  };
});
</script>

<template>
  <div id="main-content" class="lesson-bar" tabindex="-1">
    <nav v-if="place" class="lesson-bar__trail" aria-label="Onde você está">
      <a :href="`${coursesRoot}/`">Aprender</a>
      <span aria-hidden="true">›</span>
      <a :href="`${coursesRoot}/#${place.course.slug}`">{{ place.course.title }}</a>
      <span aria-hidden="true">›</span>
      <span>{{ place.module.title }}</span>
    </nav>

    <div v-if="place" class="lesson-bar__meta">
      <span class="lesson-bar__chip">Lição {{ place.position }} de {{ place.module.lessons.length }}</span>
      <span class="lesson-bar__chip">Cerca de {{ place.lesson.minutes }} minutos</span>
      <span class="lesson-bar__chip">Projeto: {{ place.module.project }}</span>
    </div>

    <div v-if="place" class="lesson-bar__progress">
      <progress
        :value="moduleProgress.done"
        :max="moduleProgress.total"
        :aria-label="`Progresso do módulo: ${moduleProgress.done} de ${moduleProgress.total} lições concluídas`"
      />
      <span class="lesson-bar__progress-text">
        {{ moduleProgress.done }} de {{ moduleProgress.total }} lições concluídas neste módulo
      </span>
    </div>

    <ReadingPreferences />
  </div>
</template>
