<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import { siteCopy, type Locale } from '@poppy/project-data';
import InstallApp from './InstallApp.vue';
import ThemeToggle from './ThemeToggle.vue';

/**
 * The locale is optional so the shell can render the footer without threading a
 * prop through every layout; when absent it is read from the page itself.
 */
const props = defineProps<{
  locale?: Locale;
}>();

const { lang } = useData();

const activeLocale = computed<Locale>(() => {
  if (props.locale) {
    return props.locale;
  }

  return lang.value.startsWith('en') ? 'en' : 'pt-BR';
});
const copy = computed(() => siteCopy[activeLocale.value]);
const root = computed(() => (activeLocale.value === 'en' ? '/en' : ''));
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <div class="site-footer__brand">
        <a class="site-footer__mark" :href="`${root}/`">
          <img class="wordmark__logo wordmark__logo--light" src="/assets/poppy-logo.svg" alt="" width="24" height="24" decoding="async" />
          <img class="wordmark__logo wordmark__logo--dark" src="/assets/poppy-logo-dark.svg" alt="" width="24" height="24" decoding="async" />
          <span>Poppy Team</span>
        </a>
        <p class="site-footer__description">{{ copy.footerDescription }}</p>
      </div>
      <nav class="site-footer__links" :aria-label="copy.footerNavigationLabel">
        <a :href="activeLocale === 'en' ? '/en/learn/' : '/aprender/'">{{ copy.navigation.learn }}</a>
        <a :href="`${root}/#projects`">{{ copy.navigation.projects }}</a>
        <a :href="`${root}/blog/`">{{ copy.navigation.blog }}</a>
        <a href="https://github.com/poppy-team">{{ copy.githubLabel }}</a>
        <a href="mailto:mail@poppy.lat">{{ copy.emailLabel }}</a>
      </nav>
      <ThemeToggle />
      <InstallApp />
      <small class="site-footer__legal">© 2026 Poppy Team</small>
    </div>
  </footer>
</template>
