<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vitepress';
import { lessonAt } from '../data/courses';
import { accountsEnabled, api } from './api';
import NoteWorkspace from './NoteWorkspace.vue';
import { me, sessionStatus, startSession } from './session';

/**
 * "Minhas anotações" on a lesson: a panel with the note for this lesson. The
 * note is created the first time something is typed, and is linked to the
 * lesson, so it can be found again from the notes page.
 */
const route = useRoute();
const open = ref(false);
const noteId = ref<string | null>(null);
const ready = ref(false);

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

onMounted(() => startSession());
watch([open, () => me.value?.user.id, lessonId], () => {
  if (open.value) {
    void findNote();
  }
});

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    open.value = false;
  }
}
</script>

<template>
  <div v-if="accountsEnabled && lessonId" class="notes-panel" @keydown="onKeydown">
    <button type="button" class="notes-panel__toggle" :aria-expanded="open" aria-controls="notes-panel-body" @click="open = !open">
      {{ open ? 'Fechar anotações' : 'Minhas anotações' }}
    </button>

    <section v-show="open" id="notes-panel-body" class="notes-panel__body" aria-label="Minhas anotações desta aula">
      <template v-if="sessionStatus !== 'ready'"><p role="status">Carregando…</p></template>
      <template v-else-if="!me">
        <p>Entre para guardar anotações ligadas a esta aula. Elas ficam só com você.</p>
        <a class="acct-btn acct-btn--primary" :href="`/conta/entrar?voltar=${encodeURIComponent(route.path)}`">Entrar</a>
      </template>
      <template v-else-if="ready">
        <NoteWorkspace :note-id="noteId" :lesson-id="lessonId" @created="noteId = $event" />
        <p class="acct-muted acct-fine"><a href="/conta/anotacoes">Ver todas as anotações</a></p>
      </template>
    </section>
  </div>
</template>
