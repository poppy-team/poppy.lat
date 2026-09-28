<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import type { Locale } from '@poppy/project-data';
import SiteChrome from '../components/SiteChrome.vue';
import SiteFooter from '../components/SiteFooter.vue';

const { frontmatter } = useData();
const locale = computed<Locale>(() => (frontmatter.value.locale === 'en' ? 'en' : 'pt-BR'));
const root = computed(() => (locale.value === 'en' ? '/en' : ''));
</script>

<template>
  <div class="site-page">
    <SiteChrome />

    <div class="journal-page">
    <header class="journal-page__intro">
      <h1>{{ locale === 'en' ? 'Journal' : 'Caderno' }}</h1>
      <p>
        {{
          locale === 'en'
            ? 'Short notes on how the projects are built and why they are shaped this way.'
            : 'Notas curtas sobre como os projetos são construídos e por que têm esta forma.'
        }}
      </p>
    </header>

    <Content />
  </div>

    <SiteFooter />
  </div>
</template>
