import { createApp, type App } from './app.ts';
import { createAuth } from './auth.ts';
import { createDb, type Db } from './db/client.ts';
import { readEnv, type Env } from './env.ts';
import { createMailer, type Mailer } from './lib/mail.ts';
import { commentRoutes } from './routes/comments.ts';
import { moderationRoutes } from './routes/moderation.ts';
import { noteRoutes } from './routes/notes.ts';
import { profileRoutes } from './routes/profile.ts';
import { progressRoutes } from './routes/progress.ts';
import { publicRoutes } from './routes/public.ts';
import type { Client } from '@libsql/client';

export interface ServerParts {
  db: Db;
  client: Client;
  env: Env;
  mailer?: Mailer;
}

/** Wires the pieces together. Tests pass their own database and mailer; production passes nothing. */
export function buildApp(parts: ServerParts): App {
  const auth = createAuth({ db: parts.db, env: parts.env, mailer: parts.mailer ?? createMailer(parts.env) });

  return createApp({ db: parts.db, client: parts.client, env: parts.env, auth }, (app) => {
    app.get('/health', (c) => c.json({ ok: true }));
    app.route('/', publicRoutes());
    app.route('/', profileRoutes());
    app.route('/', progressRoutes());
    app.route('/', noteRoutes());
    app.route('/', commentRoutes());
    app.route('/', moderationRoutes());
  });
}

let cached: App | undefined;

/** One app per serverless instance, built on the first request. */
export function serverApp(): App {
  if (!cached) {
    const env = readEnv();
    const { db, client } = createDb(env.TURSO_DATABASE_URL, env.TURSO_AUTH_TOKEN);

    cached = buildApp({ db, client, env });
  }

  return cached;
}
