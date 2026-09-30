import { beforeEach, describe, expect, it } from 'vitest';
import { createHarness, type Harness } from './helpers.ts';

let h: Harness;

beforeEach(async () => {
  h = await createHarness();
});

const lesson = 'pensar-em-codigo/primeiro-programa/ola';

async function say(cookie: string, bodyMd: string, parentId?: string) {
  return h.request('/api/comments', {
    json: { targetType: 'lesson', targetId: lesson, bodyMd, ...(parentId ? { parentId } : {}) },
    cookie,
  });
}

async function saveProfile(cookie: string, changes: Record<string, unknown>) {
  const me = (await h.request('/api/me', { cookie })).data.profile;

  // The automatic handle (aluno-xxxxxx) cannot be sent back, so the test picks its own.
  return h.request('/api/me/profile', {
    method: 'PUT',
    cookie,
    json: { name: me.name, handle: 'ana-teste', bio: me.bio, isPublic: me.isPublic, showInRankings: me.showInRankings, ...changes },
  });
}

describe('bio e comentários com @ e emojis', () => {
  it('@usuario e @usuario.com.br são citações, não endereços', async () => {
    const ana = await h.signIn('ana@example.com');
    const saved = await saveProfile(ana, { bio: 'Colaborador @poppy-team | @wasd.lat 👩‍💻 ❤️‍🔥 🌸' });

    expect(saved.status).toBe(200);
    expect(saved.data.profile.bio).toBe('Colaborador @poppy-team | @wasd.lat 👩‍💻 ❤️‍🔥 🌸');
    expect((await say(ana, 'Fale com @bia.dev sobre isso 🎉')).status).toBe(201);
  });

  it('endereços de verdade continuam de fora', async () => {
    const ana = await h.signIn('ana@example.com');

    for (const bio of ['veja wasd.lat', 'https://exemplo.com', 'fale@wasd.lat', 'oi @ana@evil.com']) {
      expect((await saveProfile(ana, { bio })).status, bio).toBe(422);
    }

    expect((await say(ana, 'entre em wasd.lat')).status).toBe(422);
  });

  it('o ligador de emojis só vale entre emojis', async () => {
    const ana = await h.signIn('ana@example.com');

    for (const bio of ['a‍b', '‍👩', '👩‍', 'oculto\u{E0041}']) {
      expect((await saveProfile(ana, { bio })).status, JSON.stringify(bio)).toBe(422);
    }
  });
});

