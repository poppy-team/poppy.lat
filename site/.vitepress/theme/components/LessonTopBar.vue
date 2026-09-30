<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vitepress';
import AccountMenu from '../accounts/AccountMenu.vue';
import { coursesRoot, lessonAt } from '../data/courses';
import CourseOutline from './CourseOutline.vue';
import ReadingPreferences from './ReadingPreferences.vue';

/**
 * The bar of a lesson. It is not the site navbar: lessons have a header of
 * their own so a reader never mistakes a lesson for a documentation page. It
 * carries only what helps while studying: the course contents, where you are,
 * and the reading controls. The rest of the site is one tap away inside the
 * contents panel.
 */
const route = useRoute();
const place = computed(() => lessonAt(route.path));
const outline = ref(false);
const menu = ref<HTMLButtonElement | null>(null);

function closeOutline(): void {
  outline.value = false;
  menu.value?.focus();
}
</script>

<template>
  <header class="lesson-top">
    <div class="lesson-top__inner">
      <button
        ref="menu"
        type="button"
        class="lesson-top__menu"
        :aria-expanded="outline"
        aria-controls="course-outline"
        @click="outline = !outline"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
        <span>Conteúdo</span>
      </button>

      <a class="lesson-top__brand" :href="`${coursesRoot}/`">
        <img class="wordmark__logo wordmark__logo--light" src="/assets/poppy-logo.svg" alt="" width="26" height="26" decoding="async" />
        <img class="wordmark__logo wordmark__logo--dark" src="/assets/poppy-logo-dark.svg" alt="" width="26" height="26" decoding="async" />
        <span>Aprender</span>
      </a>

      <nav v-if="place" class="lesson-top__trail" aria-label="Onde você está">
        <a :href="`${coursesRoot}/#${place.course.slug}`">{{ place.course.title }}</a>
        <span aria-hidden="true">›</span>
        <span>{{ place.module.title }}</span>
      </nav>

      <div class="lesson-top__end">
        <ReadingPreferences />
        <AccountMenu />
      </div>
    </div>
  </header>

  <!-- Outside the sticky header, so the panel stacks above the tab bar and the notes button. -->
  <CourseOutline :open="outline" @close="closeOutline" />
</template>
