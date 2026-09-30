<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import type { Locale } from '@poppy/project-data';

const { lang } = useData();
const locale = computed<Locale>(() => (lang.value.startsWith('en') ? 'en' : 'pt-BR'));
const root = computed(() => (locale.value === 'en' ? '/en' : ''));
</script>

<template>
  <main id="main-content" class="not-found" tabindex="-1">
    <p class="eyebrow">404</p>
    <h1 class="page-intro__title">{{ locale === 'en' ? 'This page does not exist.' : 'Esta página não existe.' }}</h1>
    <p class="page-intro__lead">
      {{
        locale === 'en'
          ? 'The link may be outdated. Try the documentation or the project list.'
          : 'O link pode estar desatualizado. Tente a documentação ou a lista de projetos.'
      }}
    </p>
    <p class="not-found__links">
      <a class="button-link button-link--dark" :href="`${root}/#docs`">
        {{ locale === 'en' ? 'Documentation' : 'Documentação' }}
      </a>
      <a class="button-link button-link--light" :href="`${root}/#projects`">
        {{ locale === 'en' ? 'Projects' : 'Projetos' }}
      </a>
    </p>
  </main>
</template>
