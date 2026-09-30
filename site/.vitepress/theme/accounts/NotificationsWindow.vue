<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import type { NotificationItem } from './api';
import NotificationRow from './NotificationRow.vue';
import {
  failed,
  hasMore,
  loading,
  loadMoreNotifications,
  loadNotifications,
  markAllRead,
  markRead,
  notificationItems,
  removeAll,
  removeNotifications,
  totalCount,
  unreadCount,
  type NotificationFilter,
} from './notifications';

/**
 * Every notification, in a window of its own: a sheet rising from the bottom
 * on a phone, a centred dialog on a wide screen. It is where they are managed
 * in bulk: read them, delete them, look only at the new ones, load older ones.
 */
const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: []; visit: [item: NotificationItem, event: MouseEvent] }>();

const dialog = ref<HTMLElement | null>(null);
const filter = ref<NotificationFilter>('all');
const confirming = ref(false);

watch(
  () => props.open,
  async (value) => {
    document.documentElement.toggleAttribute('data-window-open', value);
    confirming.value = false;

    if (value) {
      filter.value = 'all';
      void loadNotifications('all', 20);
      await nextTick();
      dialog.value?.focus();
    }
  },
);

function choose(value: NotificationFilter): void {
  filter.value = value;
  void loadNotifications(value, 20);
}

async function deleteAll(): Promise<void> {
  confirming.value = false;
  await removeAll();
  dialog.value?.focus();
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.stopPropagation();
    emit('close');

    return;
  }

  if (event.key !== 'Tab' || !dialog.value) {
    return;
  }

  const focusable = [
    ...dialog.value.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
  ].filter((element) => element.offsetParent !== null);
  const first = focusable[0];
  const last = focusable.at(-1);

  if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.value)) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="note-window">
      <div v-if="open" class="note-window" @keydown="onKeydown">
        <div class="note-window__backdrop" aria-hidden="true" @click="emit('close')" />

        <section
          id="notifications-window"
          ref="dialog"
          class="note-window__dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notifications-window-title"
          tabindex="-1"
        >
          <header class="note-window__head">
            <h2 id="notifications-window-title">Todos os avisos</h2>
            <button type="button" class="note-window__close" @click="emit('close')">Fechar</button>
          </header>

          <div class="note-window__bar">
            <div class="note-window__filter" role="group" aria-label="Mostrar">
              <button type="button" :aria-pressed="filter === 'all'" @click="choose('all')">Todos</button>
              <button type="button" :aria-pressed="filter === 'unread'" @click="choose('unread')">
                Não lidos<span v-if="unreadCount"> ({{ unreadCount }})</span>
              </button>
            </div>

            <div class="note-window__bulk">
              <button type="button" class="bell__text-btn" :disabled="!unreadCount" @click="markAllRead">
                Marcar todos como lidos
              </button>
              <template v-if="confirming">
                <span class="note-window__ask" role="group" aria-label="Confirmar exclusão">
                  Excluir todas?
                  <button type="button" class="bell__text-btn bell__text-btn--danger" @click="deleteAll">Sim, excluir</button>
                  <button type="button" class="bell__text-btn" @click="confirming = false">Cancelar</button>
                </span>
              </template>
              <button v-else type="button" class="bell__text-btn bell__text-btn--danger" :disabled="!totalCount" @click="confirming = true">
                Excluir todas
              </button>
            </div>
          </div>

          <div class="note-window__body" :aria-busy="loading">
            <p v-if="failed" class="acct-muted">Não foi possível carregar os avisos agora.</p>
            <ul v-else-if="notificationItems.length" class="note-list">
              <NotificationRow
                v-for="item in notificationItems"
                :key="item.id"
                :item="item"
                labels
                @visit="(entry, event) => emit('visit', entry, event)"
                @read="markRead([$event.id])"
                @remove="removeNotifications([$event.id])"
              />
            </ul>
            <p v-else-if="loading" class="acct-muted" role="status">Carregando…</p>
            <p v-else class="acct-muted">
              {{ filter === 'unread' ? 'Nenhum aviso novo. Está tudo em dia.' : 'Nada por aqui. Quando alguém responder a um comentário seu, o aviso aparece aqui.' }}
            </p>

            <button v-if="hasMore" type="button" class="acct-btn note-window__more" :disabled="loading" @click="loadMoreNotifications">
              {{ loading ? 'Carregando…' : 'Carregar mais' }}
            </button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
