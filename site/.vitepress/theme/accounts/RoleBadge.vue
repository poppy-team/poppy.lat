<script setup lang="ts">
import { badgeLabel } from './api';

/** "Aluno" or "Contribuidor". The role decides it; nobody picks their own. */
defineProps<{ badge: 'student' | 'contributor' }>();
</script>

<template>
  <span class="role-badge" :data-badge="badge">{{ badgeLabel[badge] }}</span>
</template>
