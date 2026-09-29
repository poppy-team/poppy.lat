<script setup lang="ts">
import { computed } from 'vue';
import { localeRoot, projects, type Locale } from '@poppy/project-data';

const props = defineProps<{
  locale: Locale;
  /** Slug of the project whose documentation is open. */
  current?: string;
}>();

const label = {
  'pt-BR': 'Documentação por projeto',
  en: 'Documentation by project',
} as const;

const links = computed(() =>
  projects.map((project) => ({
    slug: project.slug,
    name: project.name,
    href: `${localeRoot(props.locale)}/${project.slug}/docs/`,
  })),
);
</script>

<template>
  <nav class="project-switch" :aria-label="label[locale]">
    <ul class="project-switch__list">
      <li v-for="link in links" :key="link.slug" class="project-switch__item">
        <a
          class="project-switch__link"
          :href="link.href"
          :data-project="link.slug"
          :aria-current="link.slug === current ? 'page' : undefined"
        >
          {{ link.name }}
        </a>
      </li>
    </ul>
  </nav>
</template>
