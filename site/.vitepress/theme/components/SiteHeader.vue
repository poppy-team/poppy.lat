<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vitepress';
import { siteCopy, type Locale } from '@poppy/project-data';
import AccountMenu from '../accounts/AccountMenu.vue';
import { siteSection } from '../nav';
import LanguageSwitch from './LanguageSwitch.vue';

const props = defineProps<{
  locale: Locale;
}>();

const route = useRoute();

const copy = computed(() => siteCopy[props.locale]);
const root = computed(() => (props.locale === 'en' ? '/en' : ''));

const section = computed(() => siteSection(route.path));

// Ordered by emphasis: learning first, then what the team builds, then how it
// is documented, then the blog. Contact lives in the footer.
const links = computed(() => [
  {
    key: 'learn',
    href: props.locale === 'en' ? '/en/learn/' : '/aprender/',
    label: copy.value.navigation.learn,
  },
  { key: 'projects', href: `${root.value}/#projects`, label: copy.value.navigation.projects },
  { key: 'docs', href: `${root.value}/#docs`, label: copy.value.navigation.docs },
  { key: 'blog', href: `${root.value}/blog/`, label: copy.value.navigation.blog },
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
          :class="{ 'site-nav__link--feature': link.key === 'learn' }"
          :href="link.href"
          :aria-current="section === link.key ? 'page' : undefined"
        >
          {{ link.label }}
        </a>
      </nav>

      <AccountMenu v-if="locale !== 'en'" />
      <LanguageSwitch />
    </div>
  </header>
</template>
