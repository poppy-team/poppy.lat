<script setup lang="ts">
import { computed } from 'vue';
import { siteCopy } from '@poppy/project-data';
import { useCounterpart } from '../counterpart.ts';
import { rememberLocale } from '../language-preference.ts';

/**
 * The link to the current page in the other language. Choosing it is also the
 * moment the reader states a preference, so it is remembered here.
 */
const { locale, counterpartHref } = useCounterpart();

const target = computed(() => (locale.value === 'en' ? 'pt-BR' : 'en'));
const copy = computed(() => siteCopy[locale.value]);
</script>

<template>
  <a
    class="language-switch"
    :href="counterpartHref"
    :lang="target"
    :aria-label="copy.languageLabel"
    @click="rememberLocale(target)"
  >
    {{ locale === 'en' ? 'PT' : 'EN' }}
  </a>
</template>
