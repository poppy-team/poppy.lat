<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { api, shortDateTime, type NotificationItem } from './api';
import { lessonHref, lessonTitle } from './lessons';
import { me } from './session';

/**
 * The bell in the header: replies to your comments, with a count of the ones
 * you have not seen. Opening the list marks them as seen, but they stay
 * highlighted until you close it, so you can tell which ones were new.
 */
const open = ref(false);
const items = ref<NotificationItem[]>([]);
const unread = ref(0);
const failed = ref(false);
const root = ref<HTMLElement | null>(null);

const label = computed(() =>
  unread.value ? `Avisos: ${unread.value} ${unread.value === 1 ? 'resposta nova' : 'respostas novas'}` : 'Avisos: nada de novo',
);

async function load(): Promise<void> {
  if (!me.value) {
    return;
  }

  try {
    const result = await api<{ unread: number; items: NotificationItem[] }>('/api/me/notifications');

    items.value = result.items;
    unread.value = result.unread;
    failed.value = false;
  } catch {
    failed.value = true;
  }
}

async function toggle(): Promise<void> {
  open.value = !open.value;

  if (open.value) {
    await load();

    if (unread.value > 0) {
      // The list keeps its highlights; only the counter goes away.
      unread.value = 0;
      void api('/api/me/notifications/seen', { method: 'POST', json: {} }).catch(() => undefined);
    }
  } else {
    items.value = items.value.map((item) => ({ ...item, isNew: false }));
  }
}

function close(): void {
  if (open.value) {
    open.value = false;
    items.value = items.value.map((item) => ({ ...item, isNew: false }));
  }
}

function onDocumentClick(event: MouseEvent): void {
  if (open.value && root.value && event.target instanceof Node && !root.value.contains(event.target)) {
    close();
  }
}

function onVisible(): void {
  if (document.visibilityState === 'visible' && !open.value) {
    void load();
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && open.value) {
    close();
    root.value?.querySelector<HTMLElement>('button')?.focus();
  }
}

onMounted(() => {
  void load();
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('visibilitychange', onVisible);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick);
  document.removeEventListener('visibilitychange', onVisible);
});

watch(me, () => void load());
</script>

<template>
  <div ref="root" class="bell" @keydown="onKeydown">
    <button type="button" class="bell__button" :aria-expanded="open" aria-controls="bell-list" :aria-label="label" @click="toggle">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9Z" />
        <path d="M10 19a2 2 0 0 0 4 0" />
      </svg>
      <span v-if="unread" class="bell__count" aria-hidden="true">{{ unread > 9 ? '9+' : unread }}</span>
    </button>

    <div v-show="open" id="bell-list" class="bell__panel">
      <p class="bell__title">Respostas aos seus comentários</p>
      <p v-if="failed" class="acct-muted acct-fine">Não foi possível carregar os avisos agora.</p>
      <ul v-else-if="items.length" class="bell__items">
        <li v-for="item in items" :key="item.id" :class="{ 'bell__item--new': item.isNew }">
          <a :href="lessonHref(item.lessonId)">
            <span class="bell__who">
              <strong>{{ item.by.name || 'Alguém' }}</strong> respondeu em {{ lessonTitle(item.lessonId) }}
              <span v-if="item.isNew" class="bell__new">novo</span>
            </span>
            <span class="bell__excerpt">{{ item.excerpt }}</span>
            <span class="acct-muted acct-fine">{{ shortDateTime(item.createdAt) }}</span>
          </a>
        </li>
      </ul>
      <p v-else class="acct-muted acct-fine">
        Nada por aqui ainda. Quando alguém responder a um comentário seu, o aviso aparece neste sino.
      </p>
    </div>
  </div>
</template>
