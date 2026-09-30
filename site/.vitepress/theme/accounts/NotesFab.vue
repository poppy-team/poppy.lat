<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vitepress';
import { lessonAt } from '../data/courses';
import { accountsEnabled, api } from './api';
import NoteWorkspace from './NoteWorkspace.vue';
import { me, sessionStatus, startSession } from './session';

/**
 * The round button on the right edge of every lesson. It opens the note of
 * the lesson being read: a side panel on wide screens, where the lesson stays
 * readable beside it, and a sheet rising from the bottom on a phone. The note
 * is created the first time something is typed and is linked to the lesson,
 * so it can be found again from the notes page.
 */
const route = useRoute();
const open = ref(false);
const noteId = ref<string | null>(null);
const ready = ref(false);
const sheet = ref<HTMLElement | null>(null);
const toggle = ref<HTMLButtonElement | null>(null);
const narrow = ref(false);

let query: MediaQueryList | undefined;

const lessonId = computed(() => {
  const place = lessonAt(route.path);

  return place ? route.path.replace(/(\.html|\/)$/u, '').replace(/^\/aprender\//u, '') : null;
});

async function findNote(): Promise<void> {
  ready.value = false;
  noteId.value = null;

  if (!me.value || !lessonId.value) {
    ready.value = true;

    return;
  }

  try {
    const result = await api<{ notes: { id: string }[] }>(`/api/me/notes?lesson=${encodeURIComponent(lessonId.value)}&limit=1`);

    noteId.value = result.notes[0]?.id ?? null;
  } catch {
    noteId.value = null;
  }

  ready.value = true;
}

function updateNarrow(): void {
  narrow.value = Boolean(query?.matches);
}

onMounted(() => {
  startSession();
  query = window.matchMedia('(max-width: 720px)');
  updateNarrow();
  query.addEventListener('change', updateNarrow);
});

onBeforeUnmount(() => query?.removeEventListener('change', updateNarrow));

watch([open, () => me.value?.user.id, lessonId], () => {
  if (open.value) {
    void findNote();
  }
});

watch(open, async (value) => {
  document.documentElement.toggleAttribute('data-notes-open', value && narrow.value);

  if (value) {
    await nextTick();
    sheet.value?.focus();
  }
});

function close(): void {
  open.value = false;
  toggle.value?.focus();
}

/** On a phone the sheet is modal, so Tab stays inside it until it closes. */
function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    close();

    return;
  }

  if (event.key !== 'Tab' || !narrow.value || !sheet.value) {
    return;
  }

  const focusable = [
    ...sheet.value.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'),
  ].filter((element) => element.offsetParent !== null);
  const first = focusable[0];
  const last = focusable.at(-1);

  if (event.shiftKey && (document.activeElement === first || document.activeElement === sheet.value)) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}
</script>

<template>
  <div v-if="accountsEnabled && lessonId" class="notes-fab" @keydown="onKeydown">
    <div v-if="open && narrow" class="notes-fab__backdrop" aria-hidden="true" @click="close" />

    <section
      v-show="open"
      id="notes-sheet"
      ref="sheet"
      class="notes-fab__sheet"
      role="dialog"
      :aria-modal="narrow ? 'true' : undefined"
      aria-labelledby="notes-sheet-title"
      tabindex="-1"
    >
      <header class="notes-fab__head">
        <h2 id="notes-sheet-title">Anotações da aula</h2>
        <button type="button" class="notes-fab__close" @click="close">Fechar</button>
      </header>

      <div class="notes-fab__body">
        <p v-if="sessionStatus !== 'ready'" role="status">Carregando…</p>
        <template v-else-if="!me">
          <p>Entre para guardar anotações ligadas a esta aula. Elas ficam só com você.</p>
          <a class="acct-btn acct-btn--primary" :href="`/conta/entrar?voltar=${encodeURIComponent(route.path)}`">Entrar</a>
        </template>
        <template v-else-if="ready">
          <NoteWorkspace :note-id="noteId" :lesson-id="lessonId" @created="noteId = $event" />
          <p class="acct-muted acct-fine"><a href="/conta/anotacoes">Ver todas as anotações</a></p>
        </template>
      </div>
    </section>

    <button
      ref="toggle"
      type="button"
      class="notes-fab__button"
      :aria-expanded="open"
      aria-controls="notes-sheet"
      @click="open = !open"
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M4 20h4L19 9a2.1 2.1 0 0 0-4-4L4 16z" />
        <path d="m14 6 4 4" />
      </svg>
      <span class="notes-fab__label">Anotar</span>
    </button>
  </div>
</template>
