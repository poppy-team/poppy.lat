import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestDb } from '../../server/db/client.ts';
import { readEnv } from '../../server/env.ts';
import { buildApp } from '../../server/index.ts';
import type { Mail } from '../../server/lib/mail.ts';

const origin = 'http://localhost:5173';

/** An id_token as the provider would send it. Better Auth reads the claims and does not check the signature here. */
function idToken(claims: Record<string, unknown>): string {
  const part = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

  return `${part({ alg: 'none', typ: 'JWT' })}.${part({ iss: 'https://accounts.google.com', aud: 'cid', ...claims })}.sig`;
}

async function harness() {
  const { db, client } = await createTestDb();
  const env = readEnv({ NODE_ENV: 'test', SITE_URL: origin, GOOGLE_CLIENT_ID: 'cid', GOOGLE_CLIENT_SECRET: 'csecret' });
  const mails: Mail[] = [];
  const app = buildApp({ db, client, env, mailer: async (mail) => void mails.push(mail) });
  const cookiesOf = (response: Response) =>
    response.headers
      .getSetCookie()
      .map((cookie) => cookie.split(';')[0]!)
      .join('; ');

  async function magicLink(email: string): Promise<string> {
    await app.request('/api/auth/sign-in/magic-link', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify({ email }),
    });

    const url = new URL(/https?:\/\/\S+/u.exec(mails.at(-1)!.text)![0]);
    const verified = await app.request(`${url.pathname}${url.search}`, { redirect: 'manual' });

    return cookiesOf(verified);
  }

  /** Goes through the whole Google round trip, with Google's answer made up. */
  async function google(claims: Record<string, unknown>) {
    const start = await app.request('/api/auth/sign-in/social', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify({ provider: 'google', callbackURL: '/aprender/', errorCallbackURL: '/conta/entrar?erro=social' }),
    });
    const { url } = (await start.json()) as { url: string };
    const state = new URL(url).searchParams.get('state')!;

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({ access_token: 'token-de-acesso-secreto', id_token: idToken(claims), expires_in: 3600, token_type: 'Bearer' }),
      ),
    );

    const callback = await app.request(`/api/auth/callback/google?code=abc&state=${encodeURIComponent(state)}`, {
      headers: { cookie: cookiesOf(start) },
      redirect: 'manual',
    });

    vi.unstubAllGlobals();

    return { location: callback.headers.get('location') ?? '', cookie: cookiesOf(callback) };
  }

  async function whoami(cookie: string) {
    const response = await app.request('/api/whoami', { headers: { cookie } });

    return (await response.json()) as { me: { user: { id: string; name: string }; profile: { handle: string } } | null };
  }

  const count = async (table: string) => Number((await client.execute(`SELECT count(*) AS n FROM ${table}`)).rows[0]?.n);

  return { app, client, magicLink, google, whoami, count };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('entrar com Google', () => {
  it('health avisa que o Google está ligado quando as chaves existem', async () => {
    const h = await harness();
    const health = (await (await h.app.request('/api/health')).json()) as Record<string, unknown>;

    expect(health).toMatchObject({ ok: true, google: true, github: false });
  });

  it('um e-mail verificado pelo Google entra na mesma conta que já existia por link', async () => {
    const h = await harness();
    const byLink = await h.magicLink('ana@example.com');
    const before = (await h.whoami(byLink)).me!;
    const result = await h.google({ sub: 'g-1', email: 'ana@example.com', email_verified: true, name: 'Ana Real' });
    const after = (await h.whoami(result.cookie)).me!;

    expect(result.location).toContain('/aprender/');
    expect(after.user.id).toBe(before.user.id);
    expect(await h.count('user')).toBe(1);
  });

  it('conta nova: o apelido sai do e-mail, não do nome do Google, e nenhuma chave do provedor fica guardada', async () => {
    const h = await harness();
    const result = await h.google({
      sub: 'g-2',
      email: 'maria@example.com',
      email_verified: true,
      name: 'Maria da Silva Santos',
      picture: 'https://lh3.googleusercontent.com/a/foto',
    });
    const me = (await h.whoami(result.cookie)).me!;
    const account = (await h.client.execute('SELECT provider_id, account_id, access_token, refresh_token, id_token, scope FROM account')).rows[0]!;
    const user = (await h.client.execute('SELECT name, image FROM user')).rows[0]!;

    expect(me.user.name).not.toContain('Silva');
    expect(user.name).toBe(me.user.name);
    expect(user.image).toBeNull();
    expect(me.profile.handle).toMatch(/^aluno-/u);
    expect(account).toMatchObject({ provider_id: 'google', account_id: 'g-2', access_token: null, refresh_token: null, id_token: null, scope: null });
  });

  it('um e-mail que o Google não garante não abre conta nem entra numa conta existente', async () => {
    const h = await harness();

    await h.magicLink('ana@example.com');

    const onExisting = await h.google({ sub: 'g-3', email: 'ana@example.com', email_verified: false, name: 'Mallory' });
    const onNew = await h.google({ sub: 'g-4', email: 'novo@example.com', email_verified: false, name: 'Novo' });

    for (const result of [onExisting, onNew]) {
      expect(result.cookie).not.toContain('session_token');
      expect(result.location).toContain('erro=social');
    }

    expect(await h.count('user')).toBe(1);
    expect(await h.count('account')).toBe(0);
  });

  it('se o banco falhar no meio do cadastro, o log não leva e-mail, nome nem chaves', async () => {
    const h = await harness();

    await h.client.execute("CREATE TRIGGER falha BEFORE INSERT ON account BEGIN SELECT RAISE(ABORT, 'falha de teste'); END");

    const spies = (['error', 'warn', 'log', 'info'] as const).map((method) => vi.spyOn(console, method).mockImplementation(() => undefined));

    await h.google({ sub: 'g-5', email: 'segredo.pessoa@example.com', email_verified: true, name: 'Pessoa Segredo Completa' });

    const logged = spies
      .flatMap((spy) => spy.mock.calls)
      .map((args) => args.map((arg) => (arg instanceof Error ? `${arg.name}: ${arg.message}\n${arg.stack ?? ''}` : String(arg))).join(' '))
      .join('\n');

    expect(logged).not.toContain('segredo.pessoa@example.com');
    expect(logged).not.toContain('Pessoa Segredo Completa');
    expect(logged).not.toContain('token-de-acesso-secreto');
    expect(logged).toContain('[auth]');
  });
});
