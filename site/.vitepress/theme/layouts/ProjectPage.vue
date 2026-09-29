<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import { importedDocs } from 'virtual:imported-docs';
import { getProjectBySlug, localeRoot, type Locale } from '@poppy/project-data';
import ProjectBadge from '../components/ProjectBadge.vue';
import { groupDocs } from '../docs-groups';
import { pageCount } from '../format';

const { frontmatter } = useData();

const locale = computed<Locale>(() => (frontmatter.value.locale === 'en' ? 'en' : 'pt-BR'));
const en = computed(() => locale.value === 'en');
const project = computed(() => getProjectBySlug(String(frontmatter.value.project ?? '')));
const copy = computed(() => project.value?.copy[locale.value]);
const docsHref = computed(() => (project.value ? `${localeRoot(locale.value)}/${project.value.slug}/docs/` : ''));
const groups = computed(() =>
  project.value ? groupDocs(importedDocs[project.value.slug] ?? [], project.value.slug, locale.value) : [],
);
</script>

<template>
  <article v-if="project && copy" id="main-content" class="project-page" :data-project="project.slug" tabindex="-1">
    <header class="project-page__hero">
      <p class="project-page__topline">
        <a :href="`${localeRoot(locale)}/#projects`">{{ en ? 'Projects' : 'Projetos' }}</a>
        <span aria-hidden="true">/</span>
        <span>{{ project.number }} · {{ project.category[locale] }}</span>
      </p>
      <h1 id="project-title" class="project-page__title">
        {{ project.name }}<span class="project-page__period">.</span>
      </h1>
      <ProjectBadge :badge="project.badge" />
      <p class="project-page__summary">{{ copy.summary }}</p>

      <p class="project-page__links">
        <a class="button-link button-link--dark" :href="docsHref">
          {{ en ? 'Read the documentation' : 'Ler a documentação' }}
        </a>
        <a class="button-link button-link--light" :href="project.repositoryHref" rel="noopener">
          {{ en ? 'Repository' : 'Repositório' }} ↗
        </a>
      </p>
    </header>

    <div class="project-page__body">
      <section class="project-section" aria-labelledby="purpose-title">
        <header class="project-section__aside">
          <p class="project-section__index">01</p>
          <p class="eyebrow">{{ en ? 'The question' : 'A pergunta' }}</p>
        </header>
        <div class="project-section__content">
          <h2 id="purpose-title" class="project-section__title">{{ copy.purposeTitle }}</h2>
          <p class="project-section__lead">{{ copy.purpose }}</p>
        </div>
      </section>

      <section class="project-section" aria-labelledby="philosophy-title">
        <header class="project-section__aside">
          <p class="project-section__index">02</p>
          <p class="eyebrow">{{ en ? 'A few coordinates' : 'Algumas coordenadas' }}</p>
        </header>
        <div class="project-section__content">
          <h2 id="philosophy-title" class="project-section__title">{{ copy.philosophyTitle }}</h2>
          <ol class="principle-list">
            <li v-for="(principle, index) in copy.principles" :key="principle.title" class="principle-list__item">
              <span class="principle-list__number">{{ String(index + 1).padStart(2, '0') }}</span>
              <h3 class="principle-list__title">{{ principle.title }}</h3>
              <p class="principle-list__description">{{ principle.description }}</p>
            </li>
          </ol>
        </div>
      </section>

      <section class="project-section" aria-labelledby="demo-title">
        <header class="project-section__aside">
          <p class="project-section__index">03</p>
          <p class="eyebrow">{{ en ? 'A static sample' : 'Uma amostra estática' }}</p>
        </header>
        <div class="project-section__content">
          <h2 id="demo-title" class="project-section__title">{{ copy.demoTitle }}</h2>
          <figure class="code-plate">
            <figcaption class="code-plate__caption">
              {{ copy.demo.label }}
              <span class="code-plate__language">{{ copy.demo.language }}</span>
            </figcaption>
            <pre><code :class="`language-${copy.demo.language}`">{{ copy.demo.code }}</code></pre>
            <p class="code-plate__output">{{ copy.demo.output }}</p>
          </figure>
          <p class="project-page__note">{{ copy.demo.note }}</p>
        </div>
      </section>

      <section v-if="groups.length" class="project-section project-docs" aria-labelledby="project-docs-title">
        <header class="project-section__aside">
          <p class="project-section__index">04</p>
          <p class="eyebrow">{{ en ? 'Documentation' : 'Documentação' }}</p>
        </header>
        <div class="project-section__content">
          <h2 id="project-docs-title" class="project-section__title">
            {{ en ? 'Read the guides' : 'Leia os guias' }}
          </h2>

          <div v-for="group in groups" :key="group.slug" class="project-docs__group">
            <h3 class="project-docs__category">
              <a :href="group.href">{{ group.label }}</a>
              <span class="project-docs__count">{{ pageCount(group.count, locale) }}</span>
            </h3>
            <p class="project-docs__description">{{ group.description }}</p>
            <div v-for="section in group.sections" :key="section.slug" class="project-docs__section">
              <h4 v-if="group.sections.length > 1" class="project-docs__section-title">{{ section.label }}</h4>
              <ul class="project-docs__list">
                <li v-for="page in section.pages" :key="page.route">
                  <a :href="page.route">{{ page.title }}</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  </article>
</template>
