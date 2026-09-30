<script setup lang="ts">
import { computed } from 'vue';

/**
 * A round photo, or the person's initial when there is none. The image is
 * decoration next to the name, so it has no alternative text of its own.
 */
const props = withDefaults(defineProps<{ name: string; photoUrl?: string | null; size?: number }>(), {
  photoUrl: null,
  size: 40,
});

const initial = computed(() => Array.from(props.name.trim())[0]?.toUpperCase() ?? '?');
</script>

<template>
  <span class="avatar" :style="{ '--avatar-size': `${size}px` }" aria-hidden="true">
    <img v-if="photoUrl" :src="photoUrl" alt="" :width="size" :height="size" loading="lazy" decoding="async" />
    <span v-else>{{ initial }}</span>
  </span>
</template>
