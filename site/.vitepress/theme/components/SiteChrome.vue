<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useData } from 'vitepress';
import SiteHeader from './SiteHeader.vue';
import { useCounterpart } from '../counterpart.ts';
import { preferredLocale } from '../language-preference.ts';

const { page } = useData();
const { locale, counterpartHref } = useCounterpart();

/**
 * A reader who switched language keeps it: a page opened in the other locale
 * (a shared link, a bookmark, the site root) moves to its counterpart. The
 * server renders every page in its own locale, so this can only run in the
 * browser, after mount.
 */
function followPreferredLocale(): void {
  const preferred = preferredLocale();

  if (preferred && preferred !== locale.value) {
    window.location.replace(counterpartHref.value);
  }
}

onMounted(() => {
  followPreferredLocale();
  watch(() => page.value.relativePath, followPreferredLocale);
});
</script>

<template>
  <SiteHeader :locale="locale" />
</template>
