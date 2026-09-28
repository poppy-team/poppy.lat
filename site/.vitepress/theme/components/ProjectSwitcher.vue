<script setup lang="ts">
import type { Locale } from '@poppy/project-data';

interface ProjectLink {
  slug: string;
  name: string;
  href: string;
  colorToken: string;
}

defineProps<{
  links: ProjectLink[];
  locale: Locale;
}>();

const label = {
  'pt-BR': 'Documentação por projeto',
  en: 'Documentation by project',
} as const;
</script>

<template>
  <nav class="project-switch" :aria-label="label[locale]">
    <span class="project-switch__label">{{ label[locale] }}</span>
    <ul class="project-switch__list">
      <li v-for="link in links" :key="link.slug" class="project-switch__item">
        <a
          class="project-switch__link"
          :href="link.href"
          :data-project="link.slug"
          :style="{ '--switch-color': link.colorToken }"
        >
          {{ link.name }}
        </a>
      </li>
    </ul>
  </nav>
</template>
