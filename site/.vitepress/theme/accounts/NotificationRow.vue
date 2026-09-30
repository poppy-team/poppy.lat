<script setup lang="ts">
import { shortDateTime, type NotificationItem } from './api';
import { lessonHref, lessonTitle } from './lessons';

/**
 * One notification: who answered, where, and what they said, with its two
 * actions. The whole text is a link to the conversation; opening it counts as
 * reading it.
 */
defineProps<{
  item: NotificationItem;
  /** Shows the words next to the icons, where there is room for them. */
  labels?: boolean;
}>();

defineEmits<{
  visit: [item: NotificationItem, event: MouseEvent];
  read: [item: NotificationItem];
  remove: [item: NotificationItem];
}>();
</script>

<template>
  <li class="note-row" :class="{ 'note-row--new': item.isNew }">
    <a class="note-row__link" :href="lessonHref(item.lessonId)" @click="$emit('visit', item, $event)">
      <span class="note-row__dot" aria-hidden="true" />
      <span class="note-row__text">
        <span class="note-row__who">
          <strong>{{ item.by.name || 'Alguém' }}</strong> respondeu em {{ lessonTitle(item.lessonId) }}
          <span v-if="item.isNew" class="bell__new">novo</span>
        </span>
        <span class="note-row__excerpt">{{ item.excerpt }}</span>
        <span class="note-row__time">{{ shortDateTime(item.createdAt) }}</span>
      </span>
    </a>

    <div class="note-row__actions">
      <button
        v-if="item.isNew"
        type="button"
        class="note-row__btn"
        :title="labels ? undefined : 'Marcar como lido'"
        :aria-label="`Marcar como lido: resposta de ${item.by.name || 'alguém'}`"
        @click="$emit('read', item)"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
        <span v-if="labels" class="note-row__btn-text">Marcar como lido</span>
      </button>
      <button
        type="button"
        class="note-row__btn note-row__btn--remove"
        :title="labels ? undefined : 'Excluir'"
        :aria-label="`Excluir aviso: resposta de ${item.by.name || 'alguém'}`"
        @click="$emit('remove', item)"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
        </svg>
        <span v-if="labels" class="note-row__btn-text">Excluir</span>
      </button>
    </div>
  </li>
</template>
