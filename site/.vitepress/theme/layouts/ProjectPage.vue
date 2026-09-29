<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import {
  docsCategories,
  getDocsForProject,
  getProjectBySlug,
  siteCopy,
  type Locale,
} from '@poppy/project-data';
import ProjectBadge from '../components/ProjectBadge.vue';

const { frontmatter } = useData();

const locale = computed<Locale>(() => {
  const declared = frontmatter.value.locale;

  return declared === 'en' ? 'en' : 'pt-BR';
});

const project = computed(() => getProjectBySlug(String(frontmatter.value.project ?? '')));
const copy = computed(() => project.value?.copy[locale.value]);
const category = computed(() => project.value?.category[locale.value]);
const categories = computed(() => docsCategories[locale.value]);
const pages = computed(() => (project.value ? getDocsForProject(project.value.slug) : []));

const grouped = computed(() =>
  categories.value
    .map((categoryDefinition) => ({
      ...categoryDefinition,
      pages: pages.value.filter((page) => page.category === categoryDefinition.slug),
    }))
    .filter((group) => group.pages.length > 0),
);
</script>

<template>
    <article v-if="project && copy" class="project-page" :data-project="project.slug">
    <p class="project-page__topline">
      <span class="project-page__category">{{ category }} · {{ project.number }}</span>
    </p>

    <header class="project-page__hero">
      <ProjectBadge :badge="project.badge" />
      <h1 id="project-title" class="project-page__title">
        {{ project.name }}<span class="project-page__period">.</span>
      </h1>
      <p class="project-page__summary">{{ copy.summary }}</p>

      <div class="project-page__links">
        <a class="button-link button-link--dark" :href="project.repositoryHref" rel="noopener">
          {{ locale === 'en' ? 'Project repository' : 'Repositório do projeto' }} ↗
        </a>
        <a class="button-link button-link--light" :href="`/${locale === 'en' ? 'en/' : ''}${project.slug}/docs/`">
          {{ copy.documentationLabel }}
        </a>
      </div>
    </header>

    <div class="project-page__body">
      <section class="project-section" aria-labelledby="purpose-title">
        <p class="project-section__index">01</p>
        <p class="eyebrow">{{ locale === 'en' ? 'The question' : 'A pergunta' }}</p>
        <h2 id="purpose-title">{{ copy.purposeTitle }}</h2>
        <p>{{ copy.purpose }}</p>
      </section>

      <section class="project-section" aria-labelledby="philosophy-title">
        <p class="project-section__index">02</p>
        <p class="eyebrow">{{ locale === 'en' ? 'A few coordinates' : 'Algumas coordenadas' }}</p>
        <h2 id="philosophy-title">{{ copy.philosophyTitle }}</h2>
        <ol class="principle-list">
          <li v-for="(principle, index) in copy.principles" :key="principle.title" class="principle-list__item">
            <span class="principle-list__number">{{ String(index + 1).padStart(2, '0') }}</span>
            <h3>{{ principle.title }}</h3>
            <p>{{ principle.description }}</p>
          </li>
        </ol>
      </section>

      <section class="project-section" aria-labelledby="demo-title">
        <p class="project-section__index">03</p>
        <p class="eyebrow">{{ locale === 'en' ? 'A static sample' : 'Uma amostra estática' }}</p>
        <h2 id="demo-title">{{ copy.demoTitle }}</h2>
        <figure class="code-plate">
          <figcaption class="code-plate__caption">
            {{ copy.demo.label }}
            <span class="code-plate__language">{{ copy.demo.language }}</span>
          </figcaption>
          <pre><code :class="`language-${copy.demo.language}`">{{ copy.demo.code }}</code></pre>
          <p class="code-plate__output">{{ copy.demo.output }}</p>
        </figure>
        <p class="project-page__note">{{ copy.demo.note }}</p>
      </section>

      <section v-if="grouped.length" class="project-section project-docs" aria-labelledby="project-docs-title">
        <p class="project-section__index">04</p>
        <p class="eyebrow">{{ locale === 'en' ? 'Selected documentation' : 'Documentação selecionada' }}</p>
        <h2 id="project-docs-title">
          {{ locale === 'en' ? 'Read the guides' : 'Leia os guias' }}
        </h2>

        <div v-for="group in grouped" :key="group.slug" class="project-docs__group">
          <h3 class="project-docs__category">{{ group.label }}</h3>
          <p class="project-docs__description">{{ group.description }}</p>
          <ul class="docs-card-list">
            <li v-for="page in group.pages" :key="page.slug" class="docs-card">
              <a
                class="docs-card__link"
                :href="`/${locale === 'en' ? 'en/' : ''}${project.slug}/docs/${group.slug}/${page.slug}`"
              >
                <span class="docs-card__title">{{ page.title[locale] }}</span>
                <span class="docs-card__description">{{ page.description[locale] }}</span>
              </a>
            </li>
          </ul>
        </div>
      </section>
    </div>
  </article>
</template>
