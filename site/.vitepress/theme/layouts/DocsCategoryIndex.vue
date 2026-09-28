<script setup lang="ts">
import { computed } from 'vue';
import { Content, useData } from 'vitepress';
import {
  docsCategories,
  getDocsForProject,
  getProjectBySlug,
  type Locale,
} from '@poppy/project-data';
import SiteChrome from '../components/SiteChrome.vue';
import SiteFooter from '../components/SiteFooter.vue';

const { frontmatter } = useData();

const locale = computed<Locale>(() => (frontmatter.value.locale === 'en' ? 'en' : 'pt-BR'));
const project = computed(() => getProjectBySlug(String(frontmatter.value.project ?? '')));
const category = computed(() => docsCategories[locale.value].find((item) => item.slug === frontmatter.value.category));

/** Only categories that actually have pages get an index route. */
const otherCategories = computed(() => {
  if (!project.value) {
    return [];
  }

  const populated = new Set(
    getDocsForProject(project.value.slug).map((page) => page.category),
  );

  return docsCategories[locale.value].filter(
    (item) => item.slug !== category.value?.slug && populated.has(item.slug),
  );
});
</script>

<template>
  <div class="site-page">
    <SiteChrome />

    <div v-if="project && category" class="docs-landing" :data-project="project.slug">
    <header class="docs-landing__hero">
      <p class="eyebrow">{{ project.name }}</p>
      <h1>{{ category.label }}</h1>
      <p class="docs-landing__summary">{{ category.description }}</p>
    </header>

    <Content />

    <nav class="docs-landing__siblings" :aria-label="category.label">
      <a
        v-for="sibling in otherCategories"
        :key="sibling.slug"
        class="docs-card docs-card--compact"
        :href="`../${sibling.slug}/`"
      >
        <span class="docs-card__title">{{ sibling.label }}</span>
        <span class="docs-card__description">{{ sibling.description }}</span>
      </a>
    </nav>
  </div>

    <SiteFooter />
  </div>
</template>
