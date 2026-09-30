import sharp from 'sharp';
import { beforeEach, describe, expect, it } from 'vitest';
import { createHarness, type Harness } from './helpers.ts';

let h: Harness;

beforeEach(async () => {
  h = await createHarness();
});

const validProfile = { name: 'Ana Silva', handle: 'ana', bio: 'Estudando compiladores.', isPublic: true, showInRankings: false };

describe('perfil', () => {
  it('edita nome, nome de usuário e bio e valida os campos', async () => {
    const cookie = await h.signIn('ana@example.com');
    const ok = await h.request('/api/me/profile', { method: 'PUT', json: validProfile, cookie });

    expect(ok.status).toBe(200);
    expect(ok.data.profile).toMatchObject({ handle: 'ana', name: 'Ana Silva', isPublic: true });

    const bad = [
      { ...validProfile, handle: 'admin' },
      { ...validProfile, handle: 'a b' },
      { ...validProfile, name: '' },
      { ...validProfile, name: 'A‮b' },
      { ...validProfile, bio: 'veja https://spam.example' },
      { ...validProfile, bio: 'x'.repeat(281) },
      { ...validProfile, isPublic: 'sim' },
      { ...validProfile, extra: 1 },
    ];

    for (const json of bad) {
      expect((await h.request('/api/me/profile', { method: 'PUT', json, cookie })).status, JSON.stringify(json)).toBe(422);
    }
  });

  it('não deixa dois usuários com o mesmo nome de usuário', async () => {
    const ana = await h.signIn('ana@example.com');
    const bia = await h.signIn('bia@example.com');

    await h.request('/api/me/profile', { method: 'PUT', json: validProfile, cookie: ana });

    const clash = await h.request('/api/me/profile', { method: 'PUT', json: { ...validProfile, name: 'Bia', handle: 'ANA' }, cookie: bia });

    expect(clash.status).toBe(409);
    expect(clash.data.error.code).toBe('handle_taken');
  });

  it('o perfil é privado até a pessoa torná-lo público', async () => {
    const ana = await h.signIn('ana@example.com');
    const bia = await h.signIn('bia@example.com');

    await h.request('/api/me/profile', { method: 'PUT', json: { ...validProfile, isPublic: false }, cookie: ana });

    expect((await h.request('/api/u/ana')).status).toBe(404);
    expect((await h.request('/api/u/ana', { cookie: bia })).status).toBe(404);
    expect((await h.request('/api/u/ana', { cookie: ana })).status).toBe(200);

    await h.request('/api/me/profile', { method: 'PUT', json: validProfile, cookie: ana });

    expect((await h.request('/api/u/ana')).status).toBe(200);
    expect((await h.request('/api/u/nao-existe')).status).toBe(404);
  });

  it('o perfil público não mostra o e-mail de conta, só o que a pessoa publicou', async () => {
    const ana = await h.signIn('ana@example.com');

    await h.request('/api/me/profile', { method: 'PUT', json: validProfile, cookie: ana });

    const view = await h.request('/api/u/ana');

    expect(JSON.stringify(view.data)).not.toContain('ana@example.com');
    expect(view.data.profile.badge).toBe('student');
  });
});

describe('links do perfil', () => {
  it('guarda o apelido e devolve o endereço montado pelo servidor', async () => {
    const cookie = await h.signIn('ana@example.com');
    const saved = await h.request('/api/me/links/github', { method: 'PUT', json: { value: 'raillen' }, cookie });

    expect(saved.data.profile.links).toEqual([{ service: 'github', label: 'GitHub', value: 'raillen', href: 'https://github.com/raillen' }]);

    const raw = (await h.client.execute('SELECT value FROM profile_links')).rows[0]!.value;

    expect(raw).toBe('raillen');
  });

  it('recusa endereço no lugar do apelido, serviço desconhecido e site inseguro', async () => {
    const cookie = await h.signIn('ana@example.com');

    expect((await h.request('/api/me/links/github', { method: 'PUT', json: { value: 'https://evil.example' }, cookie })).status).toBe(422);
    expect((await h.request('/api/me/links/site', { method: 'PUT', json: { value: 'javascript:alert(1)' }, cookie })).status).toBe(422);
    expect((await h.request('/api/me/links/tiktok', { method: 'PUT', json: { value: 'x' }, cookie })).status).toBe(404);
  });

  it('o e-mail só aparece para quem está logado, e nunca como href', async () => {
    const ana = await h.signIn('ana@example.com');
    const bia = await h.signIn('bia@example.com');

    await h.request('/api/me/profile', { method: 'PUT', json: validProfile, cookie: ana });
    await h.request('/api/me/links/email', { method: 'PUT', json: { value: 'Contato@Exemplo.com' }, cookie: ana });
    await h.request('/api/me/links/github', { method: 'PUT', json: { value: 'ana' }, cookie: ana });

    const anonymous = await h.request('/api/u/ana');
    const loggedIn = await h.request('/api/u/ana', { cookie: bia });

    expect(anonymous.data.profile.links.map((l: { service: string }) => l.service)).toEqual(['github']);
    expect(loggedIn.data.profile.links.find((l: { service: string }) => l.service === 'email')).toEqual({
      service: 'email',
      label: 'E-mail',
      value: 'contato@exemplo.com',
      href: null,
    });
  });

  it('remove um link', async () => {
    const cookie = await h.signIn('ana@example.com');

    await h.request('/api/me/links/github', { method: 'PUT', json: { value: 'ana' }, cookie });

    const removed = await h.request('/api/me/links/github', { method: 'DELETE', cookie });

    expect(removed.data.profile.links).toEqual([]);
  });
});

