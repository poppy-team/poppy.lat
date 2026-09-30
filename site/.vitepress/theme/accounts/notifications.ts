import { computed, ref } from 'vue';
import { api, type NotificationItem } from './api';
import { me } from './session';

/**
 * The notifications of the person, shared by the bell and its window so both
 * always show the same list. Changes show at once and are then confirmed by the
 * numbers the server sends back; if the server refuses, the list is read again.
 */
interface Page {
  unread: number;
  total: number;
  more: boolean;
  items: NotificationItem[];
}

interface Counts {
  unread: number;
  total: number;
}

export type NotificationFilter = 'all' | 'unread';

export const notificationItems = ref<NotificationItem[]>([]);
export const unreadCount = ref(0);
export const totalCount = ref(0);
export const hasMore = ref(false);
export const loading = ref(false);
export const failed = ref(false);
/** What was done last, worded for people who hear it instead of seeing it. */
export const announcement = ref('');

export const hasUnread = computed(() => unreadCount.value > 0);

let shown: { filter: NotificationFilter; size: number } = { filter: 'all', size: 6 };

function apply(counts: Counts): void {
  unreadCount.value = counts.unread;
  totalCount.value = counts.total;
}

/** Reads the first `size` notifications again (the bell uses a few; the window reads more as it goes). */
export async function loadNotifications(filter: NotificationFilter = shown.filter, size = shown.size): Promise<void> {
  if (!me.value) {
    notificationItems.value = [];
    apply({ unread: 0, total: 0 });
    hasMore.value = false;

    return;
  }

  shown = { filter, size: Math.min(50, Math.max(1, size)) };
  loading.value = true;

  try {
    const page = await api<Page>(`/api/me/notifications?limit=${shown.size}&filter=${filter}`);

    notificationItems.value = page.items;
    hasMore.value = page.more;
    apply(page);
    failed.value = false;
  } catch {
    failed.value = true;
  } finally {
    loading.value = false;
  }
}

/** Adds the next page to the window's list. */
export async function loadMoreNotifications(): Promise<void> {
  if (!me.value || loading.value || !hasMore.value) {
    return;
  }

  loading.value = true;

  try {
    const page = await api<Page>(
      `/api/me/notifications?limit=20&offset=${notificationItems.value.length}&filter=${shown.filter}`,
    );
    const known = new Set(notificationItems.value.map((item) => item.id));

    notificationItems.value = [...notificationItems.value, ...page.items.filter((item) => !known.has(item.id))];
    hasMore.value = page.more;
    apply(page);
    shown = { ...shown, size: Math.min(50, notificationItems.value.length) };
    failed.value = false;
  } catch {
    failed.value = true;
  } finally {
    loading.value = false;
  }
}

async function send(path: string, json: unknown): Promise<boolean> {
  try {
    apply(await api<Counts>(`/api/me/notifications/${path}`, { method: 'POST', json }));

    return true;
  } catch {
    void loadNotifications();
    announcement.value = 'Não foi possível concluir. A lista foi atualizada.';

    return false;
  }
}

export async function markRead(ids: string[]): Promise<void> {
  const chosen = new Set(ids);
  const before = notificationItems.value.filter((item) => chosen.has(item.id) && item.isNew).length;

  if (before === 0) {
    return;
  }

  notificationItems.value = notificationItems.value.map((item) => (chosen.has(item.id) ? { ...item, isNew: false } : item));
  unreadCount.value = Math.max(0, unreadCount.value - before);

  if (await send('read', { ids })) {
    announcement.value = before === 1 ? 'Aviso marcado como lido.' : 'Avisos marcados como lidos.';

    // Looking only at the unread ones, a read notification no longer belongs in the list.
    if (shown.filter === 'unread') {
      await loadNotifications();
    }
  }
}

export async function removeNotifications(ids: string[]): Promise<void> {
  const chosen = new Set(ids);
  const removed = notificationItems.value.filter((item) => chosen.has(item.id));

  if (removed.length === 0) {
    return;
  }

  notificationItems.value = notificationItems.value.filter((item) => !chosen.has(item.id));
  unreadCount.value = Math.max(0, unreadCount.value - removed.filter((item) => item.isNew).length);
  totalCount.value = Math.max(0, totalCount.value - removed.length);

  if (await send('delete', { ids })) {
    announcement.value = removed.length === 1 ? 'Aviso excluído.' : 'Avisos excluídos.';
    // Fills the gap with the next ones, when there are more.
    await loadNotifications(shown.filter, Math.max(shown.size, notificationItems.value.length));
  }
}

export async function markAllRead(): Promise<void> {
  notificationItems.value = notificationItems.value.map((item) => ({ ...item, isNew: false }));
  unreadCount.value = 0;

  if (await send('read-all', {})) {
    announcement.value = 'Todos os avisos foram marcados como lidos.';

    if (shown.filter === 'unread') {
      await loadNotifications();
    }
  }
}

export async function removeAll(): Promise<void> {
  notificationItems.value = [];
  hasMore.value = false;
  unreadCount.value = 0;
  totalCount.value = 0;

  if (await send('delete-all', {})) {
    announcement.value = 'Todos os avisos foram excluídos.';
  }
}
