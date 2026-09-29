<script setup lang="ts">
import { computed } from 'vue';
import { getProjectBySlug, localeRoot, projectPageHref, siteCopy, type Locale } from '@poppy/project-data';

const props = defineProps<{
  project: string;
  locale: Locale;
}>();

const project = computed(() => getProjectBySlug(props.project));
const copy = computed(() => siteCopy[props.locale]);
</script>

<template>
  <aside v-if="project" class="docs-project" :data-project="project.slug">
    <a class="docs-project__back" :href="projectPageHref(project, locale)">
      <span class="docs-project__eyebrow">{{ project.name }}</span>
      <span class="docs-project__label">{{ project.category[locale] }}</span>
    </a>
    <a class="docs-project__source" :href="project.repositoryHref" rel="noopener">
      {{ copy.navigation.projects }} ↗
    </a>
    <a class="docs-project__switch" :href="`${localeRoot(locale)}/#projects`">
      {{ copy.navigation.projects }}
    </a>
  </aside>
</template>
