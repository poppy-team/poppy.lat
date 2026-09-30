<script setup lang="ts">
import { onMounted } from 'vue';
import { initPalette, palette, palettes, setPalette } from '../palette';

/**
 * Four palettes as a group of radio buttons, each with a tiny preview of its
 * light and dark version. It changes colours only; the light/dark switch next
 * to it still works in every palette. Arrow keys move between them, as with any
 * group of radio buttons.
 */
const props = defineProps<{ name?: string }>();

onMounted(initPalette);
</script>

<template>
  <div class="palette-picker" role="radiogroup" aria-label="Paleta de cores">
    <label v-for="entry in palettes" :key="entry.id" class="palette-picker__option">
      <input
        type="radio"
        :name="props.name ?? 'palette'"
        :value="entry.id"
        :checked="palette === entry.id"
        @change="setPalette(entry.id)"
      />
      <span class="palette-picker__swatch" aria-hidden="true">
        <span
          class="palette-picker__half"
          :style="{ '--p-bg': entry.light[0], '--p-fg': entry.light[1], '--p-accent': entry.light[2] }"
        />
        <span
          class="palette-picker__half"
          :style="{ '--p-bg': entry.dark[0], '--p-fg': entry.dark[1], '--p-accent': entry.dark[2] }"
        />
      </span>
      <span class="palette-picker__text">
        <span class="palette-picker__name">{{ entry.name }}</span>
        <span class="palette-picker__hint">{{ entry.hint }}</span>
      </span>
    </label>
  </div>
</template>
