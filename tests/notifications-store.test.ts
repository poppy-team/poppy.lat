import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The shared list behind the bell and its window: changes show at once, then
 * the numbers from the server replace the guess. The API is faked here.
 */
const calls: { path: string; json?: unknown }[] = [];
let server = { items: [] as { id: string; isNew: boolean }[] };

function counts() {
  return { unread: server.items.filter((item) => item.isNew).length, total: server.items.length };
}

vi.mock('../site/.vitepress/theme/accounts/session.ts', async () => {
  const { ref } = await import('vue');

  return { me: ref({ user: { id: 'u1' } }) };
});

vi.mock('../site/.vitepress/theme/accounts/api.ts', () => ({
  api: vi.fn(async (path: string, options: { json?: { ids?: string[] } } = {}) => {
    calls.push({ path, ...(options.json === undefined ? {} : { json: options.json }) });

    const url = new URL(path, 'http://x');
    const ids = options.json?.ids ?? [];

    if (url.pathname.endsWith('/read')) {
      server.items.forEach((item) => ids.includes(item.id) && (item.isNew = false));
    } else if (url.pathname.endsWith('/delete')) {
      server.items = server.items.filter((item) => !ids.includes(item.id));
    } else if (url.pathname.endsWith('/read-all')) {
      server.items.forEach((item) => (item.isNew = false));
    } else if (url.pathname.endsWith('/delete-all')) {
      server.items = [];
    } else {
      const limit = Number(url.searchParams.get('limit'));
      const offset = Number(url.searchParams.get('offset') ?? 0);
      const list = url.searchParams.get('filter') === 'unread' ? server.items.filter((item) => item.isNew) : server.items;

      return { ...counts(), more: list.length > offset + limit, items: list.slice(offset, offset + limit) };
    }

    return counts();
  }),
}));

const store = await import('../site/.vitepress/theme/accounts/notifications.ts');

beforeEach(async () => {
  calls.length = 0;
  server = { items: Array.from({ length: 8 }, (_, index) => ({ id: `n${index + 1}`, isNew: index < 3 })) };
  await store.loadNotifications('all', 5);
});

describe('lista de avisos', () => {
  it('lê só a primeira página e diz se há mais', () => {
    expect(store.notificationItems.value).toHaveLength(5);
    expect(store.hasMore.value).toBe(true);
    expect(store.unreadCount.value).toBe(3);
    expect(store.totalCount.value).toBe(8);
  });

  it('carregar mais junta a página seguinte sem repetir', async () => {
    await store.loadMoreNotifications();

    expect(store.notificationItems.value.map((item) => item.id)).toEqual(['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8']);
    expect(store.hasMore.value).toBe(false);
  });

  it('marcar como lido baixa a contagem e avisa o servidor só dos que eram novos', async () => {
    await store.markRead(['n1', 'n5']);

    expect(store.unreadCount.value).toBe(2);
    expect(calls.at(-1)).toEqual({ path: '/api/me/notifications/read', json: { ids: ['n1', 'n5'] } });

    const before = calls.length;

    await store.markRead(['n5']);

    expect(calls).toHaveLength(before);
  });

  it('excluir tira da lista, acerta os números e completa a página com os próximos', async () => {
    await store.removeNotifications(['n1']);

    expect(store.totalCount.value).toBe(7);
    expect(store.unreadCount.value).toBe(2);
    expect(store.notificationItems.value.map((item) => item.id)).toEqual(['n2', 'n3', 'n4', 'n5', 'n6']);
  });

  it('no filtro de não lidos, o aviso lido sai da lista', async () => {
    await store.loadNotifications('unread', 20);
    expect(store.notificationItems.value).toHaveLength(3);

    await store.markRead(['n2']);

    expect(store.notificationItems.value.map((item) => item.id)).toEqual(['n1', 'n3']);
  });

  it('marcar todos como lidos mantém a lista; excluir todas esvazia', async () => {
    await store.markAllRead();

    expect(store.unreadCount.value).toBe(0);
    expect(store.notificationItems.value).toHaveLength(5);
    expect(store.announcement.value).toMatch(/marcados como lidos/u);

    await store.removeAll();

    expect(store.notificationItems.value).toHaveLength(0);
    expect(store.totalCount.value).toBe(0);
    expect(store.hasMore.value).toBe(false);
  });
});
