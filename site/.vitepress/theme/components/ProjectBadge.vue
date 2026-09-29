<script setup lang="ts">
import type { ProjectBadge } from '@poppy/project-data';

defineProps<{
  badge: ProjectBadge;
}>();
</script>

<template>
  <p class="project-badge" :data-project="badge.stage.toLowerCase()">
    <span class="project-badge__stage">{{ badge.stage }}</span>
    <span class="project-badge__dot" aria-hidden="true">·</span>
    <span class="project-badge__text">{{ badge.positioning }}</span>
    <template v-if="badge.note">
      <span class="project-badge__dot" aria-hidden="true">·</span>
      <span class="project-badge__text">{{ badge.note }}</span>
    </template>
  </p>
</template>
