<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import type { Locale } from '@poppy/project-data';
import SiteChrome from '../components/SiteChrome.vue';
import SiteFooter from '../components/SiteFooter.vue';

const { frontmatter } = useData();
const locale = computed<Locale>(() => (frontmatter.value.locale === 'en' ? 'en' : 'pt-BR'));
const date = computed(() => {
  const raw = frontmatter.value.pubDate;

  if (typeof raw !== 'string') {
    return '';
  }

  return new Intl.DateTimeFormat(locale.value, { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(raw),
  );
});
</script>

<template>
  <div class="site-page">
    <SiteChrome />

    <article class="article-page">
    <header class="article-page__header">
      <h1>{{ frontmatter.title }}</h1>
      <p v-if="date" class="article-page__date">
        <time :datetime="String(frontmatter.pubDate)">{{ date }}</time>
      </p>
      <p v-if="frontmatter.description" class="article-page__description">{{ frontmatter.description }}</p>
    </header>

    <div class="article-content">
      <Content />
    </div>
  </article>

    <SiteFooter />
  </div>
</template>
