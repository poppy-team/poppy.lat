<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useData } from 'vitepress';
import { canPrompt, installed, needsManualSteps, promptInstall, watchInstall } from '../app-install';

/**
 * "Install the app", in the footer. It is only drawn when it can do something:
 * where the browser offers the install prompt, it opens it; on an iPhone or
 * iPad it explains the two taps in the Share menu. Once the site runs as an
 * app, or where installing is not possible, nothing is shown.
 */
const { lang } = useData();
const english = computed(() => lang.value.startsWith('en'));
const steps = ref(false);

const words = computed(() =>
  english.value
    ? {
        button: 'Install the app',
        hint: 'Opens like any app, with its own icon and window.',
        stepsTitle: 'To install on iPhone or iPad',
        step1: 'Tap the Share button in Safari.',
        step2: 'Choose “Add to Home Screen”.',
        close: 'Got it',
      }
    : {
        button: 'Instalar como aplicativo',
        hint: 'Abre como qualquer app, com ícone e janela próprios.',
        stepsTitle: 'Para instalar no iPhone ou iPad',
        step1: 'Toque no botão Compartilhar do Safari.',
        step2: 'Escolha “Adicionar à Tela de Início”.',
        close: 'Entendi',
      },
);

onMounted(watchInstall);

async function install(): Promise<void> {
  if (canPrompt.value) {
    await promptInstall();
  } else {
    steps.value = !steps.value;
  }
}
</script>

<template>
  <div v-if="!installed && (canPrompt || needsManualSteps)" class="install-app">
    <button type="button" class="install-app__button" :aria-expanded="needsManualSteps ? steps : undefined" @click="install">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" />
      </svg>
      {{ words.button }}
    </button>
    <p class="install-app__hint">{{ words.hint }}</p>

    <div v-if="steps && !canPrompt" class="install-app__steps" role="group" :aria-label="words.stepsTitle">
      <strong>{{ words.stepsTitle }}</strong>
      <ol>
        <li>{{ words.step1 }}</li>
        <li>{{ words.step2 }}</li>
      </ol>
      <button type="button" class="install-app__close" @click="steps = false">{{ words.close }}</button>
    </div>
  </div>
</template>
