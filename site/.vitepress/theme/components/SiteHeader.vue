<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vitepress';
import { siteCopy, type Locale } from '@poppy/project-data';

const props = defineProps<{
  locale: Locale;
  languageHref: string;
}>();

const route = useRoute();

const copy = computed(() => siteCopy[props.locale]);
const root = computed(() => (props.locale === 'en' ? '/en' : ''));

/** The section the current page belongs to, so its link reads as current. */
const section = computed(() => {
  const path = route.path.replace(/^\/en(?=\/)/u, '');

  if (path.startsWith('/projects/')) {
    return 'projects';
  }

  if (path.startsWith('/blog')) {
    return 'blog';
  }

  return /^\/[a-z]+\/docs\//u.test(path) ? 'docs' : '';
});

const links = computed(() => [
  { key: 'projects', href: `${root.value}/#projects`, label: copy.value.navigation.projects },
  { key: 'docs', href: `${root.value}/#docs`, label: copy.value.navigation.docs },
  { key: 'blog', href: `${root.value}/blog/`, label: copy.value.navigation.blog },
  { key: 'contact', href: 'mailto:mail@poppy.lat', label: copy.value.navigation.contact },
]);
</script>

<template>
  <header class="site-header">
    <div class="site-header__inner">
      <a class="wordmark" :href="`${root}/`" aria-label="Poppy Team">
        <img
          class="wordmark__logo wordmark__logo--light"
          src="/assets/poppy-logo.svg"
          alt=""
          width="30"
          height="30"
          decoding="async"
        />
        <img
          class="wordmark__logo wordmark__logo--dark"
          src="/assets/poppy-logo-dark.svg"
          alt=""
          width="30"
          height="30"
          decoding="async"
        />
        <span class="wordmark__name">Poppy Team</span>
      </a>

      <nav class="site-nav" :aria-label="copy.navigationLabel">
        <a
          v-for="link in links"
          :key="link.key"
          class="site-nav__link"
          :href="link.href"
          :aria-current="section === link.key ? 'page' : undefined"
        >
          {{ link.label }}
        </a>
      </nav>

      <a
        class="language-switch"
        :href="languageHref"
        :lang="locale === 'en' ? 'pt-BR' : 'en'"
        :aria-label="copy.languageLabel"
      >
        {{ locale === 'en' ? 'PT' : 'EN' }}
      </a>
    </div>
  </header>
</template>
