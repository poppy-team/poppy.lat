import { randomBytes } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { deps, readJson, requireRecentLogin, requireUser, type AppEnv } from '../context.ts';
import * as t from '../db/schema.ts';
import { handleSchema } from '../lib/handle.ts';
import { HttpError, iso } from '../lib/http.ts';
import { avatarMaxInputBytes, processAvatar } from '../lib/images.ts';
import { isLinkService, normalizeLink } from '../lib/links.ts';
import { loadProfile } from '../lib/profile.ts';
import { rateLimit } from '../lib/rate-limit.ts';
import { containsAddress, text } from '../lib/text.ts';

const profileInput = z
  .object({
    name: text(1, 40),
    handle: handleSchema,
    bio: text(0, 280, { multiline: false }).refine((value) => !containsAddress(value), 'Coloque endereços na seção de links, não na bio.'),
    isPublic: z.boolean(),
    showInRankings: z.boolean(),
  })
  .strict();

const linkInput = z.object({ value: z.string().min(1).max(200) }).strict();

const deleteInput = z.object({ confirm: z.string().min(1).max(40) }).strict();

/** Everything about the logged-in person: their profile, their photo and their links. */
export function profileRoutes() {
  const app = new Hono<AppEnv>();

  /** Like /me, but "nobody is logged in" is an answer, not an error, so the browser console stays quiet for visitors. */
  app.get('/whoami', async (c) => {
    const user = c.get('user');

    if (!user) {
      return c.json({ me: null });
    }

    const profile = await loadProfile(deps(c).db, user.id, { loggedIn: true });

    return c.json({ me: { user: { id: user.id, name: user.name, email: user.email, role: user.role }, profile } });
  });

  app.get('/me', async (c) => {
    const user = requireUser(c);
    const { db } = deps(c);
    const profile = await loadProfile(db, user.id, { loggedIn: true });

    return c.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, profile });
  });

  app.put('/me/profile', async (c) => {
    const user = requireUser(c);
    const { db, client } = deps(c);
    const input = await readJson(c, profileInput);
    const [current] = await db.select({ handle: t.profiles.handle }).from(t.profiles).where(eq(t.profiles.userId, user.id));

    if (!current) {
      throw new HttpError(404, 'not_found', 'Perfil não encontrado.');
    }

    if (current.handle !== input.handle) {
      await rateLimit(client, 'handle-change', user.id, 3, 24 * 3600);
    }

    try {
      await client.batch(
        [
          { sql: 'UPDATE user SET name = ?, updated_at = ? WHERE id = ?', args: [input.name, Date.now(), user.id] },
          {
            sql: 'UPDATE profiles SET handle = ?, bio = ?, is_public = ?, show_in_rankings = ? WHERE user_id = ?',
            args: [input.handle, input.bio, input.isPublic ? 1 : 0, input.showInRankings ? 1 : 0, user.id],
          },
        ],
        'write',
      );
    } catch (error) {
      if (error instanceof Error && /UNIQUE|constraint/iu.test(error.message)) {
        throw new HttpError(409, 'handle_taken', 'Este nome de usuário já está em uso.');
      }

      throw error;
    }

    return c.json({ profile: await loadProfile(db, user.id, { loggedIn: true }) });
  });

  app.put('/me/photo', async (c) => {
    const user = requireUser(c);
    const { db, client } = deps(c);

    await rateLimit(client, 'photo', user.id, 10, 3600);

    const declared = Number(c.req.header('content-length') ?? '0');

    if (declared > avatarMaxInputBytes) {
      throw new HttpError(413, 'too_large', 'A foto é grande demais. Use uma imagem menor.');
    }

    const body = new Uint8Array(await c.req.arrayBuffer());
    const bytes = await processAvatar(body);
    const key = randomBytes(16).toString('hex');

    await db
      .insert(t.profilePhotos)
      .values({ userId: user.id, photoKey: key, bytes })
      .onConflictDoUpdate({
        target: t.profilePhotos.userId,
        set: { photoKey: key, bytes, updatedAt: sql`(datetime('now'))` },
      });

    return c.json({ photoUrl: `/api/avatar/${key}` });
  });

  app.delete('/me/photo', async (c) => {
    const user = requireUser(c);

    await deps(c).db.delete(t.profilePhotos).where(eq(t.profilePhotos.userId, user.id));

    return c.json({ photoUrl: null });
  });

  app.put('/me/links/:service', async (c) => {
    const user = requireUser(c);
    const service = c.req.param('service');

    if (!isLinkService(service)) {
      throw new HttpError(404, 'not_found', 'Este tipo de link não existe.');
    }

    const { db, client } = deps(c);
    const input = await readJson(c, linkInput);

    await rateLimit(client, 'links', user.id, 30, 3600);

    const value = normalizeLink(service, input.value);

    await db
      .insert(t.profileLinks)
      .values({ userId: user.id, service, value })
      .onConflictDoUpdate({
        target: [t.profileLinks.userId, t.profileLinks.service],
        set: { value, updatedAt: sql`(datetime('now'))` },
      });

    return c.json({ profile: await loadProfile(db, user.id, { loggedIn: true }) });
  });

  app.delete('/me/links/:service', async (c) => {
    const user = requireUser(c);
    const service = c.req.param('service');

    if (!isLinkService(service)) {
      throw new HttpError(404, 'not_found', 'Este tipo de link não existe.');
    }

    const { db } = deps(c);

    await db.delete(t.profileLinks).where(sql`${t.profileLinks.userId} = ${user.id} AND ${t.profileLinks.service} = ${service}`);

    return c.json({ profile: await loadProfile(db, user.id, { loggedIn: true }) });
  });

  /** A copy of everything the site holds about the person, as one JSON file. */
  app.get('/me/export', async (c) => {
    const user = requireUser(c);
    const { db, client } = deps(c);

    await rateLimit(client, 'export', user.id, 5, 3600);

    const [profile, notes, comments, progress, photo] = await Promise.all([
      loadProfile(db, user.id, { loggedIn: true }),
      db.select().from(t.notes).where(eq(t.notes.userId, user.id)),
      db.select().from(t.comments).where(eq(t.comments.authorId, user.id)),
      db.select().from(t.lessonProgress).where(eq(t.lessonProgress.userId, user.id)),
      db.select({ bytes: t.profilePhotos.bytes }).from(t.profilePhotos).where(eq(t.profilePhotos.userId, user.id)),
    ]);

    c.header('Content-Disposition', 'attachment; filename="meus-dados-aprender.json"');

    return c.json({
      exportedAt: new Date().toISOString(),
      account: { email: user.email, role: user.role },
      profile,
      photoWebpBase64: photo[0] ? Buffer.from(photo[0].bytes).toString('base64') : null,
      notes: notes.map((note) => ({ ...note, createdAt: iso(note.createdAt), updatedAt: iso(note.updatedAt) })),
      comments: comments.map((comment) => ({ ...comment, createdAt: iso(comment.createdAt), editedAt: iso(comment.editedAt) })),
      progress,
    });
  });

  /**
   * Deletes the account and what hangs from it. Comments that others have
   * answered stay, without author and with the text replaced, so the
   * conversation around them still makes sense; the rest are deleted.
   */
  app.delete('/me', async (c) => {
    const user = requireRecentLogin(c);
    const { db, client } = deps(c);
    const input = await readJson(c, deleteInput);
    const [profile] = await db.select({ handle: t.profiles.handle }).from(t.profiles).where(eq(t.profiles.userId, user.id));

    if (!profile || input.confirm.trim().toLowerCase() !== profile.handle) {
      throw new HttpError(422, 'confirm_mismatch', 'Escreva o seu nome de usuário para confirmar.');
    }

    if (user.role === 'admin') {
      const [others] = (await client.execute({ sql: "SELECT count(*) AS n FROM user WHERE role = 'admin' AND id <> ?", args: [user.id] })).rows;

      if (Number(others?.n ?? 0) === 0) {
        throw new HttpError(409, 'last_admin', 'Você é a única pessoa administradora. Passe o papel para alguém antes de apagar a conta.');
      }
    }

    await client.batch(
      [
        {
          sql: `UPDATE comments SET author_id = NULL, body_md = '[removido]', status = 'deleted_by_author', is_pinned = 0, is_official = 0
                WHERE author_id = ? AND EXISTS (SELECT 1 FROM comments child WHERE child.parent_id = comments.id AND (child.author_id IS NULL OR child.author_id <> ?))`,
          args: [user.id, user.id],
        },
        { sql: 'DELETE FROM comments WHERE author_id = ?', args: [user.id] },
        { sql: 'DELETE FROM comment_reactions WHERE user_id = ?', args: [user.id] },
        { sql: 'DELETE FROM reports WHERE reporter_id = ?', args: [user.id] },
        { sql: 'DELETE FROM notes WHERE user_id = ?', args: [user.id] },
        { sql: 'DELETE FROM lesson_progress WHERE user_id = ?', args: [user.id] },
        { sql: 'DELETE FROM profile_links WHERE user_id = ?', args: [user.id] },
        { sql: 'DELETE FROM profile_photos WHERE user_id = ?', args: [user.id] },
        { sql: 'DELETE FROM user_mutes WHERE user_id = ?', args: [user.id] },
        { sql: 'DELETE FROM profiles WHERE user_id = ?', args: [user.id] },
        { sql: 'DELETE FROM session WHERE user_id = ?', args: [user.id] },
        { sql: 'DELETE FROM account WHERE user_id = ?', args: [user.id] },
        { sql: 'DELETE FROM user WHERE id = ?', args: [user.id] },
      ],
      'write',
    );

    return c.json({ deleted: true });
  });

  return app;
}

