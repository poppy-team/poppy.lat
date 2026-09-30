import { and, asc, eq, inArray } from 'drizzle-orm';
import { Hono } from 'hono';
import { deps, requireUser, type AppEnv } from '../context.ts';
import * as t from '../db/schema.ts';
import { HttpError } from '../lib/http.ts';
import { loadProfile, type ProfileView } from '../lib/profile.ts';

export function publicRoutes() {
  const app = new Hono<AppEnv>();

  /** A public profile. A private one answers exactly like one that does not exist. */
  app.get('/u/:handle', async (c) => {
    const { db } = deps(c);
    const viewer = c.get('user');
    const [row] = await db
      .select({ userId: t.profiles.userId, isPublic: t.profiles.isPublic })
      .from(t.profiles)
      .where(eq(t.profiles.handle, c.req.param('handle').toLowerCase()));

    if (!row || (!row.isPublic && row.userId !== viewer?.id)) {
      throw new HttpError(404, 'not_found', 'Perfil não encontrado.');
    }

    return c.json({ profile: await loadProfile(db, row.userId, { loggedIn: Boolean(viewer) }) });
  });

  /**
   * The team page: people who are contributors or admins and have chosen to
   * make their profile public. A private profile is never listed, whatever the
   * role. Photos and e-mail follow the same rule as any public profile.
   */
  app.get('/team', async (c) => {
    const { db } = deps(c);
    const viewer = c.get('user');
    const rows = await db
      .select({ userId: t.profiles.userId })
      .from(t.profiles)
      .innerJoin(t.user, eq(t.user.id, t.profiles.userId))
      .where(and(eq(t.profiles.isPublic, true), inArray(t.user.role, ['contributor', 'admin'])))
      .orderBy(asc(t.profiles.createdAt), asc(t.profiles.handle));
    const members: ProfileView[] = [];

    for (const row of rows) {
      const profile = await loadProfile(db, row.userId, { loggedIn: Boolean(viewer) });

      if (profile) {
        members.push(profile);
      }
    }

    c.header('Cache-Control', 'private, no-store');

    return c.json({ members });
  });

  /** Photos are only for people who are logged in; the address holds a random key. */
  app.get('/avatar/:key', async (c) => {
    requireUser(c);

    const key = c.req.param('key');
    const [photo] = /^[a-f0-9]{32}$/u.test(key)
      ? await deps(c).db.select({ bytes: t.profilePhotos.bytes }).from(t.profilePhotos).where(eq(t.profilePhotos.photoKey, key))
      : [];

    if (!photo) {
      throw new HttpError(404, 'not_found', 'Foto não encontrada.');
    }

    return new Response(new Uint8Array(photo.bytes), {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'private, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  });

  return app;
}
