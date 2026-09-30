<script setup lang="ts">
import { useCourseState } from '../course-state';

/**
 * Reading controls for the lessons. Spacing and size come first because they
 * help readers with dyslexia more than any particular typeface; the
 * hyperlegible font is offered as a further option, and focus mode hides
 * everything around the lesson.
 */
const state = useCourseState();

const sizes = [
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Grande' },
  { value: 'larger', label: 'Maior' },
] as const;
</script>

<template>
  <div class="reading-tools">
    <button
      type="button"
      class="reading-tools__focus"
      :aria-pressed="state.preferences.focus"
      @click="state.preferences.focus = !state.preferences.focus"
    >
      {{ state.preferences.focus ? 'Sair do modo foco' : 'Modo foco' }}
    </button>

    <details class="reading-tools__panel">
      <summary>Preferências de leitura</summary>

      <fieldset>
        <legend>Tamanho do texto</legend>
        <label v-for="size in sizes" :key="size.value">
          <input v-model="state.preferences.size" type="radio" name="reading-size" :value="size.value" />
          {{ size.label }}
        </label>
      </fieldset>

      <fieldset>
        <legend>Espaçamento</legend>
        <label>
          <input v-model="state.preferences.spacing" type="radio" name="reading-spacing" value="normal" />
          Normal
        </label>
        <label>
          <input v-model="state.preferences.spacing" type="radio" name="reading-spacing" value="wide" />
          Amplo
        </label>
      </fieldset>

      <fieldset>
        <legend>Fonte do texto</legend>
        <label>
          <input v-model="state.preferences.font" type="radio" name="reading-font" value="default" />
          Padrão
        </label>
        <label>
          <input v-model="state.preferences.font" type="radio" name="reading-font" value="hyperlegible" />
          Alta legibilidade
        </label>
      </fieldset>

      <p class="reading-tools__note">As escolhas ficam salvas neste navegador.</p>
    </details>
  </div>
</template>
