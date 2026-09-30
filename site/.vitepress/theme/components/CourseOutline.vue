<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute } from 'vitepress';
import { courseTracks, coursesRoot, lessonAt, lessonRoute } from '../data/courses';
import { isCompleted, useCourseState } from '../course-state';

/**
 * The contents of every course, in a panel that slides in from the left. It
 * shows the whole map: what is done, where you are, and what is still to come,
 * so nobody has to guess how long the road is. The course being read is open;
 * the others are one tap away. Closing returns focus to the button that
 * opened it.
 */
const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const route = useRoute();
const state = useCourseState();
const panel = ref<HTMLElement | null>(null);

const current = computed(() => lessonAt(route.path));
const currentRoute = computed(() =>
  current.value ? lessonRoute(current.value.course, current.value.module, current.value.lesson) : '',
);

const tracks = computed(() =>
  courseTracks.map((track) => ({
    ...track,
    courses: track.courses.map((course) => ({
      ...course,
      lessonCount: course.modules.reduce((sum, module) => sum + module.lessons.length, 0),
      done: course.modules.reduce(
        (sum, module) =>
          sum + module.lessons.filter((lesson) => state.value.completed.includes(lessonRoute(course, module, lesson))).length,
        0,
      ),
    })),
  })),
);

watch(
  () => props.open,
  async (value) => {
    document.documentElement.toggleAttribute('data-outline-open', value);

    if (value) {
      await nextTick();
      panel.value?.focus();
      panel.value?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ block: 'center' });
    }
  },
);

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    emit('close');

    return;
  }

  if (event.key !== 'Tab' || !panel.value) {
    return;
  }

  const focusable = [
    ...panel.value.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'),
  ].filter((element) => element.offsetParent !== null);
  const first = focusable[0];
  const last = focusable.at(-1);

  if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.value)) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}

const otherPlaces = [
  { href: '/#projects', label: 'Projetos' },
  { href: '/#docs', label: 'Documentação' },
  { href: '/blog/', label: 'Blog' },
];
</script>

<template>
  <div v-if="open" class="outline-backdrop" aria-hidden="true" @click="emit('close')" />

  <aside
    v-show="open"
    id="course-outline"
    ref="panel"
    class="outline"
    role="dialog"
    aria-modal="true"
    aria-labelledby="course-outline-title"
    tabindex="-1"
    @keydown="onKeydown"
  >
    <header class="outline__head">
      <h2 id="course-outline-title">Conteúdo dos cursos</h2>
      <button type="button" class="outline__close" @click="emit('close')">Fechar</button>
    </header>

    <div class="outline__body">
      <section v-for="track in tracks" :key="track.slug" class="outline__track" :aria-labelledby="`outline-${track.slug}`">
        <h3 :id="`outline-${track.slug}`">{{ track.title }}</h3>

        <details
          v-for="course in track.courses"
          :key="course.slug"
          class="outline__course"
          :open="current?.course.slug === course.slug || undefined"
        >
          <summary>
            <span class="outline__course-title">{{ course.title }}</span>
            <span class="outline__count">
              <template v-if="course.lessonCount">{{ course.done }}/{{ course.lessonCount }}</template>
              <template v-else>em breve</template>
            </span>
          </summary>

          <p v-if="!course.lessonCount" class="outline__soon">Este curso ainda está sendo escrito.</p>

          <div v-for="module in course.modules" :key="module.slug" class="outline__module">
            <h4>{{ module.title }}</h4>
            <ol v-if="module.lessons.length">
              <li v-for="lesson in module.lessons" :key="lesson.slug">
                <a
                  v-if="lesson.status === 'available'"
                  :href="lessonRoute(course, module, lesson)"
                  :aria-current="lessonRoute(course, module, lesson) === currentRoute ? 'page' : undefined"
                  :class="{ 'is-done': isCompleted(lessonRoute(course, module, lesson)) }"
                >
                  <span class="outline__mark" aria-hidden="true">{{ isCompleted(lessonRoute(course, module, lesson)) ? '✓' : '' }}</span>
                  <span>{{ lesson.title }}</span>
                  <span v-if="isCompleted(lessonRoute(course, module, lesson))" class="visually-hidden">(concluída)</span>
                </a>
                <span v-else class="outline__planned">
                  <span class="outline__mark" aria-hidden="true" />
                  <span>{{ lesson.title }} <em>(em breve)</em></span>
                </span>
              </li>
            </ol>
            <p v-else class="outline__soon">em breve</p>
          </div>
        </details>
      </section>
    </div>

    <footer class="outline__foot">
      <a :href="`${coursesRoot}/`">Todos os cursos</a>
      <span aria-hidden="true">·</span>
      <template v-for="(item, index) in otherPlaces" :key="item.href">
        <a :href="item.href">{{ item.label }}</a>
        <span v-if="index < otherPlaces.length - 1" aria-hidden="true">·</span>
      </template>
    </footer>
  </aside>
</template>
