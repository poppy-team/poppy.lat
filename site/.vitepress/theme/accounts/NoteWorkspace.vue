<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { api, ApiError, shortDateTime } from './api';
import NoteEditor from './NoteEditor.vue';
import { downloadNote, lessonTitle, type NoteFile } from './notes-export';

/**
 * One note being written: title, editor, and saving. It saves by itself a
 * moment after the last key, one request at a time, and never overwrites
 * something saved elsewhere: if the server says the note changed, the person
 * chooses which version to keep.
 */
const props = defineProps<{ noteId: string | null; lessonId: string | null }>();
const emit = defineEmits<{ saved: [note: NoteFile & { version: number }]; deleted: [id: string]; created: [id: string] }>();

interface Saved extends NoteFile {
  version: number;
}

const id = ref<string | null>(props.noteId);
const version = ref(0);
const title = ref('');
const body = ref('');
const lessonOfNote = ref<string | null>(props.lessonId);
const updatedAt = ref<string | null>(null);
const loading = ref(false);
const status = ref<'saved' | 'dirty' | 'saving' | 'offline' | 'conflict' | 'idle'>('idle');
const message = ref('');
const conflict = ref<Saved | null>(null);

let timer: ReturnType<typeof setTimeout> | undefined;
let inFlight = false;
let again = false;
let loadedSnapshot = '';

const dirtyKey = () => `${title.value}\u0000${body.value}`;

function adopt(note: Saved): void {
  id.value = note.id;
  version.value = note.version;
  title.value = note.title;
  body.value = note.bodyMd;
  lessonOfNote.value = note.lessonId;
  updatedAt.value = note.updatedAt;
  loadedSnapshot = dirtyKey();
}

async function load(noteId: string | null): Promise<void> {
  clearTimeout(timer);
  conflict.value = null;
  message.value = '';

  if (!noteId) {
    id.value = null;
    version.value = 0;
    title.value = '';
    body.value = '';
    lessonOfNote.value = props.lessonId;
    updatedAt.value = null;
    loadedSnapshot = dirtyKey();
    status.value = 'idle';

    return;
  }

  loading.value = true;

  try {
    adopt((await api<{ note: Saved }>(`/api/me/notes/${noteId}`)).note);
    status.value = 'saved';
  } catch (error) {
    message.value = error instanceof ApiError ? error.message : 'Não foi possível abrir a anotação.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void load(props.noteId);
  document.addEventListener('visibilitychange', flushWhenHidden);
});

onBeforeUnmount(() => {
  clearTimeout(timer);
  document.removeEventListener('visibilitychange', flushWhenHidden);
});

watch(() => props.noteId, (next) => {
  if (next !== id.value) {
    void load(next);
  }
});

function flushWhenHidden(): void {
  if (document.visibilityState === 'hidden' && status.value === 'dirty') {
    clearTimeout(timer);
    void save();
  }
}

function touched(): void {
  if (loading.value || dirtyKey() === loadedSnapshot || status.value === 'conflict') {
    return;
  }

  status.value = 'dirty';
  clearTimeout(timer);
  timer = setTimeout(() => void save(), 1200);
}

watch([title, body], touched);

