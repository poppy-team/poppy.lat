import { beforeEach, describe, expect, it } from 'vitest';
import { createHarness, type Harness } from './helpers.ts';

let h: Harness;

beforeEach(async () => {
  h = await createHarness();
});

async function admin() {
  const cookie = await h.signIn('admin@example.com');

  await h.setRole('admin@example.com', 'admin');

  return cookie;
}

describe('gestão de pessoas', () => {
  it('só admin vê a lista; visitante, aluno, contribuidor e criador não', async () => {
    expect((await h.request('/api/gestao/users')).status).toBe(401);

    for (const role of ['student', 'contributor', 'creator'] as const) {
      const email = `${role}@example.com`;
      const cookie = await h.signIn(email);

      await h.setRole(email, role);

      expect((await h.request('/api/gestao/users', { cookie })).status, role).toBe(403);
      expect((await h.request('/api/gestao/summary', { cookie })).status, role).toBe(403);
    }

    expect((await h.request('/api/gestao/users', { cookie: await admin() })).status).toBe(200);
  });

  it('lista, busca por nome, apelido ou e-mail, filtra por papel e pagina', async () => {
    const boss = await admin();

    for (const name of ['ana', 'bia', 'caio', 'duda']) {
      await h.signIn(`${name}@example.com`);
    }

    await h.setRole('bia@example.com', 'creator');

    const all = await h.request('/api/gestao/users', { cookie: boss });

    expect(all.data.total).toBe(5);
    expect(all.data.users[0]).toEqual(
      expect.objectContaining({ email: expect.any(String), role: expect.any(String), handle: expect.any(String), banned: false }),
    );

    expect((await h.request('/api/gestao/users?q=caio', { cookie: boss })).data.users.map((user: { email: string }) => user.email)).toEqual(['caio@example.com']);
    expect((await h.request('/api/gestao/users?role=creator', { cookie: boss })).data.users.map((user: { email: string }) => user.email)).toEqual(['bia@example.com']);

    const page = await h.request('/api/gestao/users?limit=2&offset=0', { cookie: boss });

    expect(page.data.users).toHaveLength(2);
    expect(page.data.more).toBe(true);
    expect((await h.request('/api/gestao/users?limit=2&offset=4', { cookie: boss })).data.more).toBe(false);
  });

  it('o termo de busca é literal: % e _ não viram curinga', async () => {
    const boss = await admin();

    await h.signIn('ana@example.com');

    expect((await h.request('/api/gestao/users?q=%25', { cookie: boss })).data.total).toBe(0);
    expect((await h.request('/api/gestao/users?q=_', { cookie: boss })).data.total).toBe(0);
  });

  it('recusa filtro de papel inventado e limite absurdo', async () => {
    const boss = await admin();

    expect((await h.request('/api/gestao/users?role=dono', { cookie: boss })).status).toBe(422);
    expect((await h.request('/api/gestao/users?limit=5000', { cookie: boss })).status).toBe(422);
  });

  it('o resumo conta as pessoas de cada papel', async () => {
    const boss = await admin();

    await h.signIn('ana@example.com');
    await h.signIn('bia@example.com');
    await h.setRole('bia@example.com', 'creator');

    expect((await h.request('/api/gestao/summary', { cookie: boss })).data.byRole).toEqual({ student: 1, contributor: 0, creator: 1, admin: 1 });
  });
});

describe('papel de criador', () => {
  it('o admin promove a criador, o selo muda na hora e o criador não modera', async () => {
    const boss = await admin();
    const ana = await h.signIn('ana@example.com');
    const handle = await h.handleOf(ana);

    const promoted = await h.request(`/api/mod/users/${handle}/role`, { method: 'PUT', cookie: boss, json: { role: 'creator', reason: 'vai escrever aulas' } });

    expect(promoted.status).toBe(200);
    expect((await h.request('/api/me', { cookie: ana })).data.user.role).toBe('creator');
    expect((await h.request('/api/me', { cookie: ana })).data.profile.badge).toBe('creator');

    // Content is for creators; moderation is not.
    expect((await h.request('/api/mod/reports', { cookie: ana })).status).toBe(403);
    expect((await h.request('/api/mod/log', { cookie: ana })).status).toBe(403);
  });

  it('criador e contribuidor não mudam o papel de ninguém, nem o próprio', async () => {
    const boss = await admin();
    const ana = await h.signIn('ana@example.com');
    const bia = await h.signIn('bia@example.com');

    await h.setRole('ana@example.com', 'creator');
    await h.setRole('bia@example.com', 'contributor');

    const anaHandle = await h.handleOf(ana);
    const biaHandle = await h.handleOf(bia);
    const change = (cookie: string, handle: string) =>
      h.request(`/api/mod/users/${handle}/role`, { method: 'PUT', cookie, json: { role: 'admin', reason: 'tentando subir' } });

    expect((await change(ana, anaHandle)).status).toBe(403);
    expect((await change(ana, biaHandle)).status).toBe(403);
    expect((await change(bia, anaHandle)).status).toBe(403);
    expect((await change(bia, biaHandle)).status).toBe(403);

    // The change is written in the log.
    await h.request(`/api/mod/users/${anaHandle}/role`, { method: 'PUT', cookie: boss, json: { role: 'student', reason: 'pausa' } });

    const log = await h.request('/api/mod/log', { cookie: boss });

    expect(log.data.entries.some((entry: { action: string; reason: string }) => entry.action === 'role_change' && entry.reason.includes('creator -> student'))).toBe(true);
  });

  it('o admin não muda outro admin nem a si mesmo', async () => {
    const boss = await admin();
    const other = await h.signIn('outro@example.com');

    await h.setRole('outro@example.com', 'admin');

    const handle = await h.handleOf(other);

    expect((await h.request(`/api/mod/users/${handle}/role`, { method: 'PUT', cookie: boss, json: { role: 'student', reason: 'teste do limite' } })).status).toBe(403);
    expect((await h.request(`/api/mod/users/${await h.handleOf(boss)}/role`, { method: 'PUT', cookie: boss, json: { role: 'student', reason: 'teste do limite' } })).status).toBe(403);
  });

  it('criadores com perfil público aparecem na equipe', async () => {
    const ana = await h.signIn('ana@example.com');

    await h.request('/api/me/profile', {
      method: 'PUT',
      cookie: ana,
      json: { name: 'Ana Costa', handle: 'ana-costa', bio: 'Escreve as aulas', isPublic: true, showInRankings: false },
    });
    await h.setRole('ana@example.com', 'creator');

    const team = await h.request('/api/team');

    expect(team.data.members.map((member: { name: string; badge: string }) => `${member.name}:${member.badge}`)).toEqual(['Ana Costa:creator']);
  });
});
