import { beforeEach, describe, expect, it } from 'vitest';
import { createHarness, type Harness } from './helpers.ts';

let h: Harness;

beforeEach(async () => {
  h = await createHarness();
});

describe('login por link no e-mail', () => {
  it('cria conta com papel de aluno, perfil privado e nome automático', async () => {
    const cookie = await h.signIn('ana.silva@example.com');
    const me = await h.request('/api/me', { cookie });

    expect(me.status).toBe(200);
    expect(me.data.user.role).toBe('student');
    expect(me.data.user.name).toBe('Ana Silva');
    expect(me.data.profile.badge).toBe('student');
    expect(me.data.profile.isPublic).toBe(false);
    expect(me.data.profile.handle).toMatch(/^aluno-[a-f0-9]{6}$/u);
  });

  it('guarda só o hash do token do link', async () => {
    await h.signIn('ana@example.com');
    const link = /token=([^&\s]+)/u.exec(h.mails.at(-1)!.text)![1]!;
    const rows = (await h.client.execute('SELECT identifier, value FROM verification')).rows;
    const text = JSON.stringify(rows);

    expect(text).not.toContain(decodeURIComponent(link));
  });

  it('o link só vale uma vez', async () => {
    await h.request('/api/auth/sign-in/magic-link', { json: { email: 'ana@example.com' } });
    const url = new URL(/https?:\/\/\S+/u.exec(h.mails.at(-1)!.text)![0]);
    const path = `${url.pathname}${url.search}`;
    const first = await h.app.request(path, { redirect: 'manual' });
    const second = await h.app.request(path, { redirect: 'manual' });

    expect(first.headers.getSetCookie().length).toBeGreaterThan(0);
    expect(second.headers.getSetCookie().length).toBe(0);
  });

  it('/api/whoami responde 200 com null para visitantes e com a pessoa para quem entrou', async () => {
    const visitor = await h.request('/api/whoami');

    expect(visitor.status).toBe(200);
    expect(visitor.data.me).toBeNull();

    const cookie = await h.signIn('ana@example.com');

    expect((await h.request('/api/whoami', { cookie })).data.me.user.role).toBe('student');
  });

  it('sem sessão, /api/me responde 401', async () => {
    const me = await h.request('/api/me');

    expect(me.status).toBe(401);
    expect(me.data.error.code).toBe('login_required');
  });

  it('os endpoints de administração do Better Auth não existem', async () => {
    const cookie = await h.signIn('admin@example.com');

    await h.setRole('admin@example.com', 'admin');

    for (const path of ['/api/auth/admin/list-users', '/api/auth/admin/set-role', '/api/auth/admin/ban-user', '/api/auth/update-user']) {
      const response = await h.request(path, { method: 'POST', json: {}, cookie });

      expect(response.status, path).toBe(404);
    }
  });

  it('limita os pedidos de link por e-mail', async () => {
    let last = 200;

    for (let i = 0; i < 6; i += 1) {
      last = (await h.request('/api/auth/sign-in/magic-link', { json: { email: 'spam@example.com' } })).status;
    }

    expect(last).toBe(429);

    const keys = (await h.client.execute('SELECT key FROM rate_limits')).rows.map((row) => String(row.key));

    expect(keys.some((key) => key.includes('spam@example.com'))).toBe(false);
  });

  it('recusa escritas que não vêm do site', async () => {
    const cookie = await h.signIn('ana@example.com');
    const noOrigin = await h.request('/api/me/links/github', { method: 'PUT', json: { value: 'ana' }, cookie, noOrigin: true });
    const foreign = await h.request('/api/me/links/github', { method: 'PUT', json: { value: 'ana' }, cookie, headers: { origin: 'https://evil.example' } });
    const crossSite = await h.request('/api/me/links/github', { method: 'PUT', json: { value: 'ana' }, cookie, headers: { 'sec-fetch-site': 'cross-site' } });

    expect(noOrigin.status).toBe(403);
    expect(foreign.status).toBe(403);
    expect(crossSite.status).toBe(403);
  });

  it('quem foi banido é tratado como visitante e perde as sessões', async () => {
    const cookie = await h.signIn('ana@example.com');

    await h.client.execute("UPDATE user SET banned = 1 WHERE email = 'ana@example.com'");

    expect((await h.request('/api/me', { cookie })).status).toBe(401);
  });

  it('a mudança de papel vale na hora, sem esperar o cookie expirar', async () => {
    const cookie = await h.signIn('ana@example.com');

    await h.setRole('ana@example.com', 'contributor');

    const me = await h.request('/api/me', { cookie });

    expect(me.data.user.role).toBe('contributor');
    expect(me.data.profile.badge).toBe('contributor');
  });
});

describe('conta sem perfil (cadastro que parou no meio)', () => {
  it('o perfil é recriado sozinho e a pessoa segue como quem ainda precisa aceitar os Termos', async () => {
    const harness = await createHarness();
    const cookie = await harness.signIn('ana@example.com', { consent: false });

    await harness.client.execute('DELETE FROM profiles');

    const who = await harness.request('/api/whoami', { cookie });

    expect(who.status).toBe(200);
    expect(who.data.me.consented).toBe(false);
    expect(who.data.me.profile.handle).toMatch(/^aluno-/u);
    expect((await harness.client.execute('SELECT count(*) AS n FROM profiles')).rows[0]?.n).toBe(1);
  });

  it('health diz quais entradas sociais estão ligadas', async () => {
    const harness = await createHarness();
    const health = await harness.request('/api/health');

    expect(health.data).toMatchObject({ ok: true, github: false, google: false });
  });
});
