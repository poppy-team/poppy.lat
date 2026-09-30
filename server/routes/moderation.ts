import { Hono } from 'hono';
import { z } from 'zod';
import { deps, readJson, requireCan, requireRecentLogin, type AppEnv, type Ctx, type CurrentUser } from '../context.ts';
import { can, outranks, roles, type Role } from '../lib/can.ts';
import { commentSelect, toViews, type Viewer } from '../lib/comments.ts';
import { HttpError, iso } from '../lib/http.ts';
import { rateLimit } from '../lib/rate-limit.ts';
import { effectiveRole } from '../lib/role-sql.ts';
import { text } from '../lib/text.ts';

const reason = text(3, 300);
const optionalReason = text(0, 300).default('');

interface Target {
  id: string;
  role: Role;
  handle: string;
  banned: boolean;
}

/**
 * Moderation. Every action here needs a role that allows it, is refused
 * against someone of equal or higher role (an admin may act on anyone who is
 * not an admin), and writes one line in `moderation_log`, which the database
 * itself refuses to change or delete afterwards. Better Auth's own /admin
 * endpoints are not reachable; this is the only way in.
 */
export function moderationRoutes() {
  const app = new Hono<AppEnv>();

  function log(actor: CurrentUser, action: string, targetType: string, targetId: string, why: string) {
    return {
      sql: 'INSERT INTO moderation_log (actor_id, action, target_type, target_id, reason) VALUES (?, ?, ?, ?, ?)',
      args: [actor.id, action, targetType, targetId, why],
    };
  }

  async function userByHandle(c: Ctx, handle: string): Promise<Target> {
    // Automatic names (aluno-xxxxxx) are not valid choices for a person, but they do exist.
    const clean = handle.trim().toLowerCase();
    const [row] = /^[a-z0-9-]{3,24}$/u.test(clean)
      ? (
          await deps(c).client.execute({
            sql: `SELECT u.id, ${effectiveRole('u')} AS role, u.banned, p.handle FROM profiles p JOIN user u ON u.id = p.user_id WHERE p.handle = ?`,
            args: [clean],
          })
        ).rows
      : [];

    if (!row) {
      throw new HttpError(404, 'not_found', 'Pessoa não encontrada.');
    }

    return { id: String(row.id), role: String(row.role) as Role, handle: String(row.handle), banned: Number(row.banned) === 1 };
  }

  function mustOutrank(actor: CurrentUser, target: { id: string; role: Role }) {
    if (target.id === actor.id) {
      throw new HttpError(403, 'forbidden', 'Você não pode fazer isto com a sua própria conta.');
    }

    if (!outranks(actor.role, target.role)) {
      throw new HttpError(403, 'forbidden', 'Você não pode agir sobre alguém do mesmo nível ou acima.');
    }
  }

  /** The comment and its author's role, for the rank check. Anonymous authors rank as students. */
  async function commentTarget(c: Ctx, id: string) {
    const [row] = (
      await deps(c).client.execute({
        sql: `SELECT c.id, c.parent_id, c.status, c.author_id, coalesce(${effectiveRole('u')}, 'student') AS role
              FROM comments c LEFT JOIN user u ON u.id = c.author_id WHERE c.id = ?`,
        args: [id],
      })
    ).rows;

    if (!row) {
      throw new HttpError(404, 'not_found', 'Comentário não encontrado.');
    }

    return {
      id: String(row.id),
      parentId: row.parent_id === null ? null : String(row.parent_id),
      status: String(row.status),
      authorId: row.author_id === null ? null : String(row.author_id),
      role: String(row.role) as Role,
    };
  }

  function mayActOnComment(actor: CurrentUser, author: Role, authorId: string | null) {
    // Admins may act on any comment; contributors only on students' and on ones without an account.
    if (actor.role !== 'admin' && authorId !== null && !outranks(actor.role, author)) {
      throw new HttpError(403, 'forbidden', 'Você não pode moderar o comentário de alguém do mesmo nível ou acima.');
    }
  }

  const viewer = (user: CurrentUser): Viewer => ({ id: user.id, isModerator: true });

  app.get('/mod/reports', async (c) => {
    const user = requireCan(c, 'report:resolve');
    const { client } = deps(c);
    const status = z.enum(['open', 'resolved', 'dismissed']).default('open').parse(c.req.query('status'));
    const rows = (
      await client.execute({
        sql: `SELECT r.id AS report_id, r.reason, r.details, r.status AS report_status, r.created_at AS reported_at, rp.handle AS reporter_handle,
                     c.id AS comment_id
              FROM reports r
              JOIN comments c ON c.id = r.comment_id
              LEFT JOIN profiles rp ON rp.user_id = r.reporter_id
              WHERE r.status = ? ORDER BY r.created_at ASC LIMIT 50`,
        args: [status],
      })
    ).rows;
    const commentRows = [];

    for (const row of rows) {
      const [comment] = (await client.execute({ sql: `${commentSelect} WHERE c.id = ?`, args: [String(row.comment_id)] })).rows;

      if (comment) {
        commentRows.push(comment);
      }
    }

    const views = new Map((await toViews(client, commentRows, viewer(user))).map((view) => [view.id, view]));

    return c.json({
      reports: rows.map((row) => ({
        id: String(row.report_id),
        reason: String(row.reason),
        details: String(row.details),
        status: String(row.report_status),
        reportedAt: iso(String(row.reported_at)),
        reporter: row.reporter_handle === null ? null : String(row.reporter_handle),
        comment: views.get(String(row.comment_id)) ?? null,
      })),
    });
  });

  app.post('/mod/reports/:id/resolve', async (c) => {
    const user = requireCan(c, 'report:resolve');
    const { client } = deps(c);
    const id = c.req.param('id');
    const input = await readJson(c, z.object({ status: z.enum(['resolved', 'dismissed']), note: optionalReason }).strict());
    const [report] = (await client.execute({ sql: 'SELECT status FROM reports WHERE id = ?', args: [id] })).rows;

    if (!report) {
      throw new HttpError(404, 'not_found', 'Denúncia não encontrada.');
    }

    await client.batch(
      [
        { sql: 'UPDATE reports SET status = ? WHERE id = ?', args: [input.status, id] },
        log(user, `report_${input.status}`, 'report', id, input.note),
      ],
      'write',
    );

    return c.json({ status: input.status });
  });

  app.post('/mod/comments/:id/hide', async (c) => {
    const user = requireCan(c, 'comment:hide');
    const target = await commentTarget(c, c.req.param('id'));
    const input = await readJson(c, z.object({ reason }).strict());

    mayActOnComment(user, target.role, target.authorId);

    await deps(c).client.batch(
      [
        {
          sql: "UPDATE comments SET status = 'hidden_by_moderator', hidden_reason = ?, is_pinned = 0, is_official = 0 WHERE id = ? AND status <> 'deleted_by_author'",
          args: [input.reason, target.id],
        },
        // Reports about a comment that is now hidden are settled.
        { sql: "UPDATE reports SET status = 'resolved' WHERE comment_id = ? AND status = 'open'", args: [target.id] },
        log(user, 'hide', 'comment', target.id, input.reason),
      ],
      'write',
    );

    return c.json({ status: 'hidden_by_moderator' });
  });

  app.post('/mod/comments/:id/restore', async (c) => {
    const user = requireCan(c, 'comment:restore');
    const target = await commentTarget(c, c.req.param('id'));
    const input = await readJson(c, z.object({ reason: optionalReason }).strict());

    mayActOnComment(user, target.role, target.authorId);

    if (target.status !== 'hidden_by_moderator') {
      throw new HttpError(409, 'not_hidden', 'Este comentário não está oculto pela moderação.');
    }

    await deps(c).client.batch(
      [
        { sql: "UPDATE comments SET status = 'visible', hidden_reason = NULL WHERE id = ?", args: [target.id] },
        log(user, 'restore', 'comment', target.id, input.reason),
      ],
      'write',
    );

    return c.json({ status: 'visible' });
  });

  app.post('/mod/comments/:id/pin', async (c) => {
    const user = requireCan(c, 'comment:pin');
    const target = await commentTarget(c, c.req.param('id'));
    const input = await readJson(c, z.object({ value: z.boolean() }).strict());

    if (target.authorId !== user.id) {
      mayActOnComment(user, target.role, target.authorId);
    }

    if (target.parentId !== null || target.status !== 'visible') {
      throw new HttpError(422, 'not_pinnable', 'Só comentários principais e visíveis podem ser fixados.');
    }

    await deps(c).client.batch(
      [
        { sql: 'UPDATE comments SET is_pinned = ? WHERE id = ?', args: [input.value ? 1 : 0, target.id] },
        log(user, input.value ? 'pin' : 'unpin', 'comment', target.id, ''),
      ],
      'write',
    );

    return c.json({ isPinned: input.value });
  });

  app.post('/mod/comments/:id/official', async (c) => {
    const user = requireCan(c, 'comment:official');
    const target = await commentTarget(c, c.req.param('id'));
    const input = await readJson(c, z.object({ value: z.boolean() }).strict());

    if (target.authorId !== user.id) {
      mayActOnComment(user, target.role, target.authorId);
    }

    if (target.status !== 'visible' || (input.value && target.role === 'student')) {
      throw new HttpError(422, 'not_official', 'Só o comentário visível de quem é da equipe pode ser marcado como resposta oficial.');
    }

    await deps(c).client.batch(
      [
        { sql: 'UPDATE comments SET is_official = ? WHERE id = ?', args: [input.value ? 1 : 0, target.id] },
        log(user, input.value ? 'official' : 'unofficial', 'comment', target.id, ''),
      ],
      'write',
    );

    return c.json({ isOfficial: input.value });
  });

  /** Removes a comment and its replies for good. Only for content that must not stay even in the database. */
  app.delete('/mod/comments/:id', async (c) => {
    const user = requireRecentLogin(c);

    requireCan(c, 'comment:purge');

    const target = await commentTarget(c, c.req.param('id'));
    const input = await readJson(c, z.object({ reason }).strict());

    await deps(c).client.batch(
      [
        { sql: 'DELETE FROM comments WHERE id = ?', args: [target.id] },
        log(user, 'purge', 'comment', target.id, input.reason),
      ],
      'write',
    );

    return c.json({ deleted: true });
  });

  app.get('/mod/users/:handle', async (c) => {
    requireCan(c, 'user:mute');

    const target = await userByHandle(c, c.req.param('handle'));
    const [mute] = (await deps(c).client.execute({ sql: 'SELECT muted_until, reason FROM user_mutes WHERE user_id = ?', args: [target.id] })).rows;
    const muted = mute && Number(mute.muted_until) > Date.now();

    return c.json({
      handle: target.handle,
      role: target.role,
      banned: target.banned,
      mutedUntil: muted ? new Date(Number(mute.muted_until)).toISOString() : null,
    });
  });

  app.post('/mod/users/:handle/mute', async (c) => {
    const user = requireCan(c, 'user:mute');
    const target = await userByHandle(c, c.req.param('handle'));
    const input = await readJson(c, z.object({ hours: z.number().int().min(1).max(24 * 30), reason }).strict());

    mustOutrank(user, target);

    const until = Date.now() + input.hours * 3600 * 1000;

    await deps(c).client.batch(
      [
        {
          sql: `INSERT INTO user_mutes (user_id, muted_until, reason, created_by) VALUES (?, ?, ?, ?)
                ON CONFLICT (user_id) DO UPDATE SET muted_until = excluded.muted_until, reason = excluded.reason, created_by = excluded.created_by`,
          args: [target.id, until, input.reason, user.id],
        },
        log(user, 'mute', 'user', target.id, `${input.hours}h: ${input.reason}`),
      ],
      'write',
    );

    return c.json({ mutedUntil: new Date(until).toISOString() });
  });

  app.delete('/mod/users/:handle/mute', async (c) => {
    const user = requireCan(c, 'user:mute');
    const target = await userByHandle(c, c.req.param('handle'));

    mustOutrank(user, target);

    await deps(c).client.batch(
      [{ sql: 'DELETE FROM user_mutes WHERE user_id = ?', args: [target.id] }, log(user, 'unmute', 'user', target.id, '')],
      'write',
    );

    return c.json({ mutedUntil: null });
  });

  app.delete('/mod/users/:handle/photo', async (c) => {
    const user = requireCan(c, 'photo:remove-other');
    const target = await userByHandle(c, c.req.param('handle'));
    const input = await readJson(c, z.object({ reason }).strict());

    mustOutrank(user, target);

    await deps(c).client.batch(
      [
        { sql: 'DELETE FROM profile_photos WHERE user_id = ?', args: [target.id] },
        log(user, 'photo_remove', 'user', target.id, input.reason),
      ],
      'write',
    );

    return c.json({ photoUrl: null });
  });

  app.post('/mod/users/:handle/ban', async (c) => {
    const user = requireRecentLogin(c);

    requireCan(c, 'user:ban');

    const target = await userByHandle(c, c.req.param('handle'));
    const input = await readJson(c, z.object({ reason, days: z.number().int().min(1).max(3650).nullish() }).strict());

    mustOutrank(user, target);

    const expires = input.days ? Date.now() + input.days * 86_400_000 : null;

    await deps(c).client.batch(
      [
        { sql: 'UPDATE user SET banned = 1, ban_reason = ?, ban_expires = ?, updated_at = ? WHERE id = ?', args: [input.reason, expires, Date.now(), target.id] },
        // Every open session ends now.
        { sql: 'DELETE FROM session WHERE user_id = ?', args: [target.id] },
        log(user, 'ban', 'user', target.id, input.days ? `${input.days}d: ${input.reason}` : input.reason),
      ],
      'write',
    );

    return c.json({ banned: true });
  });

  app.delete('/mod/users/:handle/ban', async (c) => {
    const user = requireRecentLogin(c);

    requireCan(c, 'user:ban');

    const target = await userByHandle(c, c.req.param('handle'));
    const input = await readJson(c, z.object({ reason: optionalReason }).strict());

    mustOutrank(user, target);

    await deps(c).client.batch(
      [
        { sql: 'UPDATE user SET banned = 0, ban_reason = NULL, ban_expires = NULL, updated_at = ? WHERE id = ?', args: [Date.now(), target.id] },
        log(user, 'unban', 'user', target.id, input.reason),
      ],
      'write',
    );

    return c.json({ banned: false });
  });

  app.put('/mod/users/:handle/role', async (c) => {
    const user = requireRecentLogin(c);

    requireCan(c, 'user:role');

    const { client } = deps(c);
    const target = await userByHandle(c, c.req.param('handle'));
    const input = await readJson(c, z.object({ role: z.enum(roles), reason }).strict());

    // Another admin cannot be changed from here, so an admin can never be
    // demoted by mistake and the last one can never be removed.
    mustOutrank(user, target);
    await rateLimit(client, 'role-change', user.id, 20, 3600);

    // "Creator" is a grant on top of the student role (see migration 007); every other role clears it.
    const base = input.role === 'creator' ? 'student' : input.role;

    await client.batch(
      [
        { sql: 'UPDATE user SET role = ?, updated_at = ? WHERE id = ?', args: [base, Date.now(), target.id] },
        input.role === 'creator'
          ? { sql: `INSERT OR IGNORE INTO user_grants (user_id, capability, granted_by) VALUES (?, 'creator', ?)`, args: [target.id, user.id] }
          : { sql: `DELETE FROM user_grants WHERE user_id = ? AND capability = 'creator'`, args: [target.id] },
        log(user, 'role_change', 'user', target.id, `${target.role} -> ${input.role}: ${input.reason}`),
      ],
      'write',
    );

    return c.json({ role: input.role });
  });

  app.get('/mod/log', async (c) => {
    const user = requireRecentLogin(c);

    if (!can(user, 'log:read')) {
      throw new HttpError(403, 'forbidden', 'Você não tem permissão para fazer isto.');
    }

    const limit = z.coerce.number().int().min(1).max(100).default(50).parse(c.req.query('limit'));
    const rows = (
      await deps(c).client.execute({
        sql: `SELECT l.id, l.action, l.target_type, l.target_id, l.reason, l.created_at, ap.handle AS actor, tp.handle AS target
              FROM moderation_log l
              LEFT JOIN profiles ap ON ap.user_id = l.actor_id
              LEFT JOIN profiles tp ON l.target_type = 'user' AND tp.user_id = l.target_id
              ORDER BY l.id DESC LIMIT ?`,
        args: [limit],
      })
    ).rows;

    return c.json({
      entries: rows.map((row) => ({
        id: Number(row.id),
        action: String(row.action),
        targetType: String(row.target_type),
        targetId: String(row.target_id),
        target: row.target === null ? null : String(row.target),
        actor: row.actor === null ? null : String(row.actor),
        reason: String(row.reason),
        at: iso(String(row.created_at)),
      })),
    });
  });

  return app;
}
