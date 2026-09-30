<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
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

// Focus mode: a thin line shows how far down the lesson you are, and (if the
// reader wants it) only the passage near the middle of the screen stays at
// full strength, like a finger following the line.
const progress = ref(0);
let frame = 0;
let current: Element | undefined;

function markCurrentPassage(): void {
  const active = state.value.preferences.focus && state.value.preferences.focusRuler;
  const line = window.innerHeight * 0.4;
  let next: Element | undefined;

  if (active) {
    for (const block of document.querySelectorAll('.vp-doc > div > *')) {
      next = block;

      if (block.getBoundingClientRect().bottom >= line) {
        break;
      }
    }
  }

  if (next !== current) {
    current?.classList.remove('is-current');
    next?.classList.add('is-current');
    current = next;
  }
}

function updateReading(): void {
  frame = 0;

  const range = document.documentElement.scrollHeight - window.innerHeight;

  progress.value = range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0;
  markCurrentPassage();
}

function scheduleReading(): void {
  if (!frame) {
    frame = requestAnimationFrame(updateReading);
  }
}

onMounted(() => {
  window.addEventListener('scroll', scheduleReading, { passive: true });
  window.addEventListener('resize', scheduleReading);
  updateReading();
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', scheduleReading);
  window.removeEventListener('resize', scheduleReading);
  cancelAnimationFrame(frame);
});

watch(() => [state.value.preferences.focus, state.value.preferences.focusRuler, place.value], scheduleReading, { flush: 'post' });
onContentUpdated(scheduleReading);

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

    <div class="focus-progress" aria-hidden="true"><span :style="{ transform: `scaleX(${progress})` }" /></div>

    <Transition name="focus-tools">
      <div v-if="state.preferences.focus" class="focus-tools">
        <button type="button" class="focus-exit" @click="state.preferences.focus = false">Sair do modo foco</button>
        <label class="focus-ruler">
          <input v-model="state.preferences.focusRuler" type="checkbox" />
          Destacar o trecho
        </label>
      </div>
    </Transition>
  </div>
</template>
