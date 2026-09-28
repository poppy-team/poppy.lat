<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { useData } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { getProjectBySlug, siteCopy, type Locale } from '@poppy/project-data';
import SiteChrome from '../components/SiteChrome.vue';
import SiteFooter from '../components/SiteFooter.vue';

const { Layout } = DefaultTheme;
const { frontmatter, lang } = useData();

const locale = computed<Locale>(() => (lang.value.startsWith('en') ? 'en' : 'pt-BR'));
const copy = computed(() => siteCopy[locale.value]);

/**
 * The active project drives the visual identity of every documentation page.
 * It is read from frontmatter so a page states its own project explicitly
 * rather than the shell guessing from the URL.
 */
const activeProject = computed(() => {
  const declared = frontmatter.value.project;

  return typeof declared === 'string' ? getProjectBySlug(declared) : undefined;
});

// Applied during render so the identity survives server-side rendering, and
// kept in a watcher so it also updates on client-side navigation.
watchEffect(() => {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.project = activeProject.value?.slug ?? '';
  }
});
</script>

<template>
  <!--
    VitePress forwards named slots only for its built-in `page` and `doc`
    layouts; a custom layout receives nothing. Both branches render the same
    chrome component, so the header and switcher appear on every page.
  -->
  <Layout>
    <template #doc-top>
      <SiteChrome />
    </template>

    <template #page-top>
      <SiteChrome />
    </template>

    <template #doc-bottom>
      <SiteFooter />
    </template>

    <template #page-bottom>
      <SiteFooter />
    </template>
  </Layout>
</template>
