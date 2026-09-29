<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import { siteCopy, type Locale } from '@poppy/project-data';

const props = defineProps<{
  locale: Locale;
  languageHref: string;
}>();

const { frontmatter } = useData();

const copy = computed(() => siteCopy[props.locale]);
const root = computed(() => (props.locale === 'en' ? '/en' : ''));
</script>

<template>
  <header class="site-header">
    <a class="wordmark" :href="`${root}/`" aria-label="Poppy Team">
      <img
        class="wordmark__logo"
        src="/assets/poppy-logo.svg"
        alt=""
        width="32"
        height="32"
        decoding="async"
      />
      <span class="wordmark__text">
        <span class="wordmark__name">poppy</span>
        <span class="wordmark__suffix">team / research &amp; tools</span>
      </span>
    </a>

    <nav class="site-nav" :aria-label="copy.navigationLabel">
      <a class="site-nav__link" :href="`${root}/#projects`">{{ copy.navigation.projects }}</a>
      <a class="site-nav__link" :href="`${root}/#projects`">{{ copy.navigation.docs }}</a>
      <a class="site-nav__link" :href="`${root}/blog/`">{{ copy.navigation.blog }}</a>
      <a class="site-nav__link" href="mailto:mail@poppy.lat">{{ copy.navigation.contact }}</a>
      <a
        class="language-switch"
        :href="languageHref"
        :lang="locale === 'en' ? 'pt-BR' : 'en'"
        :aria-label="copy.languageLabel"
      >
        {{ copy.languageName }}
      </a>
    </nav>
  </header>
</template>