describe('foto', () => {
  const photo = () => sharp({ create: { width: 300, height: 200, channels: 3, background: '#4488cc' } }).webp().toBuffer();

  it('recodifica a foto e só entrega para quem está logado', async () => {
    const ana = await h.signIn('ana@example.com');
    const bia = await h.signIn('bia@example.com');
    const sent = await h.request('/api/me/photo', { method: 'PUT', body: new Uint8Array(await photo()), headers: { 'content-type': 'image/webp' }, cookie: ana });

    expect(sent.status).toBe(200);
    expect(sent.data.photoUrl).toMatch(/^\/api\/avatar\/[a-f0-9]{32}$/u);

    const anonymous = await h.request(sent.data.photoUrl);
    const loggedIn = await h.request(sent.data.photoUrl, { cookie: bia });

    expect(anonymous.status).toBe(401);
    expect(loggedIn.status).toBe(200);
    expect(loggedIn.headers.get('content-type')).toBe('image/webp');
    expect(loggedIn.headers.get('x-content-type-options')).toBe('nosniff');
    expect(loggedIn.headers.get('content-security-policy')).toContain("default-src 'none'");

    const meta = await sharp(Buffer.from(loggedIn.data as ArrayBuffer)).metadata();

    expect([meta.format, meta.width, meta.height]).toEqual(['webp', 256, 256]);
  });

  it('o perfil de visitante não traz o endereço da foto', async () => {
    const ana = await h.signIn('ana@example.com');

    await h.request('/api/me/profile', { method: 'PUT', json: validProfile, cookie: ana });
    await h.request('/api/me/photo', { method: 'PUT', body: new Uint8Array(await photo()), cookie: ana });

    expect((await h.request('/api/u/ana')).data.profile.photoUrl).toBeNull();
    expect((await h.request('/api/u/ana', { cookie: ana })).data.profile.photoUrl).toMatch(/^\/api\/avatar\//u);
  });

  it('recusa o que não é imagem, mesmo com o tipo declarado certo', async () => {
    const cookie = await h.signIn('ana@example.com');
    const bad = await h.request('/api/me/photo', { method: 'PUT', body: new TextEncoder().encode('<svg onload=alert(1)>'), headers: { 'content-type': 'image/webp' }, cookie });

    expect(bad.status).toBe(415);
  });

  it('cada envio troca a chave, e remover apaga a foto', async () => {
    const cookie = await h.signIn('ana@example.com');
    const one = await h.request('/api/me/photo', { method: 'PUT', body: new Uint8Array(await photo()), cookie });
    const two = await h.request('/api/me/photo', { method: 'PUT', body: new Uint8Array(await photo()), cookie });

    expect(one.data.photoUrl).not.toBe(two.data.photoUrl);
    expect((await h.request(one.data.photoUrl, { cookie })).status).toBe(404);

    await h.request('/api/me/photo', { method: 'DELETE', cookie });

    expect((await h.request(two.data.photoUrl, { cookie })).status).toBe(404);
  });
});

describe('conta', () => {
  it('exporta os dados da pessoa', async () => {
    const cookie = await h.signIn('ana@example.com');

    await h.request('/api/me/notes', { json: { title: 'Nota', bodyMd: 'texto' }, cookie });

    const data = await h.request('/api/me/export', { cookie });

    expect(data.status).toBe(200);
    expect(data.headers.get('content-disposition')).toContain('attachment');
    expect(data.data.notes).toHaveLength(1);
    expect(data.data.account.email).toBe('ana@example.com');
  });

  it('apaga a conta, as anotações e o resto, mas mantém comentários que já têm resposta, sem autor', async () => {
    const ana = await h.signIn('ana@example.com');
    const bia = await h.signIn('bia@example.com');
    const lesson = 'pensar-em-codigo/primeiro-programa/ola';
    const root = await h.request('/api/comments', { json: { targetType: 'lesson', targetId: lesson, bodyMd: 'Minha pergunta' }, cookie: ana });
    const alone = await h.request('/api/comments', { json: { targetType: 'lesson', targetId: lesson, bodyMd: 'Um comentário sem resposta' }, cookie: ana });

    await h.request('/api/comments', { json: { targetType: 'lesson', targetId: lesson, parentId: root.data.comment.id, bodyMd: 'Resposta da Bia' }, cookie: bia });
    await h.request('/api/me/notes', { json: { title: 'Nota', bodyMd: 'texto' }, cookie: ana });
    await h.request('/api/me/links/github', { method: 'PUT', json: { value: 'ana' }, cookie: ana });

    const handle = await h.handleOf(ana);

    expect((await h.request('/api/me', { method: 'DELETE', json: { confirm: 'errado' }, cookie: ana })).status).toBe(422);

    const gone = await h.request('/api/me', { method: 'DELETE', json: { confirm: handle }, cookie: ana });

    expect(gone.status).toBe(200);
    expect((await h.request('/api/me', { cookie: ana })).status).toBe(401);

    const count = async (table: string) => Number((await h.client.execute(`SELECT count(*) AS n FROM ${table}`)).rows[0]!.n);

    expect(await count('notes')).toBe(0);
    expect(await count('profile_links')).toBe(0);
    expect(await count("user WHERE email = 'ana@example.com'")).toBe(0);

    const kept = (await h.client.execute({ sql: 'SELECT author_id, body_md, status FROM comments WHERE id = ?', args: [root.data.comment.id] })).rows[0]!;

    expect(kept).toMatchObject({ author_id: null, body_md: '[removido]', status: 'deleted_by_author' });
    expect((await h.client.execute({ sql: 'SELECT 1 FROM comments WHERE id = ?', args: [alone.data.comment.id] })).rows).toHaveLength(0);
    expect(await count('comments')).toBe(2);
  });

  it('pede login recente para apagar a conta', async () => {
    const cookie = await h.signIn('ana@example.com');

    await h.client.execute('UPDATE session SET created_at = created_at - 3600000');

    const denied = await h.request('/api/me', { method: 'DELETE', json: { confirm: await h.handleOf(cookie) }, cookie });

    expect(denied.status).toBe(403);
    expect(denied.data.error.code).toBe('recent_login_required');
  });

  it('a única pessoa administradora não pode apagar a conta', async () => {
    const cookie = await h.signIn('root@example.com');

    await h.setRole('root@example.com', 'admin');

    const denied = await h.request('/api/me', { method: 'DELETE', json: { confirm: await h.handleOf(cookie) }, cookie });

    expect(denied.status).toBe(409);
    expect(denied.data.error.code).toBe('last_admin');
  });
});

describe('página da equipe', () => {
  async function publish(cookie: string, name: string, isPublic = true) {
    const me = (await h.request('/api/me', { cookie })).data.profile;

    return h.request('/api/me/profile', {
      method: 'PUT',
      cookie,
      json: { name, handle: name.toLowerCase().replace(/\s+/gu, '-'), bio: `Sobre ${name}`, isPublic, showInRankings: me.showInRankings },
    });
  }

  it('lista só quem é da equipe e deixou o perfil público', async () => {
    const ana = await h.signIn('ana@example.com');
    const bia = await h.signIn('bia@example.com');
    const caio = await h.signIn('caio@example.com');
    const duda = await h.signIn('duda@example.com');

    await publish(ana, 'Ana Costa');
    await publish(bia, 'Bia Lima');
    await publish(caio, 'Caio Reis', false);
    await publish(duda, 'Duda Melo');
    await h.setRole('ana@example.com', 'admin');
    await h.setRole('bia@example.com', 'contributor');
    await h.setRole('caio@example.com', 'contributor');

    const team = await h.request('/api/team');

    expect(team.status).toBe(200);
    expect(team.data.members.map((member: { name: string }) => member.name).sort()).toEqual(['Ana Costa', 'Bia Lima']);
    // A student with a public profile is not on the team, and a private contributor is not shown.
    expect(JSON.stringify(team.data)).not.toMatch(/Duda|Caio|example\.com/u);
  });

  it('o e-mail do perfil só aparece para quem está logado', async () => {
    const ana = await h.signIn('ana@example.com');

    await publish(ana, 'Ana Costa');
    await h.setRole('ana@example.com', 'contributor');
    await h.request('/api/me/links/email', { method: 'PUT', cookie: ana, json: { value: 'ana@equipe.dev' } });

    expect(JSON.stringify((await h.request('/api/team')).data)).not.toContain('ana@equipe.dev');
    expect(JSON.stringify((await h.request('/api/team', { cookie: ana })).data)).toContain('ana@equipe.dev');
  });
});
