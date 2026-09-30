<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { onContentUpdated, useRoute } from 'vitepress';
import { coursesRoot, lessonAt, lessonRoute } from '../data/courses';
import { applyCodeTab, syncCodeWrapButtons, useCourseState } from '../course-state';
import ReadingPreferences from './ReadingPreferences.vue';

/**
 * The head of every lesson: where it sits, how long it takes, how far the
 * reader is in the module, and the reading controls. The same shape on every
 * lesson, so nobody has to look for it. It is kept to two quiet lines and a
 * thin bar: the lesson itself starts right below.
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
      <a class="lesson-bar__up" :href="`${coursesRoot}/#${place.course.slug}`">
        <span aria-hidden="true">‹</span> {{ place.course.title }}
      </a>
      <a class="lesson-bar__root" :href="`${coursesRoot}/`">Aprender</a>
      <span class="lesson-bar__root" aria-hidden="true">›</span>
      <a class="lesson-bar__root" :href="`${coursesRoot}/#${place.course.slug}`">{{ place.course.title }}</a>
      <span class="lesson-bar__root" aria-hidden="true">›</span>
      <span class="lesson-bar__root">{{ place.module.title }}</span>
    </nav>

    <div class="lesson-bar__line">
      <p v-if="place" class="lesson-bar__meta">
        <span>Lição {{ place.position }} de {{ place.module.lessons.length }}</span>
        <span aria-hidden="true">·</span>
        <span>cerca de {{ place.lesson.minutes }} min</span>
      </p>
      <ReadingPreferences />
    </div>

    <div v-if="place" class="lesson-bar__progress">
      <progress
        :value="moduleProgress.done"
        :max="moduleProgress.total"
        :aria-label="`Progresso do módulo: ${moduleProgress.done} de ${moduleProgress.total} lições concluídas`"
      />
      <span class="lesson-bar__progress-text">{{ moduleProgress.done }} de {{ moduleProgress.total }} concluídas</span>
    </div>

    <p v-if="place" class="lesson-bar__project">Projeto do módulo: {{ place.module.project }}</p>

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
