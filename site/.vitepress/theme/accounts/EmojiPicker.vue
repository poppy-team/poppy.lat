<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';

/**
 * The emoji chooser. The picker and its Portuguese data (a file of this same
 * site, not a third-party address) load the first time it is opened.
 */
const emit = defineEmits<{ pick: [emoji: string] }>();

const open = ref(false);
const host = ref<HTMLElement | null>(null);
const button = ref<HTMLButtonElement | null>(null);
let built = false;

async function build(): Promise<void> {
  if (built || !host.value) {
    return;
  }

  built = true;

  const [{ Picker }, { default: pt }, { default: dataSource }] = await Promise.all([
    import('emoji-picker-element'),
    import('emoji-picker-element/i18n/pt_BR'),
    import('emoji-picker-element-data/pt/cldr/data.json?url'),
  ]);
  const picker = new Picker({ dataSource, i18n: pt, locale: 'pt' });

  picker.addEventListener('emoji-click', (event) => {
    if (event.detail.unicode) {
      emit('pick', event.detail.unicode);
    }

    open.value = false;
    button.value?.focus();
  });
  host.value.append(picker);
}

async function toggle(): Promise<void> {
  open.value = !open.value;

  if (open.value) {
    await nextTick();
    await build();
    host.value?.querySelector('emoji-picker')?.shadowRoot?.querySelector<HTMLElement>('input')?.focus();
  }
}

onMounted(() => {
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && open.value) {
      open.value = false;
      button.value?.focus();
    }
  });
});
</script>

<template>
  <div class="emoji-picker">
    <button ref="button" type="button" class="acct-btn acct-btn--quiet" :aria-expanded="open" @click="toggle">
      <span aria-hidden="true">😊</span> Emoji
    </button>
    <div v-show="open" ref="host" class="emoji-picker__pop" />
  </div>
</template>
