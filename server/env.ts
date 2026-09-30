import { z } from 'zod';

/**
 * Everything the server reads from its environment, checked once at start.
 * Nothing in here is ever sent to the browser or written to a log.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  /** Public address of the site, with no trailing slash. Used for cookies, links and the Origin check. */
  SITE_URL: z.string().url().default('http://localhost:5173'),
  /** `file:./local.db` in development; the Turso `libsql://` address in production. */
  TURSO_DATABASE_URL: z.string().min(1).default('file:./local.db'),
  TURSO_AUTH_TOKEN: z.string().min(1).optional(),
  /** Signs the login tokens. At least 32 characters, different in every environment. */
  AUTH_SECRET: z.string().min(32).optional(),
  GITHUB_CLIENT_ID: z.string().min(1).optional(),
  GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  MAIL_FROM: z.string().min(3).default('Poppy Team <login@poppy.lat>'),
});

export type Env = z.infer<typeof schema> & { AUTH_SECRET: string };

const developmentSecret = 'development-only-secret-do-not-use-in-production-0123456789';

export function readEnv(source: Record<string, string | undefined> = process.env): Env {
  const parsed = schema.parse(source);

  if (parsed.NODE_ENV === 'production') {
    if (!parsed.AUTH_SECRET) {
      throw new Error('AUTH_SECRET is required in production.');
    }

    if (!parsed.SITE_URL.startsWith('https://')) {
      throw new Error('SITE_URL must be an https address in production.');
    }

    if (parsed.TURSO_DATABASE_URL.startsWith('file:')) {
      throw new Error('TURSO_DATABASE_URL must point at Turso in production.');
    }
  }

  return { ...parsed, AUTH_SECRET: parsed.AUTH_SECRET ?? developmentSecret };
}
