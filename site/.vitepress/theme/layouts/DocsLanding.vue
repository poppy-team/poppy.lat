<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import {
  docsCategories,
  getDocsForProject,
  getProjectBySlug,
  projectPageHref,
  type Locale,
} from '@poppy/project-data';

const { frontmatter } = useData();

const locale = computed<Locale>(() => (frontmatter.value.locale === 'en' ? 'en' : 'pt-BR'));
const project = computed(() => getProjectBySlug(String(frontmatter.value.project ?? '')));
const pages = computed(() => (project.value ? getDocsForProject(project.value.slug) : []));
const categories = computed(() => docsCategories[locale.value]);

const grouped = computed(() =>
  categories.value
    .map((category) => ({
      ...category,
      pages: pages.value.filter((page) => page.category === category.slug),
    }))
    .filter((group) => group.pages.length > 0),
);
</script>

<template>
    <div v-if="project" class="docs-landing" :data-project="project.slug">
    <header class="docs-landing__hero">
      <p class="eyebrow">{{ project.category[locale] }}</p>
      <h1>{{ project.name }}<span class="project-page__period">.</span></h1>
      <p class="docs-landing__summary">{{ project.copy[locale].homeSummary }}</p>
      <div class="docs-landing__links">
        <a class="button-link button-link--dark" :href="projectPageHref(project, locale)">
          {{ locale === 'en' ? 'About the project' : 'Sobre o projeto' }}
        </a>
        <a class="button-link button-link--light" :href="project.repositoryHref" rel="noopener">
          {{ locale === 'en' ? 'Repository' : 'Repositório' }} ↗
        </a>
      </div>
    </header>

    <section v-for="group in grouped" :key="group.slug" class="docs-landing__group">
      <h2 class="docs-landing__category">{{ group.label }}</h2>
      <p class="docs-landing__description">{{ group.description }}</p>
      <ul class="docs-card-list">
        <li v-for="page in group.pages" :key="page.slug" class="docs-card">
          <a class="docs-card__link" :href="`./${group.slug}/${page.slug}`">
            <span class="docs-card__title">{{ page.title[locale] }}</span>
            <span class="docs-card__description">{{ page.description[locale] }}</span>
          </a>
        </li>
      </ul>
    </section>
  </div>
</template>
