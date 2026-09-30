<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import type { Editor } from '@tiptap/core';

/**
 * The note editor. Markdown is the source of truth: the visual editor
 * (Tiptap) reads and writes Markdown, and a plain "Markdown" view with a
 * textarea is always one click away. If the visual editor cannot load, the
 * textarea takes over, so writing never depends on it.
 */
const model = defineModel<string>({ required: true });
defineProps<{ label: string }>();

const mode = ref<'visual' | 'markdown'>('visual');
const host = ref<HTMLElement | null>(null);
const editor = shallowRef<Editor | null>(null);
const active = ref<Record<string, boolean>>({});
// The last Markdown this editor produced. A change of the model that equals it came from typing and must not be loaded back.
let lastEmitted = model.value;

function refreshActive(): void {
  const current = editor.value;

  if (!current) {
    return;
  }

  active.value = {
    bold: current.isActive('bold'),
    italic: current.isActive('italic'),
    code: current.isActive('code'),
    heading: current.isActive('heading', { level: 3 }),
    bulletList: current.isActive('bulletList'),
    orderedList: current.isActive('orderedList'),
    blockquote: current.isActive('blockquote'),
    codeBlock: current.isActive('codeBlock'),
  };
}

onMounted(async () => {
  try {
    const stored = globalThis.localStorage?.getItem('poppy.notes.mode');

    if (stored === 'markdown') {
      mode.value = 'markdown';
    }
  } catch {
    // Nothing remembered; the visual editor is the default.
  }

  try {
    const [{ Editor: TiptapEditor }, { default: StarterKit }, { Markdown }] = await Promise.all([
      import('@tiptap/core'),
      import('@tiptap/starter-kit'),
      import('@tiptap/markdown'),
    ]);

    if (!host.value) {
      return;
    }

    editor.value = new TiptapEditor({
      element: host.value,
      extensions: [StarterKit.configure({ link: { openOnClick: false, autolink: true } }), Markdown],
      content: model.value,
      contentType: 'markdown',
      editorProps: {
        attributes: { class: 'note-editor__content vp-doc', 'aria-label': 'Texto da anotação', role: 'textbox', 'aria-multiline': 'true' },
      },
      onUpdate: ({ editor: current }) => {
        lastEmitted = current.getMarkdown();
        model.value = lastEmitted;
        refreshActive();
      },
      onSelectionUpdate: refreshActive,
    });
  } catch {
    mode.value = 'markdown';
  }
});

onBeforeUnmount(() => editor.value?.destroy());

// A note that changes from outside (another note opened, a saved version chosen) is loaded into the editor.
watch(model, (value) => {
  const current = editor.value;

  if (current && value !== lastEmitted) {
    lastEmitted = value;
    current.commands.setContent(value, { contentType: 'markdown' });
  }
});

function choose(next: 'visual' | 'markdown'): void {
  if (next === 'visual' && !editor.value) {
    return;
  }

  mode.value = next;

  try {
    globalThis.localStorage?.setItem('poppy.notes.mode', next);
  } catch {
    // Not remembered; harmless.
  }

  if (next === 'visual') {
    editor.value?.commands.setContent(model.value, { contentType: 'markdown' });
  }
}

const tools = [
  { key: 'bold', label: 'Negrito', run: (e: Editor) => e.chain().focus().toggleBold().run() },
  { key: 'italic', label: 'Itálico', run: (e: Editor) => e.chain().focus().toggleItalic().run() },
  { key: 'heading', label: 'Título', run: (e: Editor) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { key: 'bulletList', label: 'Lista', run: (e: Editor) => e.chain().focus().toggleBulletList().run() },
  { key: 'orderedList', label: 'Lista numerada', run: (e: Editor) => e.chain().focus().toggleOrderedList().run() },
  { key: 'blockquote', label: 'Citação', run: (e: Editor) => e.chain().focus().toggleBlockquote().run() },
  { key: 'code', label: 'Código', run: (e: Editor) => e.chain().focus().toggleCode().run() },
  { key: 'codeBlock', label: 'Bloco de código', run: (e: Editor) => e.chain().focus().toggleCodeBlock().run() },
];
</script>

<template>
  <div class="note-editor">
    <div class="note-editor__bar">
      <div v-show="mode === 'visual'" class="note-editor__tools" role="toolbar" :aria-label="`Formatação: ${label}`">
        <button
          v-for="tool in tools"
          :key="tool.key"
          type="button"
          :aria-pressed="Boolean(active[tool.key])"
          :disabled="!editor"
          @click="editor && tool.run(editor)"
        >
          {{ tool.label }}
        </button>
      </div>
      <div class="note-editor__modes" role="group" aria-label="Modo de edição">
        <button type="button" :aria-pressed="mode === 'visual'" :disabled="!editor" @click="choose('visual')">Visual</button>
        <button type="button" :aria-pressed="mode === 'markdown'" @click="choose('markdown')">Markdown</button>
      </div>
    </div>

    <div v-show="mode === 'visual'" ref="host" class="note-editor__host" />
    <textarea
      v-show="mode === 'markdown'"
      v-model="model"
      class="note-editor__markdown"
      rows="12"
      spellcheck="false"
      :aria-label="`Markdown: ${label}`"
    />
  </div>
</template>
