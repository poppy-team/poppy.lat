<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import { projects, type Locale } from '@poppy/project-data';
import ProjectBadge from '../components/ProjectBadge.vue';

const { frontmatter } = useData();

const locale = computed<Locale>(() => (frontmatter.value.locale === 'en' ? 'en' : 'pt-BR'));
const featured = computed(() => projects.filter((project) => project.featured));
const secondary = computed(() => projects.filter((project) => !project.featured));
const root = computed(() => (locale.value === 'en' ? '/en' : ''));
</script>

<template>
  <div class="home">
    <section class="hero">
      <div class="hero__copy">
        <p class="eyebrow">Poppy Team</p>
        <h1 class="hero__title">
          {{ locale === 'en' ? 'Ideas that stay readable.' : 'Ideias que continuam legíveis.' }}
        </h1>
        <p class="hero__intro">
          {{
            locale === 'en'
              ? 'We build languages and tools for people who read code as carefully as they write it.'
              : 'Construímos linguagens e ferramentas para quem lê código com o mesmo cuidado com que escreve.'
          }}
        </p>
      </div>
    </section>

    <section class="featured-projects" aria-labelledby="projects-title">
      <h2 id="projects-title" class="section-heading">
        {{ locale === 'en' ? 'Featured projects' : 'Projetos em destaque' }}
      </h2>

      <div class="featured-grid">
        <article
          v-for="project in featured"
          :key="project.slug"
          class="project-feature"
          :class="`project-feature--${project.slug}`"
          :data-project="project.slug"
        >
          <p class="project-feature__header">
            <span class="project-feature__number">{{ project.number }} / 04</span>
            <span class="project-feature__category">{{ project.category[locale] }}</span>
          </p>

          <ProjectBadge :badge="project.badge" />

          <div class="project-feature__body">
            <h3 class="project-feature__title">
              <a :href="`${root}/projects/${project.slug}/`">{{ project.name }}</a>
            </h3>
            <p class="project-feature__summary">{{ project.homeSummary[locale] }}</p>
            <p class="project-feature__links">
              <a class="button-link button-link--dark" :href="`${root}/${project.slug}/docs/`">
                {{ locale === 'en' ? 'Read the documentation' : 'Ler a documentação' }}
              </a>
              <a class="project-feature__link" :href="`${root}/projects/${project.slug}/`">
                {{ locale === 'en' ? 'View the project' : 'Ver o projeto' }} →
              </a>
            </p>
          </div>
        </article>
      </div>
    </section>

    <section class="secondary-section" aria-labelledby="others-title">
      <h2 id="others-title" class="section-heading">
        {{ locale === 'en' ? 'Also from the team' : 'Também da equipe' }}
      </h2>

      <ul class="secondary-list">
        <li
          v-for="project in secondary"
          :key="project.slug"
          class="secondary-project"
          :data-project="project.slug"
        >
          <p class="secondary-project__number">{{ project.number }}</p>

          <div class="secondary-project__body">
            <h3 class="secondary-project__name">
              <a :href="`${root}/projects/${project.slug}/`">{{ project.name }}</a>
            </h3>
            <p class="secondary-project__category">{{ project.category[locale] }}</p>
            <p class="secondary-project__summary">{{ project.homeSummary[locale] }}</p>
          </div>

          <a
            class="secondary-project__arrow"
            :href="`${root}/projects/${project.slug}/`"
            :aria-label="locale === 'en' ? `Learn about ${project.name}` : `Conheça ${project.name}`"
          >
            →
          </a>
        </li>
      </ul>
    </section>

    <section class="closing-grid">
      <a class="closing-note closing-note--docs" :href="`${root}/#projects`">
        <span class="closing-grid__caption">
          {{ locale === 'en' ? 'Documentation' : 'Documentação' }}
        </span>
        <span>
          {{
            locale === 'en'
              ? 'Guides per project, imported from the canonical repositories.'
              : 'Guias por projeto, importados dos repositórios canônicos.'
          }}
        </span>
      </a>
    </section>
  </div>
</template>
