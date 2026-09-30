<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vitepress';
import { siteCopy } from '@poppy/project-data';
import { accountsEnabled } from '../accounts/api';
import { me, startSession } from '../accounts/session';
import { useCounterpart } from '../counterpart';
import { siteSection } from '../nav';

/**
 * The navigation of narrow screens, drawn like the tab bar of a phone app:
 * five places along the bottom, within reach of the thumb. Wide screens keep
 * the header links and never show this. Each tab is a plain link.
 */
const route = useRoute();
const { locale } = useCounterpart();

const copy = computed(() => siteCopy[locale.value].navigation);
const root = computed(() => (locale.value === 'en' ? '/en' : ''));
const section = computed(() => siteSection(route.path));
const account = computed(() => accountsEnabled && locale.value !== 'en');

onMounted(() => startSession());

const tabs = computed(() => [
  { key: 'projects', href: `${root.value}/#projects`, label: copy.value.projects },
  { key: 'docs', href: `${root.value}/#docs`, label: copy.value.docs },
  { key: 'learn', href: locale.value === 'en' ? '/en/learn/' : '/aprender/', label: copy.value.learn },
  { key: 'blog', href: `${root.value}/blog/`, label: copy.value.blog },
  account.value
    ? {
        key: 'account',
        href: me.value ? '/conta/perfil' : `/conta/entrar?voltar=${encodeURIComponent(route.path)}`,
        label: me.value ? 'Conta' : 'Entrar',
      }
    : { key: 'contact', href: 'mailto:mail@poppy.lat', label: copy.value.contact },
]);

const paths: Record<string, string[]> = {
  projects: ['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z'],
  docs: ['M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5z', 'M5 20.5A2.5 2.5 0 0 0 7.5 23H19v-5'],
  learn: ['M2 9l10-5 10 5-10 5z', 'M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5', 'M22 9v6'],
  blog: ['M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6z', 'M10 8h4', 'M10 12h4'],
  account: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21c0-4 3.6-7 8-7s8 3 8 7'],
  contact: ['M3 6h18v12H3z', 'M3 7l9 6 9-6'],
};
</script>

<template>
  <nav class="tabbar" :aria-label="siteCopy[locale].navigationLabel">
    <a
      v-for="tab in tabs"
      :key="tab.key"
      class="tabbar__tab"
      :class="{ 'tabbar__tab--feature': tab.key === 'learn' }"
      :href="tab.href"
      :aria-current="section === tab.key ? 'page' : undefined"
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path v-for="d in paths[tab.key]" :key="d" :d="d" />
      </svg>
      <span class="tabbar__label">{{ tab.label }}</span>
    </a>
  </nav>
</template>
