<script setup lang="ts">
import { badgeLabel, type Badge } from './api';

/** "Aluno", "Contribuidor" or "Criador". The role decides it; nobody picks their own. */
defineProps<{ badge: Badge }>();
</script>

<template>
  <span class="role-badge" :data-badge="badge">{{ badgeLabel[badge] }}</span>
</template>
