<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import type { Editor } from '@tiptap/core';
import { normalizeLink, tidyMarkdown } from './note-link';

/**
 * The note editor, made to feel like a word processor: a toolbar of icons, a
 * paragraph style menu, keyboard shortcuts and a clean page to write on. It
 * offers exactly what Markdown can hold (headings, bold, italic, strike, code,
 * lists, checklists, quotes, code blocks, dividers and links), so nothing a
 * person formats is lost when the note is saved or downloaded.
 *
 * Markdown is the source of truth: the visual editor (Tiptap) reads and writes
 * Markdown, and a plain "Markdown" view with a textarea is always one click
 * away. If the visual editor cannot load, the textarea takes over, so writing
 * never depends on it.
 */
const model = defineModel<string>({ required: true });
defineProps<{ label: string }>();

const mode = ref<'visual' | 'markdown'>('visual');
const host = ref<HTMLElement | null>(null);
const bar = ref<HTMLElement | null>(null);
const linkInput = ref<HTMLInputElement | null>(null);
const editor = shallowRef<Editor | null>(null);
const active = ref<Record<string, boolean>>({});
const style = ref('p');
const canUndo = ref(false);
const canRedo = ref(false);
const linkOpen = ref(false);
const linkValue = ref('');
const linkError = ref('');
// The last Markdown this editor produced. A change of the model that equals it came from typing and must not be loaded back.
let lastEmitted = model.value;

type Icon = string[];

interface Tool {
  key: string;
  label: string;
  keys?: string;
  icon: Icon;
  group: number;
  run: (editor: Editor) => void;
}

const tools: Tool[] = [
  { key: 'undo', label: 'Desfazer', keys: 'Ctrl+Z', group: 0, icon: ['M9 14 4 9l5-5', 'M4 9h10a6 6 0 0 1 0 12h-3'], run: (e) => e.chain().focus().undo().run() },
  { key: 'redo', label: 'Refazer', keys: 'Ctrl+Shift+Z', group: 0, icon: ['m15 14 5-5-5-5', 'M20 9H10a6 6 0 0 0 0 12h3'], run: (e) => e.chain().focus().redo().run() },
  { key: 'bold', label: 'Negrito', keys: 'Ctrl+B', group: 1, icon: ['M7 5h6a3.5 3.5 0 0 1 0 7H7z', 'M7 12h7a3.5 3.5 0 0 1 0 7H7z'], run: (e) => e.chain().focus().toggleBold().run() },
  { key: 'italic', label: 'Itálico', keys: 'Ctrl+I', group: 1, icon: ['M19 4h-9', 'M14 20H5', 'M15 4 9 20'], run: (e) => e.chain().focus().toggleItalic().run() },
  { key: 'strike', label: 'Riscado', keys: 'Ctrl+Shift+S', group: 1, icon: ['M4 12h16', 'M16 6.5A4 4 0 0 0 12 5c-2.5 0-4 1.3-4 3 0 1.4 1 2.2 2.5 2.8', 'M8 17.5A5 5 0 0 0 12.5 19c2.7 0 4.5-1.4 4.5-3.2 0-.8-.3-1.4-.8-1.8'], run: (e) => e.chain().focus().toggleStrike().run() },
  { key: 'code', label: 'Código no texto', keys: 'Ctrl+E', group: 1, icon: ['m16 18 6-6-6-6', 'm8 6-6 6 6 6'], run: (e) => e.chain().focus().toggleCode().run() },
  { key: 'bulletList', label: 'Lista com marcadores', keys: 'Ctrl+Shift+8', group: 2, icon: ['M9 6h11', 'M9 12h11', 'M9 18h11', 'M4 6h.01', 'M4 12h.01', 'M4 18h.01'], run: (e) => e.chain().focus().toggleBulletList().run() },
  { key: 'orderedList', label: 'Lista numerada', keys: 'Ctrl+Shift+7', group: 2, icon: ['M10 6h11', 'M10 12h11', 'M10 18h11', 'M4 6h1v4', 'M4 10h2', 'M6 18H4c0-1 2-2 2-3s-1-1.5-2-1'], run: (e) => e.chain().focus().toggleOrderedList().run() },
  { key: 'taskList', label: 'Lista de tarefas', keys: 'Ctrl+Shift+9', group: 2, icon: ['M3 5h5v5H3z', 'm4.2 7.5 1 1 1.8-2', 'M12 7.5h9', 'M3 14h5v5H3z', 'M12 16.5h9'], run: (e) => e.chain().focus().toggleTaskList().run() },
  { key: 'blockquote', label: 'Citação', keys: 'Ctrl+Shift+B', group: 3, icon: ['M6 17h3l2-4V7H5v6h3', 'M14 17h3l2-4V7h-6v6h3'], run: (e) => e.chain().focus().toggleBlockquote().run() },
  { key: 'codeBlock', label: 'Bloco de código', keys: 'Ctrl+Alt+C', group: 3, icon: ['M4 4h16v16H4z', 'm10 9-3 3 3 3', 'm14 9 3 3-3 3'], run: (e) => e.chain().focus().toggleCodeBlock().run() },
  { key: 'rule', label: 'Linha divisória', group: 3, icon: ['M4 12h16', 'M8 6h8', 'M8 18h8'], run: (e) => e.chain().focus().setHorizontalRule().run() },
  { key: 'link', label: 'Link', keys: 'Ctrl+K', group: 4, icon: ['M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7', 'M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7'], run: () => openLink() },
];