describe('avisos de respostas e painel', () => {
  it('quem responde gera um aviso novo; abrir a lista zera; a própria resposta não conta', async () => {
    const ana = await h.signIn('ana@example.com');
    const bia = await h.signIn('bia@example.com');
    const root = (await say(ana, 'Como uso o **print**?')).data.comment;

    // The profile was made a second ago; replies count from the time it was made.
    await h.client.execute(`UPDATE profiles SET created_at = datetime('now', '-1 hour')`);

    expect((await h.request('/api/me/notifications', { cookie: ana })).data.unread).toBe(0);

    await say(ana, 'Eu mesma respondendo', root.id);
    await say(bia, 'Use aspas: `print("oi")`', root.id);

    const before = await h.request('/api/me/notifications', { cookie: ana });

    expect(before.data.unread).toBe(1);
    expect(before.data.items).toHaveLength(1);
    expect(before.data.items[0]).toMatchObject({ lessonId: lesson, isNew: true, excerpt: 'Use aspas: print("oi")' });
    expect(before.data.items[0].by.name).toBeTruthy();
    expect(JSON.stringify(before.data)).not.toContain('bia@example.com');

    // Bia does not get an alert for her own reply, nor for Ana's.
    expect((await h.request('/api/me/notifications', { cookie: bia })).data.unread).toBe(0);

    expect((await h.request('/api/me/notifications/seen', { method: 'POST', json: {}, cookie: ana })).data.unread).toBe(0);

    const after = await h.request('/api/me/notifications', { cookie: ana });

    expect(after.data.unread).toBe(0);
    expect(after.data.items[0].isNew).toBe(false);
  });

  describe('gestão dos avisos', () => {
    async function withReplies(count: number) {
      const ana = await h.signIn('ana@example.com');
      const bia = await h.signIn('bia@example.com');
      const root = (await say(ana, 'Dúvida')).data.comment;

      await h.client.execute(`UPDATE profiles SET created_at = datetime('now', '-1 hour')`);

      for (let index = 1; index <= count; index += 1) {
        await say(bia, `Resposta ${index}`, root.id);
      }

      return { ana, bia };
    }

    const list = async (cookie: string, query = '') => (await h.request(`/api/me/notifications${query}`, { cookie })).data;

    it('marca um aviso como lido sem mexer nos outros', async () => {
      const { ana } = await withReplies(3);
      const first = (await list(ana)).items[0];

      const done = await h.request('/api/me/notifications/read', { method: 'POST', json: { ids: [first.id] }, cookie: ana });

      expect(done.status).toBe(200);
      expect(done.data.unread).toBe(2);

      const after = await list(ana);

      expect(after.total).toBe(3);
      expect(after.items.find((item: { id: string }) => item.id === first.id).isNew).toBe(false);
      expect(after.items.filter((item: { isNew: boolean }) => item.isNew)).toHaveLength(2);
    });

    it('exclui um aviso, e ele some da lista e da contagem', async () => {
      const { ana } = await withReplies(3);
      const first = (await list(ana)).items[0];

      const done = await h.request('/api/me/notifications/delete', { method: 'POST', json: { ids: [first.id] }, cookie: ana });

      expect(done.data.unread).toBe(2);

      const after = await list(ana);

      expect(after.total).toBe(2);
      expect(after.items.map((item: { id: string }) => item.id)).not.toContain(first.id);
    });

    it('marcar todos como lidos zera a contagem e mantém a lista', async () => {
      const { ana } = await withReplies(3);

      expect((await h.request('/api/me/notifications/read-all', { method: 'POST', json: {}, cookie: ana })).data.unread).toBe(0);

      const after = await list(ana);

      expect(after.total).toBe(3);
      expect(after.items.every((item: { isNew: boolean }) => !item.isNew)).toBe(true);
    });

    it('excluir todas esvazia a lista, mas respostas novas voltam a aparecer', async () => {
      const { ana, bia } = await withReplies(2);

      expect((await h.request('/api/me/notifications/delete-all', { method: 'POST', json: {}, cookie: ana })).data.total).toBe(0);
      expect((await list(ana)).items).toHaveLength(0);

      // Timestamps have a one-second resolution: move the past back so the next reply is clearly later.
      await h.client.execute(`UPDATE comments SET created_at = datetime('now', '-1 hour')`);
      await h.client.execute(`UPDATE profiles SET notifications_cleared_at = datetime('now', '-30 minutes')`);

      const again = (await h.request('/api/comments', { cookie: ana, json: { targetType: 'lesson', targetId: lesson, bodyMd: 'Outra' } })).data
        .comment;

      await say(bia, 'Resposta nova', again.id);

      const after = await list(ana);

      expect(after.items).toHaveLength(1);
      expect(after.items[0].excerpt).toBe('Resposta nova');
    });

    it('pagina e filtra só os não lidos', async () => {
      const { ana } = await withReplies(5);
      const all = await list(ana);

      await h.request('/api/me/notifications/read', { method: 'POST', json: { ids: [all.items[0].id, all.items[1].id] }, cookie: ana });

      const page = await list(ana, '?limit=2&offset=0');

      expect(page.items).toHaveLength(2);
      expect(page.more).toBe(true);
      expect(page.total).toBe(5);

      const unread = await list(ana, '?filter=unread');

      expect(unread.items).toHaveLength(3);
      expect(unread.items.every((item: { isNew: boolean }) => item.isNew)).toBe(true);
    });

    it('ignora avisos de outras pessoas', async () => {
      const { ana, bia } = await withReplies(2);
      const first = (await list(ana)).items[0];

      // Bia has no replies of her own; naming Ana's notification must change nothing.
      await h.request('/api/me/notifications/delete', { method: 'POST', json: { ids: [first.id] }, cookie: bia });
      await h.request('/api/me/notifications/read', { method: 'POST', json: { ids: [first.id] }, cookie: bia });

      const after = await list(ana);

      expect(after.total).toBe(2);
      expect(after.unread).toBe(2);
    });

    it('pede entrada e ids válidos', async () => {
      const { ana } = await withReplies(1);

      for (const action of ['read', 'delete', 'read-all', 'delete-all']) {
        expect((await h.request(`/api/me/notifications/${action}`, { method: 'POST', json: { ids: [] } })).status, action).toBe(401);
      }

      expect((await h.request('/api/me/notifications/read', { method: 'POST', json: { ids: [] }, cookie: ana })).status).toBe(422);
      expect((await h.request('/api/me/notifications/read', { method: 'POST', json: {}, cookie: ana })).status).toBe(422);
    });
  });

  it('só quem entrou vê avisos e painel', async () => {
    expect((await h.request('/api/me/notifications')).status).toBe(401);
    expect((await h.request('/api/me/dashboard')).status).toBe(401);
    expect((await h.request('/api/me/notifications/seen', { method: 'POST', json: {} })).status).toBe(401);
  });

  it('o painel conta comentários escritos e respostas recebidas', async () => {
    const ana = await h.signIn('ana@example.com');
    const bia = await h.signIn('bia@example.com');
    const root = (await say(ana, 'Primeira dúvida')).data.comment;

    await say(bia, 'Resposta 1', root.id);
    await say(bia, 'Resposta 2', root.id);
    await say(ana, 'Obrigada!', root.id);

    const panel = (await h.request('/api/me/dashboard', { cookie: ana })).data.comments;

    expect(panel.written).toBe(2);
    expect(panel.repliesReceived).toBe(2);
    expect(panel.recent[0].excerpt).toBe('Obrigada!');
    expect(panel.recent.find((item: { excerpt: string }) => item.excerpt === 'Primeira dúvida').replies).toBe(2);
  });

  it('resposta escondida pela moderação não gera aviso', async () => {
    const ana = await h.signIn('ana@example.com');
    const bia = await h.signIn('bia@example.com');
    const root = (await say(ana, 'Dúvida')).data.comment;
    const reply = (await say(bia, 'Resposta ofensiva', root.id)).data.comment;

    await h.client.execute({ sql: `UPDATE comments SET status = 'hidden_by_moderator' WHERE id = ?`, args: [reply.id] });

    expect((await h.request('/api/me/notifications', { cookie: ana })).data.unread).toBe(0);
  });
});
