<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { api, ApiError, isStaff, reactionEmojis, shortDateTime, type CommentView } from './api';
import Avatar from './Avatar.vue';
import EmojiPicker from './EmojiPicker.vue';
import RoleBadge from './RoleBadge.vue';
import { me } from './session';

/**
 * One comment and everything that can be done to it: react, reply, edit,
 * delete or report, and for the team hide, restore, pin and mark as official.
 * The body is turned into HTML by `render`, which is sanitised.
 */
const props = defineProps<{ comment: CommentView; render: (source: string) => string; reply: boolean }>();
const emit = defineEmits<{ changed: []; replyTo: [id: string] }>();

const mode = ref<'none' | 'edit' | 'report' | 'hide' | 'delete'>('none');
const draft = ref('');
const reason = ref('spam');
const details = ref('');
const hideReason = ref('');
const message = ref<{ text: string; bad: boolean } | null>(null);
const busy = ref(false);

const staff = computed(() => isStaff(me.value));
const isVisible = computed(() => props.comment.status === 'visible');
const html = computed(() => (props.comment.bodyMd ? props.render(props.comment.bodyMd) : ''));
const placeholder = computed(() =>
  props.comment.status === 'hidden_by_moderator' ? 'Comentário ocultado pela moderação.' : 'Comentário apagado por quem o escreveu.',
);

// Opening a form clears the last message; closing one (after sending) keeps its confirmation.
watch(mode, (next) => {
  if (next !== 'none') {
    message.value = null;
  }
});

async function run(action: () => Promise<unknown>, done?: string): Promise<boolean> {
  busy.value = true;
  message.value = null;

  try {
    await action();

    if (done) {
      message.value = { text: done, bad: false };
    }

    return true;
  } catch (error) {
    message.value = { text: error instanceof ApiError ? error.message : 'Não foi possível concluir.', bad: true };

    return false;
  } finally {
    busy.value = false;
  }
}

async function react(emoji: string, on: boolean): Promise<void> {
  if (!me.value) {
    message.value = { text: 'Entre para reagir.', bad: true };

    return;
  }

  const result = await api<{ reactions: CommentView['reactions'] }>(`/api/comments/${props.comment.id}/reactions`, {
    json: { emoji, on },
  }).catch((error: unknown) => {
    message.value = { text: error instanceof ApiError ? error.message : 'Não foi possível reagir.', bad: true };

    return null;
  });

  if (result) {
    props.comment.reactions = result.reactions;
  }
}

const countOf = (emoji: string) => props.comment.reactions.find((item) => item.emoji === emoji);

function startEdit(): void {
  draft.value = props.comment.bodyMd ?? '';
  mode.value = 'edit';
}

async function saveEdit(): Promise<void> {
  if (await run(() => api(`/api/comments/${props.comment.id}`, { method: 'PUT', json: { bodyMd: draft.value } }))) {
    mode.value = 'none';
    emit('changed');
  }
}

async function remove(): Promise<void> {
  if (await run(() => api(`/api/comments/${props.comment.id}`, { method: 'DELETE' }))) {
    emit('changed');
  }
}

async function sendReport(): Promise<void> {
  if (await run(() => api(`/api/comments/${props.comment.id}/report`, { json: { reason: reason.value, details: details.value } }), 'Denúncia enviada. Obrigado por avisar.')) {
    mode.value = 'none';
    message.value = { text: 'Denúncia enviada. Obrigado por avisar.', bad: false };
  }
}

async function moderate(action: 'hide' | 'restore' | 'pin' | 'unpin' | 'official' | 'unofficial'): Promise<void> {
  const base = `/api/mod/comments/${props.comment.id}`;
  const call = {
    hide: () => api(`${base}/hide`, { json: { reason: hideReason.value } }),
    restore: () => api(`${base}/restore`, { json: {} }),
    pin: () => api(`${base}/pin`, { json: { value: true } }),
    unpin: () => api(`${base}/pin`, { json: { value: false } }),
    official: () => api(`${base}/official`, { json: { value: true } }),
    unofficial: () => api(`${base}/official`, { json: { value: false } }),
  }[action];

  if (await run(call)) {
    mode.value = 'none';
    hideReason.value = '';
    emit('changed');
  }
}

function addEmoji(emoji: string): void {
  draft.value += emoji;
}

const reasons = [
  ['spam', 'Spam ou propaganda'],
  ['ofensivo', 'Ofensivo ou desrespeitoso'],
  ['fora-do-tema', 'Fora do tema'],
  ['dados-pessoais', 'Mostra dados pessoais'],
  ['outro', 'Outro motivo'],
] as const;
</script>

