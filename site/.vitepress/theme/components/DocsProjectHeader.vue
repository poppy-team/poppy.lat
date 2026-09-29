<script setup lang="ts">
import { computed } from 'vue';
import { getProjectBySlug, projectPageHref, type Locale } from '@poppy/project-data';

const props = defineProps<{
  project: string;
  locale: Locale;
}>();

const project = computed(() => getProjectBySlug(props.project));
</script>

<template>
  <div v-if="project" class="docs-project" :data-project="project.slug">
    <a class="docs-project__identity" :href="projectPageHref(project, locale)">
      <span class="docs-project__swatch" aria-hidden="true" />
      <span class="docs-project__name">{{ project.name }}</span>
      <span class="docs-project__category">{{ project.category[locale] }}</span>
    </a>
    <span class="docs-project__links">
      <a :href="projectPageHref(project, locale)">
        {{ locale === 'en' ? 'About the project' : 'Sobre o projeto' }}
      </a>
      <a :href="project.repositoryHref" rel="noopener">
        {{ locale === 'en' ? 'Repository' : 'Repositório' }} ↗
      </a>
    </span>
  </div>
</template>
