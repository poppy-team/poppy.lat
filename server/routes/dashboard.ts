import { Hono } from 'hono';
import { z } from 'zod';
import type { Context } from 'hono';
import { deps, requireUser, type AppEnv } from '../context.ts';
import { iso } from '../lib/http.ts';

/** A short plain-text excerpt of a comment written in Markdown. */
function excerpt(source: unknown): string {
  const plain = String(source ?? '')
    .replace(/[*_`>#~[\]]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();

  return plain.length > 120 ? `${plain.slice(0, 117)}...` : plain;
}

/**
 * Replies to the comments of the person: a reply from someone else, still
 * visible, under a comment they wrote. The one argument is the person.
 */
const repliesFrom = `
  FROM comments r
  JOIN comments parent ON parent.id = r.parent_id
  JOIN profiles me ON me.user_id = parent.author_id
  LEFT JOIN user u ON u.id = r.author_id
  LEFT JOIN profiles pr ON pr.user_id = r.author_id`;
const repliesWhere = `
  WHERE parent.author_id = ?
    AND r.author_id IS NOT NULL AND r.author_id <> parent.author_id
    AND r.status = 'visible'`;

const fromReplies = `${repliesFrom} ${repliesWhere}`;

/**
 * The same replies as the person's notifications: the ones they have not
 * deleted one by one or all at once, with what they did to each.
 */
const fromNotifications = `${repliesFrom}
  LEFT JOIN notification_state ns ON ns.comment_id = r.id AND ns.user_id = parent.author_id
  ${repliesWhere}
    AND COALESCE(ns.is_deleted, 0) = 0
    AND (me.notifications_cleared_at IS NULL OR r.created_at > me.notifications_cleared_at)`;

/** True for the replies the person has not marked as read, nor covered by "mark all as read". */
const isNew = `COALESCE(ns.is_read, 0) = 0 AND r.created_at > COALESCE(me.notifications_seen_at, me.created_at)`;

const idsBody = z.object({ ids: z.array(z.string().min(1).max(64)).min(1).max(100) });

export function dashboardRoutes() {
  const app = new Hono<AppEnv>();

  /** What the profile panel shows about the conversations of the person. */
  app.get('/me/dashboard', async (c) => {
    const user = requireUser(c);
    const { client } = deps(c);
    const [counts] = (
      await client.execute({
        sql: `SELECT
                (SELECT COUNT(*) FROM comments WHERE author_id = ? AND status = 'visible') AS written,
                (SELECT COUNT(*) ${fromReplies}) AS replies`,
        args: [user.id, user.id],
      })
    ).rows;
    const recent = (
      await client.execute({
        sql: `SELECT c.id, c.target_id, c.body_md, c.created_at,
                     (SELECT COUNT(*) FROM comments r WHERE r.parent_id = c.id AND r.status = 'visible' AND r.author_id IS NOT c.author_id) AS replies
              FROM comments c
              WHERE c.author_id = ? AND c.status = 'visible'
              ORDER BY c.created_at DESC, c.rowid DESC LIMIT 5`,
        args: [user.id],
      })
    ).rows;

    return c.json({
      comments: {
        written: Number(counts?.written ?? 0),
        repliesReceived: Number(counts?.replies ?? 0),
        recent: recent.map((row) => ({
          id: String(row.id),
          lessonId: String(row.target_id),
          excerpt: excerpt(row.body_md),
          createdAt: iso(String(row.created_at)),
          replies: Number(row.replies),
        })),
      },
    });
  });

  /**
   * The bell and the notifications window: replies to the comments of the
   * person, how many are new, and a page of them. `filter=unread` keeps only
   * the new ones.
   */
  app.get('/me/notifications', async (c) => {
    const user = requireUser(c);
    const { client } = deps(c);
    const query = z
      .object({
        limit: z.coerce.number().int().min(1).max(50).default(20),
        offset: z.coerce.number().int().min(0).max(10000).default(0),
        filter: z.enum(['all', 'unread']).default('all'),
      })
      .parse(c.req.query());
    const only = query.filter === 'unread' ? `AND ${isNew}` : '';
    const counts = await summary(c, user.id);
    const items = (
      await client.execute({
        sql: `SELECT r.id, r.target_id, r.body_md, r.created_at, u.name, pr.handle, pr.is_public, (${isNew}) AS is_new
              ${fromNotifications} ${only}
              ORDER BY r.created_at DESC, r.rowid DESC LIMIT ? OFFSET ?`,
        args: [user.id, query.limit + 1, query.offset],
      })
    ).rows;

    return c.json({
      ...counts,
      more: items.length > query.limit,
      items: items.slice(0, query.limit).map((row) => ({
        id: String(row.id),
        lessonId: String(row.target_id),
        excerpt: excerpt(row.body_md),
        createdAt: iso(String(row.created_at)),
        isNew: Number(row.is_new) === 1,
        by: { name: String(row.name ?? ''), handle: Number(row.is_public) === 1 ? String(row.handle) : null },
      })),
    });
  });

  /** Marks the chosen notifications as read. Only replies that really are the person's notifications are touched. */
  app.post('/me/notifications/read', async (c) => {
    const user = requireUser(c);
    const { ids } = idsBody.parse(await c.req.json().catch(() => ({})));

    await setState(c, user.id, ids, 'is_read');

    return c.json(await summary(c, user.id));
  });

  /** Deletes the chosen notifications from the person's list (the comments themselves stay). */
  app.post('/me/notifications/delete', async (c) => {
    const user = requireUser(c);
    const { ids } = idsBody.parse(await c.req.json().catch(() => ({})));

    await setState(c, user.id, ids, 'is_deleted');

    return c.json(await summary(c, user.id));
  });

  /** Marks everything up to now as read. Also what opening the list did before, so older pages keep working. */
  app.post('/me/notifications/read-all', async (c) => markAllRead(c));
  app.post('/me/notifications/seen', async (c) => markAllRead(c));

  /** Deletes every notification written up to now. */
  app.post('/me/notifications/delete-all', async (c) => {
    const user = requireUser(c);

    await deps(c).client.execute({
      sql: `UPDATE profiles SET notifications_cleared_at = datetime('now'), notifications_seen_at = datetime('now') WHERE user_id = ?`,
      args: [user.id],
    });

    return c.json(await summary(c, user.id));
  });

  /** The counters the bell shows, after any change. */
  async function summary(c: Context<AppEnv>, userId: string) {
    const [count] = (
      await deps(c).client.execute({
        sql: `SELECT COUNT(*) AS total, COALESCE(SUM(CASE WHEN ${isNew} THEN 1 ELSE 0 END), 0) AS unread ${fromNotifications}`,
        args: [userId],
      })
    ).rows;

    return { unread: Number(count?.unread ?? 0), total: Number(count?.total ?? 0) };
  }

  async function markAllRead(c: Context<AppEnv>) {
    const user = requireUser(c);

    await deps(c).client.execute({
      sql: `UPDATE profiles SET notifications_seen_at = datetime('now') WHERE user_id = ?`,
      args: [user.id],
    });

    return c.json(await summary(c, user.id));
  }

  async function setState(c: Context<AppEnv>, userId: string, ids: string[], column: 'is_read' | 'is_deleted') {
    const marks = ids.map(() => '?').join(', ');
    // One row per notification that is really this person's; anything else in the list is ignored.
    const mine = (
      await deps(c).client.execute({
        sql: `SELECT r.id ${fromReplies} AND r.id IN (${marks})`,
        args: [userId, ...ids],
      })
    ).rows.map((row) => String(row.id));

    for (const id of mine) {
      await deps(c).client.execute({
        sql: `INSERT INTO notification_state (user_id, comment_id, ${column}) VALUES (?, ?, 1)
              ON CONFLICT (user_id, comment_id) DO UPDATE SET ${column} = 1, updated_at = datetime('now')`,
        args: [userId, id],
      });
    }
  }

  return app;
}
