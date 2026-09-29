<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import { projects, type Locale, type Project } from '@poppy/project-data';
import { importedDocs } from 'virtual:imported-docs';
import ProjectBadge from '../components/ProjectBadge.vue';
import { data as posts } from '../data/posts.data';
import { formatDate, pageCount } from '../format';

const { frontmatter } = useData();

const locale = computed<Locale>(() => (frontmatter.value.locale === 'en' ? 'en' : 'pt-BR'));
const featured = computed<Project[]>(() => projects.filter((project) => project.featured));
const secondary = computed<Project[]>(() => projects.filter((project) => !project.featured));
const root = computed(() => (locale.value === 'en' ? '/en' : ''));
const en = computed(() => locale.value === 'en');

const documentation = computed(() =>
  projects.map((project) => ({
    project,
    count: (importedDocs[project.slug] ?? []).filter((page) => page.locale === locale.value).length,
  })),
);

const latestPosts = computed(() => posts.filter((post) => post.locale === locale.value).slice(0, 3));
</script>

<template>
  <div id="main-content" class="home" tabindex="-1">
    <section class="hero">
      <p class="eyebrow">{{ en ? 'Poppy Team · research & tools' : 'Poppy Team · pesquisa e ferramentas' }}</p>
      <h1 class="hero__title">
        {{ en ? 'Ideas that stay readable.' : 'Ideias que continuam legíveis.' }}
      </h1>
      <p class="hero__intro">
        {{
          en
            ? 'We build programming languages and tools for people who read code as carefully as they write it.'
            : 'Construímos linguagens de programação e ferramentas para quem lê código com o mesmo cuidado com que escreve.'
        }}
      </p>
      <p class="hero__actions">
        <a class="button-link button-link--dark" :href="`${root}/#projects`">
          {{ en ? 'See the projects' : 'Conhecer os projetos' }}
        </a>
        <a class="button-link button-link--light" :href="`${root}/#docs`">
          {{ en ? 'Read the documentation' : 'Ler a documentação' }}
        </a>
      </p>
    </section>

    <section id="projects" class="home-section" aria-labelledby="projects-title">
      <header class="section-header">
        <p class="section-header__index">01</p>
        <div>
          <h2 id="projects-title" class="section-header__title">
            {{ en ? 'Featured projects' : 'Projetos em destaque' }}
          </h2>
          <p class="section-header__lead">
            {{
              en
                ? 'Two languages in active development, each with its own documentation.'
                : 'Duas linguagens em desenvolvimento ativo, cada uma com sua própria documentação.'
            }}
          </p>
        </div>
      </header>

      <div class="featured-grid">
        <article
          v-for="project in featured"
          :key="project.slug"
          class="project-feature"
          :class="`project-feature--${project.slug}`"
          :data-project="project.slug"
        >
          <p class="project-feature__header">
            <span class="project-feature__number">{{ project.number }}</span>
            <span class="project-feature__category">{{ project.category[locale] }}</span>
          </p>

          <div class="project-feature__body">
            <h3 class="project-feature__title">
              <!-- The title link covers the whole card, so any point of it opens the project. -->
              <a class="card-link" :href="`${root}/projects/${project.slug}/`">{{ project.name }}</a>
            </h3>
            <ProjectBadge :badge="project.badge" />
            <p class="project-feature__summary">{{ project.homeSummary[locale] }}</p>
          </div>

          <pre v-if="project.excerpt" class="project-feature__code" aria-hidden="true"><code>{{ project.excerpt }}</code></pre>

          <p class="project-feature__links">
            <span class="project-feature__cta">
              {{ en ? 'View the project' : 'Ver o projeto' }} <span aria-hidden="true">→</span>
            </span>
            <a class="project-feature__docs" :href="`${root}/${project.slug}/docs/`">
              {{ en ? 'Documentation' : 'Documentação' }}
            </a>
          </p>
        </article>
      </div>
    </section>

    <section class="home-section" aria-labelledby="others-title">
      <header class="section-header">
        <p class="section-header__index">02</p>
        <div>
          <h2 id="others-title" class="section-header__title">
            {{ en ? 'Also from the team' : 'Também da equipe' }}
          </h2>
          <p class="section-header__lead">
            {{ en ? 'The tools we use to build the languages.' : 'As ferramentas que usamos para construir as linguagens.' }}
          </p>
        </div>
      </header>

      <ul class="secondary-list">
        <li
          v-for="project in secondary"
          :key="project.slug"
          class="secondary-project"
          :data-project="project.slug"
        >
          <span class="secondary-project__swatch" aria-hidden="true" />
          <div class="secondary-project__body">
            <h3 class="secondary-project__name">
              <a class="card-link" :href="`${root}/projects/${project.slug}/`">{{ project.name }}</a>
            </h3>
            <p class="secondary-project__category">{{ project.category[locale] }}</p>
          </div>
          <p class="secondary-project__summary">{{ project.homeSummary[locale] }}</p>
          <span class="secondary-project__arrow" aria-hidden="true">→</span>
        </li>
      </ul>
    </section>

    <section id="docs" class="home-section" aria-labelledby="docs-title">
      <header class="section-header">
        <p class="section-header__index">03</p>
        <div>
          <h2 id="docs-title" class="section-header__title">
            {{ en ? 'Documentation' : 'Documentação' }}
          </h2>
          <p class="section-header__lead">
            {{
              en
                ? 'Guides and references for each project, copied from its canonical repository.'
                : 'Guias e referências de cada projeto, copiados do repositório canônico.'
            }}
          </p>
        </div>
      </header>

      <ul class="docs-index">
        <li v-for="entry in documentation" :key="entry.project.slug" class="docs-index__item" :data-project="entry.project.slug">
          <a class="docs-index__link" :href="`${root}/${entry.project.slug}/docs/`">
            <span class="docs-index__name">{{ entry.project.name }}</span>
            <span class="docs-index__meta">{{ entry.project.category[locale] }} · {{ pageCount(entry.count, locale) }}</span>
          </a>
        </li>
      </ul>
    </section>

    <section v-if="latestPosts.length" class="home-section" aria-labelledby="journal-title">
      <header class="section-header">
        <p class="section-header__index">04</p>
        <div>
          <h2 id="journal-title" class="section-header__title">
            {{ en ? 'From the journal' : 'Do caderno' }}
          </h2>
          <p class="section-header__lead">
            <a class="text-link" :href="`${root}/blog/`">{{ en ? 'All notes' : 'Todas as notas' }} →</a>
          </p>
        </div>
      </header>

      <ul class="post-list">
        <li v-for="post in latestPosts" :key="post.url" class="post-list__item">
          <time class="post-list__date" :datetime="post.date">{{ formatDate(post.date, locale) }}</time>
          <div>
            <h3 class="post-list__title"><a class="card-link" :href="post.url">{{ post.title }}</a></h3>
            <p class="post-list__description">{{ post.description }}</p>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>
