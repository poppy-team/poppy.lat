import { Hono } from 'hono';
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
const fromReplies = `
  FROM comments r
  JOIN comments parent ON parent.id = r.parent_id
  JOIN profiles me ON me.user_id = parent.author_id
  LEFT JOIN user u ON u.id = r.author_id
  LEFT JOIN profiles pr ON pr.user_id = r.author_id
  WHERE parent.author_id = ?
    AND r.author_id IS NOT NULL AND r.author_id <> parent.author_id
    AND r.status = 'visible'`;

/** True for the replies posted after the last time the person opened the list. */
const isNew = `r.created_at > COALESCE(me.notifications_seen_at, me.created_at)`;

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

  /** The bell: replies to the comments of the person, and how many are new. */
  app.get('/me/notifications', async (c) => {
    const user = requireUser(c);
    const { client } = deps(c);
    const [count] = (await client.execute({ sql: `SELECT COUNT(*) AS unread ${fromReplies} AND ${isNew}`, args: [user.id] })).rows;
    const items = (
      await client.execute({
        sql: `SELECT r.id, r.target_id, r.body_md, r.created_at, u.name, pr.handle, pr.is_public, (${isNew}) AS is_new
              ${fromReplies}
              ORDER BY r.created_at DESC, r.rowid DESC LIMIT 20`,
        args: [user.id],
      })
    ).rows;

    return c.json({
      unread: Number(count?.unread ?? 0),
      items: items.map((row) => ({
        id: String(row.id),
        lessonId: String(row.target_id),
        excerpt: excerpt(row.body_md),
        createdAt: iso(String(row.created_at)),
        isNew: Number(row.is_new) === 1,
        by: { name: String(row.name ?? ''), handle: Number(row.is_public) === 1 ? String(row.handle) : null },
      })),
    });
  });

  /** Opening the list marks everything up to now as seen. */
  app.post('/me/notifications/seen', async (c) => {
    const user = requireUser(c);

    await deps(c).client.execute({
      sql: `UPDATE profiles SET notifications_seen_at = datetime('now') WHERE user_id = ?`,
      args: [user.id],
    });

    return c.json({ unread: 0 });
  });

  return app;
}
