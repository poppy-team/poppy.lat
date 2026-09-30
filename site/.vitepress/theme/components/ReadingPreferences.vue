<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useCourseState } from '../course-state';
import PalettePicker from './PalettePicker.vue';
import ThemeToggle from './ThemeToggle.vue';

/**
 * Reading controls for the lessons. Spacing and size come first because they
 * help readers with dyslexia more than any particular typeface; the
 * hyperlegible font is offered as a further option, focus mode hides
 * everything around the lesson, and long lines in code can wrap. The panel
 * floats over the page, so opening it never pushes the lesson down.
 */
const state = useCourseState();
const open = ref(false);
const root = ref<HTMLElement | null>(null);

const sizes = [
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Grande' },
  { value: 'larger', label: 'Maior' },
] as const;

function close(returnFocus = false): void {
  open.value = false;

  if (returnFocus) {
    root.value?.querySelector<HTMLElement>('.reading-tools__toggle')?.focus();
  }
}

function onDocumentClick(event: MouseEvent): void {
  if (open.value && root.value && event.target instanceof Node && !root.value.contains(event.target)) {
    close();
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && open.value) {
    close(true);
  }
}

function reset(): void {
  Object.assign(state.value.preferences, { size: 'normal', spacing: 'normal', font: 'default', codeWrap: false, focusRuler: true });
}

onMounted(() => document.addEventListener('click', onDocumentClick));
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick));
</script>

<template>
  <div ref="root" class="reading-tools" @keydown="onKeydown">
    <button
      type="button"
      class="tool-btn"
      :aria-pressed="state.preferences.focus"
      @click="state.preferences.focus = !state.preferences.focus"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
      <span class="tool-btn__label">{{ state.preferences.focus ? 'Sair do foco' : 'Modo foco' }}</span>
    </button>

    <button
      type="button"
      class="tool-btn reading-tools__toggle"
      :aria-expanded="open"
      aria-controls="reading-tools-panel"
      @click="open = !open"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 19 8 6l5 13M5 15h6M15 19l3.5-9 3.5 9M16.5 16.5h4" />
      </svg>
      <span class="tool-btn__label">Leitura</span>
    </button>

    <div v-show="open" id="reading-tools-panel" class="reading-tools__panel" role="group" aria-label="Preferências de leitura">
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

      <fieldset>
        <legend>Códigos</legend>
        <label>
          <input v-model="state.preferences.codeWrap" type="checkbox" />
          Quebrar linhas longas
        </label>
      </fieldset>

      <fieldset>
        <legend>Modo foco</legend>
        <label>
          <input v-model="state.preferences.focusRuler" type="checkbox" />
          Destacar só o trecho que estou lendo
        </label>
      </fieldset>

      <fieldset>
        <legend>Aparência</legend>
        <ThemeToggle />
        <PalettePicker name="palette-reading" />
      </fieldset>

      <p class="reading-tools__note">
        As escolhas ficam salvas neste navegador.
        <button type="button" class="reading-tools__reset" @click="reset">Voltar ao padrão</button>
      </p>
    </div>
  </div>
</template>
