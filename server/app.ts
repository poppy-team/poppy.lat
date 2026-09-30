import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { ZodError } from 'zod';
import type { Auth } from './auth.ts';
import type { Db } from './db/client.ts';
import type { Client } from '@libsql/client';
import type { Env } from './env.ts';
import { deps as getDeps, type AppEnv, type Deps } from './context.ts';
import { clientIp, errorBody, HttpError } from './lib/http.ts';
import { rateLimit } from './lib/rate-limit.ts';

/**
 * The paths of Better Auth that are reachable. Everything else it offers
 * (including all of its /admin endpoints) answers 404: moderation goes
 * through our own routes, which log every action.
 */
const authAllowlist = new Set([
  'GET /get-session',
  'POST /sign-in/magic-link',
  'GET /magic-link/verify',
  'POST /sign-in/social',
  'GET /callback/github',
  'POST /sign-out',
  'GET /list-sessions',
  'POST /revoke-session',
  'POST /revoke-other-sessions',
]);

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

export interface AppParts {
  db: Db;
  client: Client;
  env: Env;
  auth: Auth;
}

export function createApp(parts: AppParts, register: (app: Hono<AppEnv>) => void = () => {}) {
  const app = new Hono<AppEnv>().basePath('/api');
  const deps: Deps = parts;
  const siteOrigin = new URL(parts.env.SITE_URL).origin;

  app.use('*', async (c, next) => {
    c.set('deps', deps);
    await next();

    c.header('X-Content-Type-Options', 'nosniff');
    c.header('Referrer-Policy', 'same-origin');
    c.header('Cross-Origin-Resource-Policy', 'same-origin');
    c.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");

    if (!c.res.headers.has('Cache-Control')) {
      c.header('Cache-Control', 'no-store');
    }
  });

  // Cookies are SameSite=Lax; this second wall refuses cross-site writes outright.
  app.use('*', async (c, next) => {
    if (safeMethods.has(c.req.method)) {
      return next();
    }

    const fetchSite = c.req.header('sec-fetch-site');
    const origin = c.req.header('origin');
    const fromSite = fetchSite ? fetchSite === 'same-origin' : origin === siteOrigin;

    if (!fromSite || (origin && origin !== siteOrigin)) {
      throw new HttpError(403, 'bad_origin', 'Pedido recusado: ele não veio do site.');
    }

    return next();
  });

  app.use('*', bodyLimit({
    maxSize: 100 * 1024,
    onError: () => {
      throw new HttpError(413, 'too_large', 'O envio é grande demais.');
    },
  }));

  // Session and role are read from the database on every request.
  app.use('*', async (c, next) => {
    c.set('user', null);

    if (c.req.path.startsWith('/api/auth/')) {
      return next();
    }

    const result = await parts.auth.api.getSession({ headers: c.req.raw.headers, query: { disableCookieCache: true } }).catch(() => null);

    if (result) {
      const { user, session } = result;
      const banned = Boolean(user.banned) && (!user.banExpires || new Date(user.banExpires).getTime() > Date.now());
      const role = user.role === 'admin' || user.role === 'contributor' ? user.role : 'student';

      if (!banned) {
        c.set('user', {
          id: user.id,
          role,
          name: user.name,
          email: user.email,
          sessionStartedAt: new Date(session.createdAt).getTime(),
        });
      }
    }

    return next();
  });

  app.on(['GET', 'POST'], '/auth/*', async (c) => {
    const path = c.req.path.slice('/api/auth'.length);
    const key = `${c.req.method} ${path}`;

    if (!authAllowlist.has(key)) {
      throw new HttpError(404, 'not_found', 'Não encontrado.');
    }

    if (key === 'POST /sign-in/magic-link') {
      const { client } = getDeps(c);
      const body = (await c.req.raw.clone().json().catch(() => ({}))) as { email?: unknown };
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 254) : '';

      await rateLimit(client, 'login-ip', clientIp(c), 10, 3600);

      if (email) {
        await rateLimit(client, 'login-email', email, 5, 3600);
      }
    }

    return parts.auth.handler(c.req.raw);
  });

  register(app);

  app.notFound(() => {
    throw new HttpError(404, 'not_found', 'Não encontrado.');
  });

  app.onError((error, c) => {
    if (error instanceof HttpError) {
      if (error.code === 'rate_limited' && typeof error.extra?.retryAfter === 'number') {
        c.header('Retry-After', String(error.extra.retryAfter));
      }

      return c.json(errorBody(error), error.status);
    }

    if (error instanceof ZodError) {
      const fields = error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));

      return c.json({ error: { code: 'invalid_input', message: fields[0]?.message ?? 'Dados inválidos.', fields } }, 422);
    }

    // Never echo the cause: it may hold SQL or user text.
    console.error('[api]', c.req.method, c.req.path, error instanceof Error ? error.name : 'unknown');

    return c.json({ error: { code: 'internal', message: 'Algo deu errado do nosso lado. Tente de novo em instantes.' } }, 500);
  });

  return app;
}

export type App = ReturnType<typeof createApp>;
