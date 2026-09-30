<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import { docsCategories, getProjectBySlug, localeRoot, type Locale } from '@poppy/project-data';
import { importedDocs } from 'virtual:imported-docs';
import ProjectSwitcher from '../components/ProjectSwitcher.vue';
import { groupDocs } from '../docs-groups';

const { frontmatter } = useData();

const locale = computed<Locale>(() => (frontmatter.value.locale === 'en' ? 'en' : 'pt-BR'));
const project = computed(() => getProjectBySlug(String(frontmatter.value.project ?? '')));
const groups = computed(() =>
  project.value ? groupDocs(importedDocs[project.value.slug] ?? [], project.value.slug, locale.value) : [],
);
const group = computed(() => groups.value.find((item) => item.slug === frontmatter.value.category));
const category = computed(() => docsCategories[locale.value].find((item) => item.slug === frontmatter.value.category));
const siblings = computed(() => groups.value.filter((item) => item.slug !== group.value?.slug));
</script>

<template>
  <main v-if="project && category" id="main-content" class="docs-landing" :data-project="project.slug" tabindex="-1">
    <header class="docs-hero docs-hero--compact">
      <ProjectSwitcher :locale="locale" :current="project.slug" />
      <p class="eyebrow">
        <a :href="`${localeRoot(locale)}/${project.slug}/docs/`">{{ project.name }}</a>
      </p>
      <h1 class="docs-hero__title">{{ category.label }}</h1>
      <p class="docs-hero__summary">{{ category.description }}</p>
    </header>

    <section v-for="section in group?.sections ?? []" :id="section.slug" :key="section.slug" class="docs-group">
      <h2 v-if="(group?.sections.length ?? 0) > 1" class="docs-group__title">{{ section.label }}</h2>
      <ul class="docs-page-list">
        <li v-for="page in section.pages" :key="page.route" class="docs-page-list__item">
          <a class="docs-page-list__link" :href="page.route">
            <span class="docs-page-list__title">{{ page.title }}</span>
            <span v-if="page.description" class="docs-page-list__description">{{ page.description }}</span>
          </a>
        </li>
      </ul>
    </section>

    <nav v-if="siblings.length" class="docs-siblings" :aria-label="category.label">
      <a v-for="sibling in siblings" :key="sibling.slug" class="docs-siblings__link" :href="sibling.href">
        <span class="docs-siblings__title">{{ sibling.label }} →</span>
        <span class="docs-siblings__description">{{ sibling.description }}</span>
      </a>
    </nav>
  </main>
</template>
