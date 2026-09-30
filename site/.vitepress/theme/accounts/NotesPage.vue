<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { accountsEnabled, api, ApiError, shortDateTime } from './api';
import NoteWorkspace from './NoteWorkspace.vue';
import { downloadAll, lessonTitle, type NoteFile } from './notes-export';
import { me, sessionStatus, startSession } from './session';

/** `/conta/anotacoes`: every note, searchable, with one open for editing and a download of them all. */
interface Summary {
  id: string;
  title: string;
  excerpt: string;
  lessonId: string | null;
  updatedAt: string | null;
  version: number;
}

const notes = ref<Summary[]>([]);
const query = ref('');
const selected = ref<string | null>(null);
const creating = ref(false);
const loaded = ref(false);
const error = ref('');
const workspaceKey = ref(0);

let searchTimer: ReturnType<typeof setTimeout> | undefined;

async function fetchNotes(): Promise<void> {
  try {
    const params = new URLSearchParams({ limit: '50' });

    if (query.value.trim()) {
      params.set('q', query.value.trim());
    }

    notes.value = (await api<{ notes: Summary[] }>(`/api/me/notes?${params}`)).notes;
    error.value = '';
  } catch (failure) {
    error.value = failure instanceof ApiError ? failure.message : 'Não foi possível carregar as anotações.';
  } finally {
    loaded.value = true;
  }
}

onMounted(async () => {
  startSession();

  const wait = setInterval(async () => {
    if (sessionStatus.value === 'ready') {
      clearInterval(wait);

      if (me.value) {
        await fetchNotes();
        selected.value = new URLSearchParams(location.search).get('n');
      } else {
        loaded.value = true;
      }
    }
  }, 50);
});

function onSearch(): void {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => void fetchNotes(), 300);
}

function open(id: string): void {
  creating.value = false;
  selected.value = id;
  workspaceKey.value += 1;
}

function startNew(): void {
  creating.value = true;
  selected.value = null;
  workspaceKey.value += 1;
}

async function afterSave(): Promise<void> {
  await fetchNotes();
}

function afterCreated(id: string): void {
  selected.value = id;
  creating.value = false;
}

async function afterDelete(): Promise<void> {
  selected.value = null;
  creating.value = false;
  workspaceKey.value += 1;
  await fetchNotes();
}

async function exportAll(): Promise<void> {
  const files: NoteFile[] = [];

  // The list only has excerpts, so each full note is fetched for the file.
  for (const note of notes.value) {
    const full = await api<{ note: NoteFile }>(`/api/me/notes/${note.id}`);

    files.push(full.note);
  }

  await downloadAll(files);
}

const empty = computed(() => loaded.value && notes.value.length === 0);
</script>

<template>
  <div class="acct-page acct-page--wide">
    <template v-if="!accountsEnabled">
      <h1>Minhas anotações</h1>
      <p>As contas ainda não estão ativas neste site.</p>
    </template>

    <p v-else-if="sessionStatus !== 'ready'" role="status">Carregando…</p>

    <template v-else-if="!me">
      <h1>Minhas anotações</h1>
      <p>Entre para ver as suas anotações. Elas são só suas: nem a equipe consegue lê-las.</p>
      <a class="acct-btn acct-btn--primary" href="/conta/entrar?voltar=/conta/anotacoes">Entrar</a>
    </template>

    <template v-else>
      <h1>Minhas anotações</h1>
      <p class="acct-muted">Só você lê estas anotações. Cada uma pode ficar ligada a uma aula e ser baixada em Markdown.</p>

      <div class="notes-page">
        <aside class="notes-page__list" aria-label="Lista de anotações">
          <div class="notes-page__tools">
            <button type="button" class="acct-btn acct-btn--primary" @click="startNew">Nova anotação</button>
            <button type="button" class="acct-btn" :disabled="notes.length === 0" @click="exportAll">Baixar todas (.zip)</button>
          </div>
          <label class="acct-field">
            <span class="visually-hidden">Buscar nas anotações</span>
            <input v-model="query" type="search" placeholder="Buscar" @input="onSearch" />
          </label>
          <p v-if="error" class="acct-error" role="alert">{{ error }}</p>
          <p v-else-if="empty" class="acct-muted">
            {{ query ? 'Nada encontrado.' : 'Você ainda não tem anotações. Abra uma aula e use o botão “Minhas anotações”.' }}
          </p>
          <ul>
            <li v-for="note in notes" :key="note.id">
              <button type="button" class="notes-page__item" :aria-current="selected === note.id ? 'true' : undefined" @click="open(note.id)">
                <strong>{{ note.title || 'Sem título' }}</strong>
                <span class="acct-muted">{{ lessonTitle(note.lessonId) ?? 'Sem aula' }} · {{ shortDateTime(note.updatedAt) }}</span>
                <span class="notes-page__excerpt">{{ note.excerpt }}</span>
              </button>
            </li>
          </ul>
        </aside>

        <section class="notes-page__editor" aria-label="Editor">
          <NoteWorkspace
            v-if="selected || creating"
            :key="workspaceKey"
            :note-id="selected"
            :lesson-id="null"
            @saved="afterSave"
            @created="afterCreated"
            @deleted="afterDelete"
          />
          <p v-else class="acct-muted">Escolha uma anotação ao lado ou crie uma nova.</p>
        </section>
      </div>
    </template>
  </div>
</template>
