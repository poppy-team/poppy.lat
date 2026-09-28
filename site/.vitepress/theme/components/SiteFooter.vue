<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import { siteCopy, type Locale } from '@poppy/project-data';

const { lang } = useData();

const locale = computed<Locale>(() => (lang.value.startsWith('en') ? 'en' : 'pt-BR'));
const copy = computed(() => siteCopy[locale.value]);
const root = computed(() => (locale.value === 'en' ? '/en' : ''));
</script>

<template>
  <footer class="site-footer">
    <a class="site-footer__mark" :href="`${root}/`">
      <img src="/assets/poppy-logo.svg" alt="" width="28" height="28" decoding="async" />
      <span>poppy team</span>
    </a>
    <p class="site-footer__description">{{ copy.footerDescription }}</p>
    <nav class="site-footer__links" :aria-label="copy.navigationLabel">
      <a href="https://github.com/poppy-team">{{ copy.githubLabel }}</a>
      <a href="mailto:mail@poppy.lat">{{ copy.emailLabel }}</a>
    </nav>
    <small>© 2026 Poppy Team</small>
  </footer>
</template>
