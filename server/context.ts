import type { Client } from '@libsql/client';
import type { Context } from 'hono';
import type { z } from 'zod';
import type { Auth } from './auth.ts';
import type { Db } from './db/client.ts';
import type { Env } from './env.ts';
import { can, type Action, type Actor, type Role } from './lib/can.ts';
import { HttpError } from './lib/http.ts';

export interface Deps {
  db: Db;
  client: Client;
  env: Env;
  auth: Auth;
}

export interface CurrentUser extends Actor {
  name: string;
  email: string;
  /** When this login started, in milliseconds. Admin actions ask for a recent one. */
  sessionStartedAt: number;
  /** Confirmed being 18 or older and accepted the current Terms. Everything else waits for it. */
  consented: boolean;
}

export interface RequireOptions {
  /** For the few routes that must work before the age and Terms step: reading, exporting and deleting the account, and the step itself. */
  beforeConsent?: boolean;
}

export interface AppEnv {
  Variables: {
    deps: Deps;
    user: CurrentUser | null;
  };
}

export type Ctx = Context<AppEnv>;

/** A login this recent counts as "just now" for actions that are hard to undo. */
export const recentLoginMs = 15 * 60 * 1000;

export function requireUser(c: Ctx, options: RequireOptions = {}): CurrentUser {
  const user = c.get('user');

  if (!user) {
    throw new HttpError(401, 'login_required', 'Entre na sua conta para continuar.');
  }

  if (!user.consented && !options.beforeConsent) {
    throw new HttpError(403, 'consent_required', 'Confirme sua idade e aceite os Termos de Uso para continuar.');
  }

  return user;
}

export function requireRecentLogin(c: Ctx, options: RequireOptions = {}): CurrentUser {
  const user = requireUser(c, options);

  if (Date.now() - user.sessionStartedAt > recentLoginMs) {
    throw new HttpError(403, 'recent_login_required', 'Por segurança, entre de novo para fazer isto.');
  }

  return user;
}

/** Throws unless the rules allow it. The answer for someone else's data is "not found", not "forbidden". */
export function requireCan(c: Ctx, action: Action, resource?: { ownerId?: string | null }): CurrentUser {
  const user = requireUser(c);

  if (!can(user, action, resource)) {
    throw new HttpError(403, 'forbidden', 'Você não tem permissão para fazer isto.');
  }

  return user;
}

export async function readJson<T extends z.ZodType>(c: Ctx, schema: T): Promise<z.infer<T>> {
  const type = c.req.header('content-type') ?? '';

  if (!type.toLowerCase().startsWith('application/json')) {
    throw new HttpError(415, 'json_required', 'Envie o corpo como JSON.');
  }

  let body: unknown;

  try {
    body = await c.req.json();
  } catch {
    throw new HttpError(400, 'invalid_json', 'O corpo da requisição não é um JSON válido.');
  }

  return schema.parse(body);
}

export function deps(c: Ctx): Deps {
  return c.get('deps');
}

export type { Role };
