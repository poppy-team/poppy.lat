import { createTestDb } from '../../server/db/client.ts';
import { readEnv } from '../../server/env.ts';
import { buildApp } from '../../server/index.ts';
import type { Mail } from '../../server/lib/mail.ts';

export const origin = 'http://localhost:5173';

export async function createHarness() {
  const { db, client } = await createTestDb();
  const env = readEnv({ NODE_ENV: 'test', SITE_URL: origin });
  const mails: Mail[] = [];
  const app = buildApp({ db, client, env, mailer: async (mail) => void mails.push(mail) });

  interface Options {
    method?: string;
    cookie?: string;
    json?: unknown;
    body?: BodyInit;
    headers?: Record<string, string>;
    /** Leave the Origin header out, to test the cross-site wall. */
    noOrigin?: boolean;
  }

  async function request(path: string, options: Options = {}) {
    const method = options.method ?? (options.json !== undefined || options.body !== undefined ? 'POST' : 'GET');
    const headers: Record<string, string> = { ...options.headers };

    if (!options.noOrigin && method !== 'GET' && !headers.origin && !headers['sec-fetch-site']) {
      headers.origin = origin;
    }

    if (options.cookie) {
      headers.cookie = options.cookie;
    }

    let body: BodyInit | undefined = options.body;

    if (options.json !== undefined) {
      headers['content-type'] = 'application/json';
      body = JSON.stringify(options.json);
    }

    const init: RequestInit = { method, headers, redirect: 'manual' };

    if (body !== undefined) {
      init.body = body;
    }

    const response = await app.request(path, init);
    const type = response.headers.get('content-type') ?? '';
    const data: unknown = type.includes('json') ? await response.json() : await response.arrayBuffer();

    return { status: response.status, data: data as any, headers: response.headers };
  }

  /**
   * Logs in through the real magic-link flow and returns the cookie of that
   * session. Unless told otherwise it also passes the age and Terms step, as
   * every account must before using the site.
   */
  async function signIn(email: string, options: { consent?: boolean } = {}): Promise<string> {
    const before = mails.length;
    const sent = await request('/api/auth/sign-in/magic-link', { json: { email } });

    if (sent.status !== 200 || mails.length !== before + 1) {
      throw new Error(`login mail failed: ${sent.status}`);
    }

    const link = /https?:\/\/\S+/u.exec(mails.at(-1)!.text)![0];
    const url = new URL(link);
    const verified = await app.request(`${url.pathname}${url.search}`, { redirect: 'manual' });
    const cookies = verified.headers.getSetCookie().map((cookie) => cookie.split(';')[0]!);

    if (cookies.length === 0) {
      throw new Error(`no session cookie: ${verified.status}`);
    }

    const cookie = cookies.join('; ');

    if (options.consent ?? true) {
      const consent = await request('/api/me/consent', { cookie, json: { birthDate: '1990-05-20', acceptTerms: true } });

      if (consent.status !== 200) {
        throw new Error(`consent failed: ${consent.status}`);
      }
    }

    return cookie;
  }

  async function setRole(email: string, role: 'student' | 'contributor' | 'admin') {
    await client.execute({ sql: 'UPDATE user SET role = ? WHERE email = ?', args: [role, email] });
  }

  async function handleOf(cookie: string): Promise<string> {
    const me = await request('/api/me', { cookie });

    return me.data.profile.handle as string;
  }

  return { app, db, client, mails, request, signIn, setRole, handleOf };
}

export type Harness = Awaited<ReturnType<typeof createHarness>>;