<template>
  <li :id="`comentario-${comment.id}`" class="comment" :class="{ 'comment--reply': reply, 'comment--official': comment.isOfficial }">
    <div class="comment__head">
      <Avatar :name="comment.author?.name ?? '?'" :photo-url="comment.author?.photoUrl ?? null" :size="36" />
      <div class="comment__who">
        <span class="comment__name">
          <a v-if="comment.author?.profilePublic" :href="`/conta/perfil?u=${comment.author.handle}`">{{ comment.author.name }}</a>
          <template v-else>{{ comment.author?.name ?? 'Conta removida' }}</template>
        </span>
        <RoleBadge v-if="comment.author" :badge="comment.author.badge" />
        <span v-if="comment.isOfficial" class="comment__tag">Resposta oficial</span>
        <span v-if="comment.isPinned" class="comment__tag">Fixado</span>
        <span v-if="staff && !isVisible" class="comment__tag comment__tag--warn">
          {{ comment.status === 'hidden_by_moderator' ? 'Oculto' : 'Apagado' }}
        </span>
        <time class="acct-muted" :datetime="comment.createdAt ?? undefined">{{ shortDateTime(comment.createdAt) }}</time>
        <span v-if="comment.editedAt" class="acct-muted">(editado)</span>
      </div>
    </div>

    <template v-if="mode === 'edit'">
      <form class="acct-form" @submit.prevent="saveEdit">
        <label class="acct-field">
          <span class="visually-hidden">Editar comentário</span>
          <textarea v-model="draft" rows="4" maxlength="2000" required />
        </label>
        <div>
          <button type="submit" class="acct-btn acct-btn--primary" :disabled="busy || !draft.trim()">Salvar</button>
          <button type="button" class="acct-btn acct-btn--quiet" @click="mode = 'none'">Cancelar</button>
          <EmojiPicker @pick="addEmoji" />
        </div>
      </form>
    </template>
    <div v-else-if="comment.bodyMd !== null" class="comment__body" v-html="html" />
    <p v-if="!isVisible && !(staff && comment.bodyMd !== null)" class="acct-muted comment__gone">{{ placeholder }}</p>
    <p v-if="staff && comment.hiddenReason" class="acct-muted acct-fine">Motivo: {{ comment.hiddenReason }}</p>

    <div v-if="isVisible" class="comment__reactions" role="group" aria-label="Reações">
      <button
        v-for="emoji in reactionEmojis"
        :key="emoji"
        type="button"
        class="reaction"
        :aria-pressed="countOf(emoji)?.mine ?? false"
        :aria-label="`${emoji}: ${countOf(emoji)?.count ?? 0} ${(countOf(emoji)?.count ?? 0) === 1 ? 'pessoa' : 'pessoas'}${countOf(emoji)?.mine ? ', inclusive você' : ''}`"
        @click="react(emoji, !(countOf(emoji)?.mine ?? false))"
      >
        <span aria-hidden="true">{{ emoji }}</span>
        <span v-if="countOf(emoji)" class="reaction__count" aria-hidden="true">{{ countOf(emoji)?.count }}</span>
      </button>
    </div>

    <div v-if="me" class="comment__actions">
      <button v-if="isVisible" type="button" class="acct-link" @click="emit('replyTo', comment.id)">Responder</button>
      <template v-if="comment.mine && isVisible">
        <button type="button" class="acct-link" @click="startEdit">Editar</button>
        <button type="button" class="acct-link" @click="mode = mode === 'delete' ? 'none' : 'delete'">Apagar</button>
      </template>
      <button v-else-if="isVisible && comment.author" type="button" class="acct-link" @click="mode = mode === 'report' ? 'none' : 'report'">Denunciar</button>
      <template v-if="staff">
        <button v-if="isVisible" type="button" class="acct-link" @click="mode = mode === 'hide' ? 'none' : 'hide'">Ocultar</button>
        <button v-else-if="comment.status === 'hidden_by_moderator'" type="button" class="acct-link" :disabled="busy" @click="moderate('restore')">Restaurar</button>
        <button v-if="isVisible && !reply" type="button" class="acct-link" :disabled="busy" @click="moderate(comment.isPinned ? 'unpin' : 'pin')">
          {{ comment.isPinned ? 'Desafixar' : 'Fixar' }}
        </button>
        <button v-if="isVisible && comment.author?.badge === 'contributor'" type="button" class="acct-link" :disabled="busy" @click="moderate(comment.isOfficial ? 'unofficial' : 'official')">
          {{ comment.isOfficial ? 'Tirar selo oficial' : 'Marcar como oficial' }}
        </button>
      </template>
    </div>

    <form v-if="mode === 'delete'" class="acct-inline" @submit.prevent="remove">
      <p>Apagar este comentário?</p>
      <button type="submit" class="acct-btn acct-btn--danger" :disabled="busy">Apagar</button>
      <button type="button" class="acct-btn acct-btn--quiet" @click="mode = 'none'">Manter</button>
    </form>

    <form v-if="mode === 'report'" class="acct-inline acct-form" @submit.prevent="sendReport">
      <label class="acct-field">
        <span>Motivo da denúncia</span>
        <select v-model="reason">
          <option v-for="item in reasons" :key="item[0]" :value="item[0]">{{ item[1] }}</option>
        </select>
      </label>
      <label class="acct-field">
        <span>Quer explicar? (opcional)</span>
        <textarea v-model="details" rows="2" maxlength="500" />
      </label>
      <div>
        <button type="submit" class="acct-btn acct-btn--primary" :disabled="busy">Enviar denúncia</button>
        <button type="button" class="acct-btn acct-btn--quiet" @click="mode = 'none'">Cancelar</button>
      </div>
    </form>

    <form v-if="mode === 'hide'" class="acct-inline acct-form" @submit.prevent="moderate('hide')">
      <label class="acct-field">
        <span>Motivo para ocultar (fica no registro da moderação)</span>
        <input v-model="hideReason" minlength="3" maxlength="300" required />
      </label>
      <div>
        <button type="submit" class="acct-btn acct-btn--danger" :disabled="busy">Ocultar</button>
        <button type="button" class="acct-btn acct-btn--quiet" @click="mode = 'none'">Cancelar</button>
      </div>
    </form>

    <p v-if="message" :class="message.bad ? 'acct-error' : 'acct-ok'" :role="message.bad ? 'alert' : 'status'">{{ message.text }}</p>
  </li>
</template>
