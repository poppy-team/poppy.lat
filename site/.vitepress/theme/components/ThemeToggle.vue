<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';

/**
 * Light or dark, one switch. It lives in the footer and in the lesson reading
 * panel instead of the header, which keeps the navbar to places you can go.
 * The choice is the one VitePress already remembers.
 */
const props = defineProps<{ label?: string }>();
const { isDark, lang } = useData();

const text = computed(() => props.label ?? (lang.value.startsWith('en') ? 'Dark theme' : 'Tema escuro'));
</script>

<template>
  <button type="button" class="theme-toggle" role="switch" :aria-checked="isDark" @click="isDark = !isDark">
    <span class="theme-toggle__track" aria-hidden="true"><span class="theme-toggle__thumb" /></span>
    {{ text }}
  </button>
</template>
