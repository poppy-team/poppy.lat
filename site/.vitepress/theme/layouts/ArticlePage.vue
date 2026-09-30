<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import type { Locale } from '@poppy/project-data';
import { formatDate } from '../format';

const { frontmatter } = useData();
const locale = computed<Locale>(() => (frontmatter.value.locale === 'en' ? 'en' : 'pt-BR'));
const root = computed(() => (locale.value === 'en' ? '/en' : ''));
const iso = computed(() => {
  const raw: unknown = frontmatter.value.pubDate;

  if (raw instanceof Date) {
    return raw.toISOString().slice(0, 10);
  }

  return typeof raw === 'string' ? raw.slice(0, 10) : '';
});
</script>

<template>
  <main id="main-content" class="article-page" tabindex="-1">
    <header class="article-page__header">
      <a class="article-page__back" :href="`${root}/blog/`">
        <span aria-hidden="true">←</span> {{ locale === 'en' ? 'Journal' : 'Blog' }}
      </a>
      <h1 class="article-page__title">{{ frontmatter.title }}</h1>
      <p v-if="frontmatter.description" class="article-page__description">{{ frontmatter.description }}</p>
      <p v-if="iso" class="article-page__date">
        <time :datetime="iso">{{ formatDate(iso, locale) }}</time>
      </p>
    </header>

    <div class="article-content vp-doc">
      <Content />
    </div>
  </main>
</template>
