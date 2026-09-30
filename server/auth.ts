import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, magicLink } from 'better-auth/plugins';
import type { Db } from './db/client.ts';
import * as schema from './db/schema.ts';
import type { Env } from './env.ts';
import { generateHandle, nameFromEmail } from './lib/handle.ts';
import { loginMail, type Mailer } from './lib/mail.ts';

export const sessionDays = 30;

/**
 * Login by e-mail link (and GitHub when configured). There are no passwords,
 * so there is nothing to leak or reuse. Roles come from the `user.role`
 * column and start as "student"; nobody can pick their own.
 */
export function createAuth(deps: { db: Db; env: Env; mailer: Mailer }) {
  const { db, env, mailer } = deps;
  // Secure cookies follow the address, not NODE_ENV, so an https site never sends them in the clear.
  const secure = env.SITE_URL.startsWith('https://');
  const github =
    env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
      ? { github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET } }
      : {};

  return betterAuth({
    appName: 'Aprender',
    baseURL: env.SITE_URL,
    basePath: '/api/auth',
    secret: env.AUTH_SECRET,
    trustedOrigins: [env.SITE_URL],
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification },
    }),
    // Limits live in our own middleware, which counts in the database and so
    // holds across serverless instances. The built-in ones count in memory.
    rateLimit: { enabled: false },
    session: {
      expiresIn: 60 * 60 * 24 * sessionDays,
      updateAge: 60 * 60 * 24,
      // Every request reads the session (and the role) from the database, so a
      // ban or a role change takes effect at once.
      cookieCache: { enabled: false },
    },
    account: { accountLinking: { enabled: true, trustedProviders: ['github'] } },
    socialProviders: github,
    advanced: {
      useSecureCookies: secure,
      defaultCookieAttributes: { httpOnly: true, sameSite: 'lax', secure },
      ipAddress: { ipAddressHeaders: ['x-real-ip', 'x-forwarded-for'] },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => ({
            data: { ...user, name: user.name?.trim() || nameFromEmail(user.email), image: null },
          }),
          after: async (user) => {
            // A profile row always exists, private and with a generated name.
            for (let attempt = 0; attempt < 5; attempt += 1) {
              try {
                await db.insert(schema.profiles).values({ userId: user.id, handle: generateHandle() });

                return;
              } catch (error) {
                if (attempt === 4) {
                  throw error;
                }
              }
            }
          },
        },
      },
    },
    plugins: [
      admin({ defaultRole: 'student', adminRoles: ['admin'] }),
      magicLink({
        expiresIn: 60 * 10,
        // Only a hash of the token is kept, so a copy of the database cannot be used to log in.
        storeToken: 'hashed',
        sendMagicLink: async ({ email, url }) => {
          const mail = loginMail(url);

          await mailer({ to: email, ...mail });
        },
      }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
