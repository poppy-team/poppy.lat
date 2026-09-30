<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRoute } from 'vitepress';
import { lessonAt } from '../data/courses';
import { accountsEnabled, api, ApiError, type CommentView } from './api';
import CommentItem from './CommentItem.vue';
import EmojiPicker from './EmojiPicker.vue';
import { loadRenderer } from './render-markdown';
import { me, sessionStatus, startSession } from './session';

/**
 * The conversation at the end of a lesson. Anyone can read; writing needs an
 * account. It loads when it scrolls into view, so a lesson that is only being
 * read costs nothing extra.
 */
const route = useRoute();
const section = ref<HTMLElement | null>(null);
const textarea = ref<HTMLTextAreaElement | null>(null);
const comments = ref<CommentView[]>([]);
const total = ref(0);
const more = ref(false);
const state = ref<'idle' | 'loading' | 'ready' | 'error'>('idle');
const render = ref<(source: string) => string>(() => '');
const draft = ref('');
const replyTo = ref<string | null>(null);
const sending = ref(false);
const message = ref<{ text: string; bad: boolean } | null>(null);

const limit = 2000;

const lessonId = computed(() => {
  const place = lessonAt(route.path);

  return place ? route.path.replace(/(\.html|\/)$/u, '').replace(/^\/aprender\//u, '') : null;
});

const roots = computed(() => comments.value.filter((comment) => comment.parentId === null));
const repliesOf = (id: string) => comments.value.filter((comment) => comment.parentId === id);
const replyingTo = computed(() => comments.value.find((comment) => comment.id === replyTo.value));

async function load(reset: boolean): Promise<void> {
  if (!lessonId.value) {
    return;
  }

  state.value = 'loading';

  try {
    const [renderer, result] = await Promise.all([
      loadRenderer(),
      api<{ comments: CommentView[]; total: number; more: boolean }>(
        `/api/comments?targetType=lesson&targetId=${encodeURIComponent(lessonId.value)}&limit=20&offset=${reset ? 0 : roots.value.length}`,
      ),
    ]);

    render.value = renderer;
    comments.value = reset ? result.comments : [...comments.value, ...result.comments];
    total.value = result.total;
    more.value = result.more;
    state.value = 'ready';
  } catch {
    state.value = 'error';
  }
}

onMounted(() => {
  startSession();

  if (!('IntersectionObserver' in window) || !section.value) {
    void load(true);

    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        void load(true);
      }
    },
    { rootMargin: '400px' },
  );

  observer.observe(section.value);
});

async function send(): Promise<void> {
  if (!lessonId.value) {
    return;
  }

  sending.value = true;
  message.value = null;

  try {
    await api('/api/comments', {
      json: { targetType: 'lesson', targetId: lessonId.value, bodyMd: draft.value, ...(replyTo.value ? { parentId: replyTo.value } : {}) },
    });
    draft.value = '';
    replyTo.value = null;
    message.value = { text: 'Comentário publicado.', bad: false };
    await load(true);
  } catch (error) {
    message.value = {
      text:
        error instanceof ApiError && error.code === 'muted'
          ? `${error.message} Volta a valer depois de ${new Date(String(error.body.until)).toLocaleString('pt-BR')}.`
          : error instanceof ApiError
            ? error.message
            : 'Não foi possível publicar agora.',
      bad: true,
    };
  } finally {
    sending.value = false;
  }
}

async function startReply(id: string): Promise<void> {
  replyTo.value = id;
  await nextTick();
  textarea.value?.focus();
  textarea.value?.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function addEmoji(emoji: string): void {
  const field = textarea.value;

  if (!field) {
    draft.value += emoji;

    return;
  }

  const start = field.selectionStart;
  const end = field.selectionEnd;

  draft.value = draft.value.slice(0, start) + emoji + draft.value.slice(end);
  void nextTick(() => {
    field.focus();
    field.setSelectionRange(start + emoji.length, start + emoji.length);
  });
}
</script>

<template>
  <section v-if="accountsEnabled && lessonId" ref="section" class="comments" aria-labelledby="comments-title">
    <h2 id="comments-title">
      Conversa desta aula
      <span v-if="state === 'ready'" class="acct-muted">({{ total }})</span>
    </h2>
    <p class="acct-muted">
      Pergunte, responda e conte o que descobriu. Trate as pessoas com respeito. Leia as
      <a href="/aprender/regras">regras da comunidade</a>. Dá para usar **negrito**, *itálico*, `código` e listas.
    </p>

    <form v-if="me" class="acct-form comments__composer" @submit.prevent="send">
      <p v-if="replyingTo" class="acct-note">
        Respondendo a <strong>{{ replyingTo.author?.name ?? 'comentário removido' }}</strong>
        <button type="button" class="acct-link" @click="replyTo = null">Cancelar resposta</button>
      </p>
      <label class="acct-field">
        <span>{{ replyTo ? 'Sua resposta' : 'Seu comentário' }}</span>
        <textarea ref="textarea" v-model="draft" rows="4" :maxlength="limit" required />
        <small>{{ draft.length }} de {{ limit }} caracteres</small>
      </label>
      <div class="comments__composer-actions">
        <button type="submit" class="acct-btn acct-btn--primary" :disabled="sending || !draft.trim()">
          {{ sending ? 'Enviando…' : replyTo ? 'Responder' : 'Comentar' }}
        </button>
        <EmojiPicker @pick="addEmoji" />
      </div>
      <p v-if="message" :class="message.bad ? 'acct-error' : 'acct-ok'" :role="message.bad ? 'alert' : 'status'">{{ message.text }}</p>
    </form>

    <p v-else-if="sessionStatus === 'ready'" class="acct-note">
      <a :href="`/conta/entrar?voltar=${encodeURIComponent(route.path)}`">Entre</a> para comentar e reagir. Ler é livre.
    </p>

    <p v-if="state === 'loading'" role="status">Carregando os comentários…</p>
    <p v-else-if="state === 'error'" class="acct-error" role="alert">
      Não foi possível carregar os comentários agora. <button type="button" class="acct-link" @click="load(true)">Tentar de novo</button>
    </p>
    <p v-else-if="state === 'ready' && roots.length === 0" class="acct-muted">Ainda não há comentários. Seja a primeira pessoa.</p>

    <ol v-if="roots.length" class="comments__list">
      <template v-for="root in roots" :key="root.id">
        <CommentItem :comment="root" :render="render" :reply="false" @changed="load(true)" @reply-to="startReply" />
        <li v-if="repliesOf(root.id).length" class="comments__replies">
          <ol>
            <CommentItem
              v-for="reply in repliesOf(root.id)"
              :key="reply.id"
              :comment="reply"
              :render="render"
              :reply="true"
              @changed="load(true)"
              @reply-to="startReply"
            />
          </ol>
        </li>
      </template>
    </ol>

    <button v-if="more" type="button" class="acct-btn" :disabled="state === 'loading'" @click="load(false)">Mostrar mais comentários</button>
  </section>
</template>
