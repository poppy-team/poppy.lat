import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, magicLink } from 'better-auth/plugins';
import type { Db } from './db/client.ts';
import * as schema from './db/schema.ts';
import type { Env } from './env.ts';
import { nameFromEmail } from './lib/handle.ts';
import { describeLogArg } from './lib/http.ts';
import { loginMail, type Mailer } from './lib/mail.ts';
import { ensureProfile } from './lib/profile-row.ts';

export const sessionDays = 30;

/**
 * Login by e-mail link (and GitHub or Google when configured). There are no passwords,
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
  const google =
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, prompt: 'select_account' as const } }
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
    // Its default logger prints whole errors, and a failed sign-up carries the SQL with the e-mail and
    // the provider's tokens in it. Only what describeLogArg allows reaches the log.
    logger: {
      level: 'error',
      log: (level, message, ...args) => console.error('[auth]', level, message, args.map(describeLogArg).filter(Boolean).join(' ')),
    },
    session: {
      expiresIn: 60 * 60 * 24 * sessionDays,
      updateAge: 60 * 60 * 24,
      // Every request reads the session (and the role) from the database, so a
      // ban or a role change takes effect at once.
      cookieCache: { enabled: false },
    },
    // Google is not in the trusted list on purpose: an existing account is only linked when Google
    // itself says the address is verified.
    account: { accountLinking: { enabled: true, trustedProviders: ['github'] } },
    socialProviders: { ...github, ...google },
    advanced: {
      useSecureCookies: secure,
      defaultCookieAttributes: { httpOnly: true, sameSite: 'lax', secure },
      ipAddress: { ipAddressHeaders: ['x-real-ip', 'x-forwarded-for'] },
    },
    databaseHooks: {
      // The provider's tokens are only needed to call the provider on someone's behalf, which this site never
      // does. They are not kept, so a copy of the database holds no keys to anyone's Google or GitHub.
      account: {
        create: {
          before: async (account) => ({
            data: {
              ...account,
              accessToken: null,
              refreshToken: null,
              idToken: null,
              accessTokenExpiresAt: null,
              refreshTokenExpiresAt: null,
              scope: null,
            },
          }),
        },
      },
      user: {
        create: {
          before: async (user) => {
            // An address the provider did not vouch for cannot open an account: whoever owns it later
            // would inherit what was done under it. (Magic links only create users after the click.)
            if (!user.emailVerified) {
              return false;
            }

            // The name people see starts as a nickname from the e-mail, for every way of entering,
            // because the profile starts closed. The name the provider sends is not kept.
            return { data: { ...user, name: nameFromEmail(user.email), image: null } };
          },
          after: async (user) => {
            // A profile row always exists, private and with a generated name.
            await ensureProfile(db, user.id);
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
