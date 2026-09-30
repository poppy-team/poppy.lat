import { beforeEach, describe, expect, it } from 'vitest';
import { createHarness, type Harness } from './helpers.ts';

let h: Harness;

beforeEach(async () => {
  h = await createHarness();
});

const lesson = 'pensar-em-codigo/primeiro-programa/ola';
const target = { targetType: 'lesson', targetId: lesson };

async function say(cookie: string, bodyMd: string, parentId?: string) {
  return h.request('/api/comments', { json: { ...target, bodyMd, ...(parentId ? { parentId } : {}) }, cookie });
}

async function list(cookie?: string) {
  return h.request(`/api/comments?targetType=lesson&targetId=${lesson}`, cookie ? { cookie } : {});
}

describe('comentários', () => {
  it('qualquer pessoa lê; só quem tem conta escreve', async () => {
    const ana = await h.signIn('ana@example.com');

    expect((await say(ana, 'Primeira!')).status).toBe(201);
    expect((await h.request('/api/comments', { json: { ...target, bodyMd: 'sem login' } })).status).toBe(401);

    const anonymous = await list();

    expect(anonymous.status).toBe(200);
    expect(anonymous.data.comments).toHaveLength(1);
    expect(anonymous.data.comments[0].author).toMatchObject({ badge: 'student', photoUrl: null });
    expect(JSON.stringify(anonymous.data)).not.toContain('ana@example.com');
  });

  it('respostas ficam num único nível, sob o comentário principal', async () => {
    const ana = await h.signIn('ana@example.com');
    const bia = await h.signIn('bia@example.com');
    const root = (await say(ana, 'Dúvida sobre o print')).data.comment;
    const reply = (await say(bia, 'Use aspas', root.id)).data.comment;
    const deeper = (await say(ana, 'Funcionou!', reply.id)).data.comment;

    expect(reply.parentId).toBe(root.id);
    expect(deeper.parentId).toBe(root.id);
    expect((await list()).data.comments.map((c: { id: string }) => c.id)).toEqual([root.id, reply.id, deeper.id]);
  });

  it('valida aula, tamanho, texto e resposta a comentário de outra aula', async () => {
    const ana = await h.signIn('ana@example.com');
    const bad = [
      { targetType: 'lesson', targetId: 'inventada/x/y', bodyMd: 'oi' },
      { targetType: 'topic', targetId: lesson, bodyMd: 'oi' },
      { ...target, bodyMd: '' },
      { ...target, bodyMd: 'x'.repeat(2001) },
      { ...target, bodyMd: 'a‮b' },
      { ...target, bodyMd: 'oi', parentId: 'nao-e-uuid' },
    ];

    for (const json of bad) {
      expect((await h.request('/api/comments', { json, cookie: ana })).status, JSON.stringify(json)).toBe(422);
    }

    expect((await h.request('/api/comments', { json: { ...target, bodyMd: 'oi', parentId: crypto.randomUUID() }, cookie: ana })).status).toBe(404);
  });

  it('não aceita imagens; links só depois de 3 comentários (alunos)', async () => {
    const ana = await h.signIn('ana@example.com');

    expect((await say(ana, '![x](https://a.example/x.png)')).data.error.code).toBe('no_images');
    expect((await say(ana, 'veja https://exemplo.com')).data.error.code).toBe('links_later');

    const id = String((await h.client.execute("SELECT id FROM user WHERE email = 'ana@example.com'")).rows[0]!.id);

    for (const n of [1, 2, 3]) {
      await h.client.execute({
        sql: 'INSERT INTO comments (id, target_type, target_id, author_id, body_md) VALUES (?, ?, ?, ?, ?)',
        args: [`c${n}`, 'lesson', lesson, id, `comentário ${n}`],
      });
    }

    expect((await say(ana, 'agora sim: https://exemplo.com')).status).toBe(201);
  });

  it('bloqueia o mesmo texto repetido e limita a 5 por minuto', async () => {
    const ana = await h.signIn('ana@example.com');

    await say(ana, 'igual');

    expect((await say(ana, 'igual')).data.error.code).toBe('duplicate');

    for (const n of [1, 2, 3, 4]) {
      await say(ana, `comentário ${n}`);
    }

    const sixth = await say(ana, 'comentário 6');

    expect(sixth.status).toBe(429);
    expect(sixth.headers.get('retry-after')).toBeTruthy();
  });

  it('só o autor edita e apaga; o comentário de outra pessoa responde "não encontrado"', async () => {
    const ana = await h.signIn('ana@example.com');
    const bia = await h.signIn('bia@example.com');
    const mine = (await say(ana, 'original')).data.comment;

    expect((await h.request(`/api/comments/${mine.id}`, { method: 'PUT', json: { bodyMd: 'roubado' }, cookie: bia })).status).toBe(404);
    expect((await h.request(`/api/comments/${mine.id}`, { method: 'DELETE', cookie: bia })).status).toBe(404);

    const edited = await h.request(`/api/comments/${mine.id}`, { method: 'PUT', json: { bodyMd: 'editado' }, cookie: ana });

    expect(edited.data.comment).toMatchObject({ bodyMd: 'editado', mine: true });
    expect(edited.data.comment.editedAt).toBeTruthy();
    expect((await h.request(`/api/comments/${mine.id}`, { method: 'DELETE', cookie: ana })).status).toBe(200);
    expect((await list()).data.comments).toHaveLength(0);
  });

  it('apagar um comentário que tem resposta deixa um marcador', async () => {
    const ana = await h.signIn('ana@example.com');
    const bia = await h.signIn('bia@example.com');
    const root = (await say(ana, 'pergunta')).data.comment;

    await say(bia, 'resposta', root.id);
    await h.request(`/api/comments/${root.id}`, { method: 'DELETE', cookie: ana });

    const shown = (await list()).data.comments;

    expect(shown).toHaveLength(2);
    expect(shown[0]).toMatchObject({ status: 'deleted_by_author', bodyMd: null });
  });

  it('reações: seis emojis, uma por pessoa e emoji, e some ao desfazer', async () => {
    const ana = await h.signIn('ana@example.com');
    const bia = await h.signIn('bia@example.com');
    const comment = (await say(ana, 'oi')).data.comment;
    const react = (cookie: string, emoji: string, on: boolean) =>
      h.request(`/api/comments/${comment.id}/reactions`, { json: { emoji, on }, cookie });

    await react(ana, '👍', true);
    await react(ana, '👍', true);

    const two = await react(bia, '👍', true);

    expect(two.data.reactions).toEqual([{ emoji: '👍', count: 2, mine: true }]);
    expect((await react(bia, '👍', false)).data.reactions).toEqual([{ emoji: '👍', count: 1, mine: false }]);
    expect((await react(ana, '🔥', true)).status).toBe(422);
    expect((await h.request(`/api/comments/${comment.id}/reactions`, { json: { emoji: '👍', on: true } })).status).toBe(401);
  });

  it('denúncia: uma por pessoa, não vale para o próprio comentário', async () => {
    const ana = await h.signIn('ana@example.com');
    const bia = await h.signIn('bia@example.com');
    const comment = (await say(ana, 'ofensa')).data.comment;
    const report = (cookie: string) => h.request(`/api/comments/${comment.id}/report`, { json: { reason: 'ofensivo', details: '' }, cookie });

    expect((await report(ana)).status).toBe(422);
    expect((await report(bia)).status).toBe(201);
    expect((await report(bia)).status).toBe(201);
    expect((await h.client.execute('SELECT count(*) AS n FROM reports')).rows[0]!.n).toBe(1);
  });

  it('o texto é guardado como veio; quem mostra é que escapa (nada de HTML pronto na API)', async () => {
    const ana = await h.signIn('ana@example.com');
    const sent = await say(ana, '<img src=x onerror=alert(1)> **negrito**');

    expect(sent.data.comment.bodyMd).toBe('<img src=x onerror=alert(1)> **negrito**');
  });
});

