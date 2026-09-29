<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import type { Locale } from '@poppy/project-data';
import DocsProjectHeader from './DocsProjectHeader.vue';
import ProjectSwitcher from './ProjectSwitcher.vue';

/**
 * The project bar over a documentation page: which project this is, a way
 * back to it and to its repository, and the switch to the other projects.
 */
const { frontmatter, lang } = useData();

const locale = computed<Locale>(() => (lang.value.startsWith('en') ? 'en' : 'pt-BR'));
const project = computed(() =>
  typeof frontmatter.value.project === 'string' ? frontmatter.value.project : '',
);
</script>

<template>
  <div id="main-content" class="docs-bar" tabindex="-1">
    <DocsProjectHeader v-if="project" :project="project" :locale="locale" />
    <ProjectSwitcher :locale="locale" :current="project" />
  </div>
</template>