const styles = [
  { value: 'p', label: 'Texto normal' },
  { value: '1', label: 'Título 1' },
  { value: '2', label: 'Título 2' },
  { value: '3', label: 'Título 3' },
];

function refreshActive(): void {
  const current = editor.value;

  if (!current) {
    return;
  }

  active.value = {
    bold: current.isActive('bold'),
    italic: current.isActive('italic'),
    strike: current.isActive('strike'),
    code: current.isActive('code'),
    bulletList: current.isActive('bulletList'),
    orderedList: current.isActive('orderedList'),
    taskList: current.isActive('taskList'),
    blockquote: current.isActive('blockquote'),
    codeBlock: current.isActive('codeBlock'),
    link: current.isActive('link'),
  };

  const level = current.getAttributes('heading').level as number | undefined;

  style.value = current.isActive('heading') && level ? String(level) : 'p';
  canUndo.value = current.can().undo();
  canRedo.value = current.can().redo();
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
    const [{ Editor: TiptapEditor }, { default: StarterKit }, { Markdown }, { TaskList, TaskItem }, { Placeholder }] = await Promise.all([
      import('@tiptap/core'),
      import('@tiptap/starter-kit'),
      import('@tiptap/markdown'),
      import('@tiptap/extension-list'),
      import('@tiptap/extensions'),
    ]);

    if (!host.value) {
      return;
    }

    editor.value = new TiptapEditor({
      element: host.value,
      extensions: [
        // Underline has no Markdown form, so it is left out: what you see is what is saved.
        StarterKit.configure({ underline: false, heading: { levels: [1, 2, 3] }, link: { openOnClick: false, autolink: true } }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Placeholder.configure({ placeholder: 'Comece a escrever…' }),
        Markdown,
      ],
      content: model.value,
      contentType: 'markdown',
      editorProps: {
        attributes: { class: 'note-editor__content vp-doc', 'aria-label': 'Texto da anotação', role: 'textbox', 'aria-multiline': 'true' },
        handleKeyDown: (_view, event) => {
          if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
            // The site search also answers to Ctrl+K, on the window: stop the event here.
            event.preventDefault();
            event.stopPropagation();
            openLink();

            return true;
          }

          return false;
        },
      },
      onUpdate: ({ editor: current }) => {
        lastEmitted = tidyMarkdown(current.getMarkdown());
        model.value = lastEmitted;
        refreshActive();
      },
      onSelectionUpdate: refreshActive,
      onTransaction: refreshActive,
    });
    refreshActive();
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
  linkOpen.value = false;

  try {
    globalThis.localStorage?.setItem('poppy.notes.mode', next);
  } catch {
    // Not remembered; harmless.
  }

  if (next === 'visual') {
    editor.value?.commands.setContent(model.value, { contentType: 'markdown' });
  }
}

function setStyle(event: Event): void {
  const current = editor.value;
  const value = (event.target as HTMLSelectElement).value;

  if (!current) {
    return;
  }

  if (value === 'p') {
    current.chain().focus().setParagraph().run();
  } else {
    current.chain().focus().setHeading({ level: Number(value) as 1 | 2 | 3 }).run();
  }
}

async function openLink(): Promise<void> {
  const current = editor.value;

  if (!current) {
    return;
  }

  linkValue.value = (current.getAttributes('link').href as string | undefined) ?? '';
  linkError.value = '';
  linkOpen.value = true;
  await nextTick();
  linkInput.value?.focus();
  linkInput.value?.select();
}

function closeLink(): void {
  linkOpen.value = false;
  editor.value?.commands.focus();
}

