<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import type { Locale } from '@poppy/project-data';
import SiteChrome from '../components/SiteChrome.vue';
import SiteFooter from '../components/SiteFooter.vue';

const { lang } = useData();
const locale = computed<Locale>(() => (lang.value.startsWith('en') ? 'en' : 'pt-BR'));
</script>

<template>
  <div class="site-page">
    <SiteChrome />

    <div class="not-found">
    <p class="eyebrow">404</p>
    <h1>{{ locale === 'en' ? 'This page does not exist.' : 'Esta página não existe.' }}</h1>
    <p>
      {{
        locale === 'en'
          ? 'The link may be outdated. Try the documentation index or the project list.'
          : 'O link pode estar desatualizado. Tente o índice de documentação ou a lista de projetos.'
      }}
    </p>
    <p class="not-found__links">
      <a class="text-link" :href="locale === 'en' ? '/en/docs/' : '/docs/'">
        {{ locale === 'en' ? 'Documentation' : 'Documentação' }} →
      </a>
      <a class="text-link" :href="locale === 'en' ? '/en/#projects' : '/#projects'">
        {{ locale === 'en' ? 'Projects' : 'Projetos' }} →
      </a>
    </p>
  </div>

    <SiteFooter />
  </div>
</template>