describe('moderação', () => {
  async function team() {
    const student = await h.signIn('aluna@example.com');
    const other = await h.signIn('aluno@example.com');
    const mod = await h.signIn('mod@example.com');
    const admin = await h.signIn('admin@example.com');

    await h.setRole('mod@example.com', 'contributor');
    await h.setRole('admin@example.com', 'admin');

    return { student, other, mod, admin };
  }

  it('alunos não chegam a nenhuma rota de moderação', async () => {
    const { student } = await team();
    const routes: [string, string][] = [
      ['GET', '/api/mod/reports'],
      ['POST', '/api/mod/comments/x/hide'],
      ['POST', '/api/mod/users/x/mute'],
      ['POST', '/api/mod/users/x/ban'],
      ['PUT', '/api/mod/users/x/role'],
      ['DELETE', '/api/mod/comments/x'],
      ['GET', '/api/mod/log'],
    ];

    for (const [method, path] of routes) {
      const response = await h.request(path, { method, cookie: student, ...(method === 'GET' ? {} : { json: {} }) });

      expect(response.status, `${method} ${path}`).toBe(403);
    }
  });

  it('ocultar tira o texto para os alunos, mostra o motivo só à equipe, resolve as denúncias e registra', async () => {
    const { student, other, mod } = await team();
    const comment = (await say(student, 'comentário problemático')).data.comment;

    await h.request(`/api/comments/${comment.id}/report`, { json: { reason: 'spam', details: '' }, cookie: other });

    const queue = await h.request('/api/mod/reports', { cookie: mod });

    expect(queue.data.reports).toHaveLength(1);
    expect(queue.data.reports[0].comment.bodyMd).toBe('comentário problemático');

    expect((await h.request(`/api/mod/comments/${comment.id}/hide`, { json: { reason: 'spam' }, cookie: mod })).status).toBe(200);

    expect((await list(other)).data.comments).toHaveLength(0);
    expect((await list()).data.comments).toHaveLength(0);

    const forTeam = (await list(mod)).data.comments[0];

    expect(forTeam).toMatchObject({ status: 'hidden_by_moderator', bodyMd: 'comentário problemático', hiddenReason: 'spam' });
    expect((await h.request('/api/mod/reports', { cookie: mod })).data.reports).toHaveLength(0);

    const entry = (await h.client.execute('SELECT action, target_id, reason FROM moderation_log')).rows[0]!;

    expect(entry).toMatchObject({ action: 'hide', target_id: comment.id, reason: 'spam' });

    await h.request(`/api/mod/comments/${comment.id}/restore`, { json: {}, cookie: mod });

    expect((await list(other)).data.comments).toHaveLength(1);
  });

  it('um comentário oculto que tem resposta continua como marcador', async () => {
    const { student, other, mod } = await team();
    const root = (await say(student, 'ruim')).data.comment;

    await say(other, 'resposta boa', root.id);
    await h.request(`/api/mod/comments/${root.id}/hide`, { json: { reason: 'ofensivo' }, cookie: mod });

    const shown = (await list(other)).data.comments;

    expect(shown).toHaveLength(2);
    expect(shown[0]).toMatchObject({ status: 'hidden_by_moderator', bodyMd: null, hiddenReason: null });
  });

  it('contribuidor não modera outro contribuidor nem admin; admin modera contribuidor', async () => {
    const { mod, admin } = await team();
    const staff = await h.signIn('outro-mod@example.com');

    await h.setRole('outro-mod@example.com', 'contributor');

    const theirs = (await say(staff, 'comentário da equipe')).data.comment;
    const adminOwn = (await say(admin, 'comentário do admin')).data.comment;

    expect((await h.request(`/api/mod/comments/${theirs.id}/hide`, { json: { reason: 'teste' }, cookie: mod })).status).toBe(403);
    expect((await h.request(`/api/mod/comments/${adminOwn.id}/hide`, { json: { reason: 'teste' }, cookie: mod })).status).toBe(403);
    expect((await h.request(`/api/mod/comments/${theirs.id}/hide`, { json: { reason: 'teste' }, cookie: admin })).status).toBe(200);
  });

  it('fixar e resposta oficial', async () => {
    const { student, mod } = await team();
    const asked = (await say(student, 'pergunta')).data.comment;
    const answer = (await say(mod, 'resposta', asked.id)).data.comment;

    expect((await h.request(`/api/mod/comments/${asked.id}/pin`, { json: { value: true }, cookie: mod })).status).toBe(200);
    expect((await h.request(`/api/mod/comments/${answer.id}/pin`, { json: { value: true }, cookie: mod })).status).toBe(422);
    expect((await h.request(`/api/mod/comments/${answer.id}/official`, { json: { value: true }, cookie: mod })).status).toBe(200);
    expect((await h.request(`/api/mod/comments/${asked.id}/official`, { json: { value: true }, cookie: mod })).status).toBe(422);
    expect((await list()).data.comments.find((c: { id: string }) => c.id === answer.id).isOfficial).toBe(true);
  });

  it('silenciar impede de comentar por um tempo; não vale contra quem tem o mesmo nível', async () => {
    const { student, mod } = await team();
    const handle = await h.handleOf(student);
    const muted = await h.request(`/api/mod/users/${handle}/mute`, { json: { hours: 24, reason: 'flood' }, cookie: mod });

    expect(muted.status).toBe(200);

    const blocked = await say(student, 'ainda posso?');

    expect(blocked.status).toBe(403);
    expect(blocked.data.error.code).toBe('muted');

    await h.request(`/api/mod/users/${handle}/mute`, { method: 'DELETE', cookie: mod });

    expect((await say(student, 'voltei')).status).toBe(201);

    const staff = await h.signIn('outro@example.com');

    await h.setRole('outro@example.com', 'contributor');

    expect((await h.request(`/api/mod/users/${await h.handleOf(staff)}/mute`, { json: { hours: 1, reason: 'teste' }, cookie: mod })).status).toBe(403);
    expect((await h.request(`/api/mod/users/${await h.handleOf(mod)}/mute`, { json: { hours: 1, reason: 'teste' }, cookie: mod })).status).toBe(403);
  });

  it('banir: só admin, com login recente; encerra as sessões e desfaz com unban', async () => {
    const { student, mod, admin } = await team();
    const handle = await h.handleOf(student);

    expect((await h.request(`/api/mod/users/${handle}/ban`, { json: { reason: 'abuso' }, cookie: mod })).status).toBe(403);

    await h.client.execute("UPDATE session SET created_at = created_at - 3600000 WHERE user_id = (SELECT id FROM user WHERE email = 'admin@example.com')");

    const stale = await h.request(`/api/mod/users/${handle}/ban`, { json: { reason: 'abuso' }, cookie: admin });

    expect(stale.data.error.code).toBe('recent_login_required');

    const fresh = await h.signIn('admin@example.com');

    expect((await h.request(`/api/mod/users/${handle}/ban`, { json: { reason: 'abuso' }, cookie: fresh })).status).toBe(200);
    expect((await h.request('/api/me', { cookie: student })).status).toBe(401);

    await h.request(`/api/mod/users/${handle}/ban`, { method: 'DELETE', json: {}, cookie: fresh });

    expect((await h.request('/api/me', { cookie: await h.signIn('aluna@example.com') })).status).toBe(200);
  });

  it('papéis: admin promove e rebaixa quem está abaixo, mas não muda a si nem outro admin', async () => {
    const { student, admin } = await team();
    const handle = await h.handleOf(student);
    const promote = await h.request(`/api/mod/users/${handle}/role`, { method: 'PUT', json: { role: 'contributor', reason: 'ajuda na revisão' }, cookie: admin });

    expect(promote.status).toBe(200);
    expect((await h.request('/api/me', { cookie: student })).data.profile.badge).toBe('contributor');

    const self = await h.request(`/api/mod/users/${await h.handleOf(admin)}/role`, { method: 'PUT', json: { role: 'student', reason: 'teste' }, cookie: admin });

    expect(self.status).toBe(403);

    const second = await h.signIn('admin2@example.com');

    await h.setRole('admin2@example.com', 'admin');

    expect((await h.request(`/api/mod/users/${await h.handleOf(second)}/role`, { method: 'PUT', json: { role: 'student', reason: 'teste' }, cookie: admin })).status).toBe(403);
  });

  it('o registro de moderação é lido só por admin e nunca se altera', async () => {
    const { student, mod, admin } = await team();
    const comment = (await say(student, 'x')).data.comment;

    await h.request(`/api/mod/comments/${comment.id}/hide`, { json: { reason: 'teste' }, cookie: mod });

    expect((await h.request('/api/mod/log', { cookie: mod })).status).toBe(403);

    const log = await h.request('/api/mod/log', { cookie: admin });

    expect(log.data.entries[0]).toMatchObject({ action: 'hide', actor: await h.handleOf(mod), reason: 'teste' });
    await expect(h.client.execute('UPDATE moderation_log SET reason = 1')).rejects.toThrow();
    await expect(h.client.execute('DELETE FROM moderation_log')).rejects.toThrow();
  });

  it('apagar de vez: só admin, e some com as respostas', async () => {
    const { student, other, mod, admin } = await team();
    const root = (await say(student, 'dados pessoais')).data.comment;

    await say(other, 'resposta', root.id);

    expect((await h.request(`/api/mod/comments/${root.id}`, { method: 'DELETE', json: { reason: 'dados pessoais' }, cookie: mod })).status).toBe(403);
    expect((await h.request(`/api/mod/comments/${root.id}`, { method: 'DELETE', json: { reason: 'dados pessoais' }, cookie: admin })).status).toBe(200);
    expect((await h.client.execute('SELECT count(*) AS n FROM comments')).rows[0]!.n).toBe(0);
  });
});