function applyLink(): void {
  const current = editor.value;
  const href = normalizeLink(linkValue.value);

  if (!current) {
    return;
  }

  if (!href) {
    linkError.value = 'Escreva um endereço de site (como poppy.lat) ou de e-mail.';

    return;
  }

  // Whatever is typed next must not grow the link, so the cursor leaves it.
  if (current.state.selection.empty && !current.isActive('link')) {
    current.chain().focus().insertContent({ type: 'text', text: linkValue.value.trim(), marks: [{ type: 'link', attrs: { href } }] }).unsetMark('link').run();
  } else {
    current.chain().focus().extendMarkRange('link').setLink({ href }).setTextSelection(current.state.selection.to).unsetMark('link').run();
  }

  linkOpen.value = false;
}

function removeLink(): void {
  editor.value?.chain().focus().extendMarkRange('link').unsetLink().run();
  linkOpen.value = false;
}

/** Besides Tab, the arrow keys move along the toolbar, as in a word processor. */
function onToolbarKey(event: KeyboardEvent): void {
  const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];

  if (!keys.includes(event.key) || !bar.value) {
    return;
  }

  const items = [...bar.value.querySelectorAll<HTMLElement>('[data-tool]:not(:disabled)')];
  const at = items.indexOf(document.activeElement as HTMLElement);

  if (at < 0) {
    return;
  }

  event.preventDefault();

  const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (at + (event.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;

  items[next]?.focus();
}

function disabled(tool: Tool): boolean {
  return !editor.value || (tool.key === 'undo' && !canUndo.value) || (tool.key === 'redo' && !canRedo.value);
}
</script>

<template>
  <div class="note-editor">
    <div class="note-editor__bar">
      <div
        v-show="mode === 'visual'"
        ref="bar"
        class="note-editor__tools"
        role="toolbar"
        :aria-label="`Formatação: ${label}`"
        @keydown="onToolbarKey"
      >
        <select class="note-editor__style" aria-label="Estilo do parágrafo" :value="style" :disabled="!editor" @change="setStyle">
          <option v-for="option in styles" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>

        <template v-for="(tool, index) in tools" :key="tool.key">
          <span v-if="index > 0 && tools[index - 1]?.group !== tool.group" class="note-editor__sep" aria-hidden="true" />
          <button
            type="button"
            data-tool
            class="note-editor__tool"
            :aria-label="tool.label"
            :title="tool.keys ? `${tool.label} (${tool.keys})` : tool.label"
            :aria-pressed="tool.key === 'undo' || tool.key === 'redo' || tool.key === 'rule' ? undefined : Boolean(active[tool.key])"
            :disabled="disabled(tool)"
            @click="editor && tool.run(editor)"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path v-for="d in tool.icon" :key="d" :d="d" />
            </svg>
          </button>
        </template>
      </div>

      <div class="note-editor__modes" role="group" aria-label="Modo de edição">
        <button type="button" :aria-pressed="mode === 'visual'" :disabled="!editor" @click="choose('visual')">Visual</button>
        <button type="button" :aria-pressed="mode === 'markdown'" @click="choose('markdown')">Markdown</button>
      </div>
    </div>

    <form v-if="linkOpen && mode === 'visual'" class="note-editor__link" @submit.prevent="applyLink" @keydown.esc.stop.prevent="closeLink">
      <label>
        <span>Endereço do link</span>
        <input ref="linkInput" v-model="linkValue" inputmode="url" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="poppy.lat ou ana@exemplo.com" />
      </label>
      <button type="submit" class="acct-btn acct-btn--primary">Aplicar</button>
      <button v-if="active.link" type="button" class="acct-btn" @click="removeLink">Remover</button>
      <button type="button" class="acct-btn acct-btn--quiet" @click="closeLink">Cancelar</button>
      <p v-if="linkError" class="acct-error" role="alert">{{ linkError }}</p>
    </form>

    <div v-show="mode === 'visual'" ref="host" class="note-editor__host" />
    <textarea
      v-show="mode === 'markdown'"
      v-model="model"
      class="note-editor__markdown"
      rows="12"
      spellcheck="false"
      :aria-label="`Markdown: ${label}`"
    />

    <p v-show="mode === 'visual'" class="note-editor__hint">
      Atalhos ao escrever: <kbd>#</kbd> + espaço faz título, <kbd>-</kbd> + espaço faz lista, <kbd>[ ]</kbd> + espaço
      faz tarefa, <kbd>&gt;</kbd> + espaço faz citação.
    </p>
  </div>
</template>