async function save(): Promise<void> {
  if (inFlight) {
    again = true;

    return;
  }

  // Nothing to create yet: an empty new note is not saved.
  if (!id.value && !title.value.trim() && !body.value.trim()) {
    status.value = 'idle';

    return;
  }

  inFlight = true;
  status.value = 'saving';

  const sent = dirtyKey();
  const payload = { title: title.value, bodyMd: body.value, lessonId: lessonOfNote.value };

  try {
    let note: Saved;

    if (id.value) {
      note = (await api<{ note: Saved }>(`/api/me/notes/${id.value}`, { method: 'PUT', json: { ...payload, version: version.value } })).note;
    } else {
      note = (await api<{ note: Saved }>('/api/me/notes', { method: 'POST', json: payload })).note;
      emit('created', note.id);
    }

    id.value = note.id;
    version.value = note.version;
    updatedAt.value = note.updatedAt;
    loadedSnapshot = sent;
    status.value = dirtyKey() === sent ? 'saved' : 'dirty';
    message.value = '';
    emit('saved', note);
  } catch (error) {
    if (error instanceof ApiError && error.code === 'version_conflict') {
      conflict.value = error.body.note as Saved;
      status.value = 'conflict';
    } else if (error instanceof ApiError && error.status === 0) {
      status.value = 'offline';
      setTimeout(() => void save(), 5000);
    } else {
      status.value = 'dirty';
      message.value = error instanceof ApiError ? error.message : 'Não foi possível salvar.';
    }
  } finally {
    inFlight = false;

    if (again) {
      again = false;
      void save();
    }
  }
}

function keepSaved(): void {
  if (conflict.value) {
    adopt(conflict.value);
  }

  conflict.value = null;
  status.value = 'saved';
}

function keepMine(): void {
  if (conflict.value) {
    version.value = conflict.value.version;
  }

  conflict.value = null;
  status.value = 'dirty';
  void save();
}

async function remove(): Promise<void> {
  if (!id.value || !window.confirm('Apagar esta anotação? Não dá para desfazer.')) {
    return;
  }

  try {
    await api(`/api/me/notes/${id.value}`, { method: 'DELETE' });
    emit('deleted', id.value);
  } catch (error) {
    message.value = error instanceof ApiError ? error.message : 'Não foi possível apagar.';
  }
}

const statusText = computed(() => {
  switch (status.value) {
    case 'saved':
      return updatedAt.value ? `Salvo (${shortDateTime(updatedAt.value)})` : 'Salvo';
    case 'dirty':
      return 'Alterações ainda não salvas';
    case 'saving':
      return 'Salvando…';
    case 'offline':
      return 'Sem conexão. Vou tentar de novo sozinho.';
    case 'conflict':
      return 'Esta anotação mudou em outro lugar';
    default:
      return 'Comece a escrever: o texto é salvo sozinho.';
  }
});

const lessonLabel = computed(() => lessonTitle(lessonOfNote.value));
const lessonHref = computed(() => (lessonOfNote.value ? `/aprender/${lessonOfNote.value}` : null));

function download(): void {
  downloadNote({ id: id.value ?? 'nova', title: title.value, bodyMd: body.value, lessonId: lessonOfNote.value, updatedAt: updatedAt.value });
}
</script>

<template>
  <div class="note-workspace" :aria-busy="loading">
    <label class="acct-field">
      <span class="visually-hidden">Título da anotação</span>
      <input v-model="title" class="note-workspace__title" maxlength="120" placeholder="Título (opcional)" />
    </label>

    <p v-if="lessonLabel && lessonHref" class="acct-muted note-workspace__lesson">
      Aula: <a :href="lessonHref">{{ lessonLabel }}</a>
    </p>

    <NoteEditor v-model="body" :label="title || 'anotação'" />

    <div v-if="conflict" class="acct-note" role="alert">
      <p>
        Esta anotação foi alterada em outra aba ou aparelho. O que você quer manter?
      </p>
      <button type="button" class="acct-btn" @click="keepSaved">Usar a versão salva</button>
      <button type="button" class="acct-btn acct-btn--primary" @click="keepMine">Manter a minha</button>
    </div>

    <div class="note-workspace__foot">
      <p class="acct-muted" role="status" aria-live="polite">{{ statusText }}</p>
      <div>
        <button type="button" class="acct-btn acct-btn--quiet" :disabled="!body && !title" @click="download">Baixar .md</button>
        <button v-if="id" type="button" class="acct-btn acct-btn--quiet acct-btn--danger-text" @click="remove">Apagar</button>
      </div>
    </div>
    <p v-if="message" class="acct-error" role="alert">{{ message }}</p>
  </div>
</template>
