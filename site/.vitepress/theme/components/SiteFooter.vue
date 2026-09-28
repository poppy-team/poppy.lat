<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import { siteCopy, type Locale } from '@poppy/project-data';

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
