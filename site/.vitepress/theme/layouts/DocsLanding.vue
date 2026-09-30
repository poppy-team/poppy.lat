<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import { getProjectBySlug, projectPageHref, type Locale } from '@poppy/project-data';
import { importedDocs } from 'virtual:imported-docs';
import ProjectSwitcher from '../components/ProjectSwitcher.vue';
import { groupDocs } from '../docs-groups';
import { pageCount } from '../format';

const { frontmatter } = useData();

const locale = computed<Locale>(() => (frontmatter.value.locale === 'en' ? 'en' : 'pt-BR'));
const project = computed(() => getProjectBySlug(String(frontmatter.value.project ?? '')));
const groups = computed(() =>
  project.value ? groupDocs(importedDocs[project.value.slug] ?? [], project.value.slug, locale.value) : [],
);

/** Sections show their first pages; the category page lists every one. */
const preview = 6;
</script>

<template>
  <main v-if="project" id="main-content" class="docs-landing" :data-project="project.slug" tabindex="-1">
    <header class="docs-hero">
      <ProjectSwitcher :locale="locale" :current="project.slug" />
      <p class="eyebrow">{{ project.category[locale] }}</p>
      <h1 class="docs-hero__title">
        {{ project.name }}
        <span class="docs-hero__suffix">{{ locale === 'en' ? 'documentation' : 'documentação' }}</span>
      </h1>
      <p class="docs-hero__summary">{{ project.homeSummary[locale] }}</p>
      <p class="docs-hero__links">
        <a class="button-link button-link--dark" :href="projectPageHref(project, locale)">
          {{ locale === 'en' ? 'About the project' : 'Sobre o projeto' }}
        </a>
        <a class="button-link button-link--light" :href="project.repositoryHref" rel="noopener">
          {{ locale === 'en' ? 'Repository' : 'Repositório' }} ↗
        </a>
      </p>
    </header>

    <section v-for="group in groups" :key="group.slug" class="docs-group">
      <header class="docs-group__header">
        <div>
          <h2 class="docs-group__title">{{ group.label }}</h2>
          <p class="docs-group__description">{{ group.description }}</p>
        </div>
        <a class="text-link" :href="group.href">
          {{ locale === 'en' ? 'All' : 'Todas as' }} {{ pageCount(group.count, locale) }} →
        </a>
      </header>

      <div class="docs-section-grid">
        <section v-for="section in group.sections" :key="section.slug" class="docs-section-card">
          <h3 class="docs-section-card__title">
            {{ group.sections.length > 1 ? section.label : group.label }}
            <span class="docs-section-card__count">{{ section.pages.length }}</span>
          </h3>
          <ul class="docs-section-card__list">
            <li v-for="page in section.pages.slice(0, preview)" :key="page.route">
              <a :href="page.route">{{ page.title }}</a>
            </li>
          </ul>
          <a
            v-if="section.pages.length > preview"
            class="docs-section-card__more"
            :href="`${group.href}#${section.slug}`"
          >
            {{ locale === 'en' ? `${section.pages.length - preview} more` : `Mais ${section.pages.length - preview}` }} →
          </a>
        </section>
      </div>
    </section>
  </main>
</template>
