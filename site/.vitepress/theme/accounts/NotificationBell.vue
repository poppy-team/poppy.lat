<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vitepress';
import type { NotificationItem } from './api';
import NotificationRow from './NotificationRow.vue';
import NotificationsWindow from './NotificationsWindow.vue';
import {
  announcement,
  failed,
  hasUnread,
  loadNotifications,
  markAllRead,
  markRead,
  notificationItems,
  removeAll,
  removeNotifications,
  totalCount,
  unreadCount,
} from './notifications';
import { me } from './session';

/**
 * The bell in the header: replies to your comments, with a count of the ones
 * you have not read. The dropdown shows the latest few, each with its own
 * "mark as read" and "delete", plus the same two for all at once. "Ver todas"
 * opens the window with the whole list. Nothing is marked as read only because
 * the list was opened: a notification is read when you say so, or open it.
 */
const router = useRouter();
const open = ref(false);
const windowOpen = ref(false);
const confirming = ref(false);
const root = ref<HTMLElement | null>(null);
const button = ref<HTMLButtonElement | null>(null);
/** Distance from the top of the screen to the dropdown on a phone, where it is fixed under the header. */
const top = ref('4rem');
const ringing = ref(false);

const label = computed(() =>
  unreadCount.value
    ? `Avisos: ${unreadCount.value} ${unreadCount.value === 1 ? 'resposta nova' : 'respostas novas'}`
    : 'Avisos: nada de novo',
);

function place(): void {
  const box = button.value?.getBoundingClientRect();

  top.value = `${Math.round((box?.bottom ?? 56) + 8)}px`;
}

async function toggle(): Promise<void> {
  open.value = !open.value;
  confirming.value = false;

  if (open.value) {
    place();
    await loadNotifications('all', 6);
  }
}

function close(): void {
  open.value = false;
  confirming.value = false;
}

function showAll(): void {
  close();
  windowOpen.value = true;
}

function closeWindow(): void {
  windowOpen.value = false;
  button.value?.focus();
}

/** Opening a notification reads it; the page loads only after the server has been told, or after a moment. */
async function visit(item: NotificationItem, event: MouseEvent): Promise<void> {
  const plain = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

  if (!plain) {
    void markRead([item.id]);

    return;
  }

  event.preventDefault();
  await Promise.race([markRead([item.id]), new Promise((resolve) => setTimeout(resolve, 700))]);
  close();
  windowOpen.value = false;

  const link = (event.currentTarget as HTMLAnchorElement | null)?.getAttribute('href');

  if (link) {
    void router.go(link);
  }
}

async function deleteAll(): Promise<void> {
  confirming.value = false;
  await removeAll();
}

function onDocumentClick(event: MouseEvent): void {
  if (open.value && root.value && event.target instanceof Node && !root.value.contains(event.target)) {
    close();
  }
}

function onVisible(): void {
  if (document.visibilityState === 'visible' && !open.value && !windowOpen.value) {
    void loadNotifications('all', 6);
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && open.value) {
    close();
    button.value?.focus();
  }
}

onMounted(() => {
  void loadNotifications('all', 6);
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('resize', place);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick);
  document.removeEventListener('visibilitychange', onVisible);
  window.removeEventListener('resize', place);
  document.documentElement.removeAttribute('data-bell-open');
});

watch(me, () => void loadNotifications('all', 6));

// Lets the page step aside on a phone, where the dropdown covers the floating note button.
watch(open, (value) => document.documentElement.toggleAttribute('data-bell-open', value));

// The bell shakes once when something new arrives while the page is open.
watch(unreadCount, (now, before) => {
  if (now > before) {
    ringing.value = true;
    setTimeout(() => (ringing.value = false), 900);
  }
});
</script>

<template>
  <div ref="root" class="bell" @keydown="onKeydown">
    <button
      ref="button"
      type="button"
      class="bell__button"
      :class="{ 'bell__button--ring': ringing }"
      :aria-expanded="open"
      aria-controls="bell-list"
      :aria-label="label"
      @click="toggle"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9Z" />
        <path d="M10 19a2 2 0 0 0 4 0" />
      </svg>
      <span v-if="unreadCount" :key="unreadCount" class="bell__count" aria-hidden="true">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
    </button>

    <Transition name="bell-pop">
      <div v-if="open" id="bell-list" class="bell__panel" role="region" aria-label="Avisos" :style="{ '--bell-top': top }">
        <header class="bell__head">
          <h2 class="bell__title">
            Avisos
            <span v-if="unreadCount" class="bell__chip">{{ unreadCount }} {{ unreadCount === 1 ? 'novo' : 'novos' }}</span>
          </h2>
        </header>

        <div class="bell__bulk">
          <button type="button" class="bell__text-btn" :disabled="!hasUnread" @click="markAllRead">Marcar todos como lidos</button>
          <span v-if="confirming" class="bell__ask" role="group" aria-label="Confirmar exclusão">
            Excluir todas?
            <button type="button" class="bell__text-btn bell__text-btn--danger" @click="deleteAll">Sim</button>
            <button type="button" class="bell__text-btn" @click="confirming = false">Não</button>
          </span>
          <button v-else type="button" class="bell__text-btn bell__text-btn--danger" :disabled="!totalCount" @click="confirming = true">
            Excluir todas
          </button>
        </div>

        <p v-if="failed" class="acct-muted acct-fine bell__empty">Não foi possível carregar os avisos agora.</p>
        <ul v-else-if="notificationItems.length" class="note-list">
          <NotificationRow
            v-for="item in notificationItems"
            :key="item.id"
            :item="item"
            @visit="visit"
            @read="markRead([$event.id])"
            @remove="removeNotifications([$event.id])"
          />
        </ul>
        <p v-else class="acct-muted acct-fine bell__empty">
          Nada por aqui ainda. Quando alguém responder a um comentário seu, o aviso aparece neste sino.
        </p>

        <footer class="bell__foot">
          <button type="button" class="bell__all" @click="showAll">
            Ver todas<span v-if="totalCount > notificationItems.length"> ({{ totalCount }})</span>
          </button>
        </footer>
      </div>
    </Transition>

    <p class="visually-hidden" role="status" aria-live="polite">{{ announcement }}</p>

    <NotificationsWindow :open="windowOpen" @close="closeWindow" @visit="visit" />
  </div>
</template>
