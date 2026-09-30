import type { Context } from 'hono';

/** An error the caller is meant to see: a status, a stable code and a sentence in Portuguese. */
export class HttpError extends Error {
  readonly status: 400 | 401 | 403 | 404 | 409 | 413 | 415 | 422 | 429 | 503;
  readonly code: string;
  readonly extra: Record<string, unknown> | undefined;

  constructor(
    status: HttpError['status'],
    code: string,
    message: string,
    extra?: Record<string, unknown>,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

export function errorBody(error: HttpError) {
  return { error: { code: error.code, message: error.message, ...error.extra } };
}

/** SQLite gives 'YYYY-MM-DD HH:MM:SS' in UTC; the API speaks ISO 8601. */
export function iso(value: string | null | undefined): string | null {
  return value ? `${value.replace(' ', 'T')}Z` : null;
}

export function clientIp(c: Context): string {
  const forwarded = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();

  return c.req.header('x-real-ip') ?? forwarded ?? 'unknown';
}

/**
 * What the log may say about an unexpected error. Only the name and, for a
 * database failure, the engine's own code and message: Drizzle wraps those in
 * an error that also carries the SQL and its parameters (user text), so the
 * wrapper's message is never printed, only its cause's.
 */
export function describeError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'unknown';
  }

  const cause = error.cause instanceof Error ? error.cause : error;

  if (cause.name !== 'LibsqlError') {
    return error.name;
  }

  const { code } = cause as Error & { code?: unknown };

  return `${error.name} ${typeof code === 'string' ? code : 'no-code'}: ${cause.message.replace(/\s+/gu, ' ').slice(0, 240)}`;
}
