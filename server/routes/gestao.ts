import { Hono } from 'hono';
import { z } from 'zod';
import { deps, requireCan, type AppEnv } from '../context.ts';
import { roles } from '../lib/can.ts';
import { iso } from '../lib/http.ts';
import { effectiveRole } from '../lib/role-sql.ts';
import { likePattern } from '../lib/text.ts';

/**
 * The management panel (/gestao). Only what is about people and content: this
 * file lists the people. Changing a role, banning and muting live with the
 * moderation routes, which check rank and write the log, so there is a single
 * door for every change. Nothing here edits the site or its settings.
 */
export function gestaoRoutes() {
  const app = new Hono<AppEnv>();

  /** People, newest first, with search and a role filter. Admins only: it shows e-mail addresses. */
  app.get('/gestao/users', async (c) => {
    requireCan(c, 'user:list');

    const query = z
      .object({
        q: z.string().trim().max(80).default(''),
        role: z.enum(roles).optional(),
        limit: z.coerce.number().int().min(1).max(50).default(25),
        offset: z.coerce.number().int().min(0).max(100_000).default(0),
      })
      .parse(c.req.query());
    const { client } = deps(c);
    const where: string[] = [];
    const args: (string | number)[] = [];

    if (query.q) {
      where.push(`(u.name LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\' OR p.handle LIKE ? ESCAPE '\\')`);
      args.push(likePattern(query.q), likePattern(query.q), likePattern(query.q));
    }

    if (query.role) {
      where.push(`${effectiveRole('u')} = ?`);
      args.push(query.role);
    }

    const filter = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const from = `FROM user u JOIN profiles p ON p.user_id = u.id ${filter}`;
    const [count] = (await client.execute({ sql: `SELECT COUNT(*) AS n ${from}`, args })).rows;
    const rows = (
      await client.execute({
        sql: `SELECT u.id, u.name, u.email, ${effectiveRole('u')} AS role, u.banned, u.ban_expires, p.handle, p.is_public, p.created_at,
                     (SELECT MAX(s.updated_at) FROM session s WHERE s.user_id = u.id) AS last_seen
              ${from}
              ORDER BY p.created_at DESC, p.handle ASC LIMIT ? OFFSET ?`,
        args: [...args, query.limit + 1, query.offset],
      })
    ).rows;
    const now = Date.now();

    return c.json({
      total: Number(count?.n ?? 0),
      more: rows.length > query.limit,
      users: rows.slice(0, query.limit).map((row) => ({
        handle: String(row.handle),
        name: String(row.name),
        email: String(row.email),
        role: String(row.role),
        banned: Number(row.banned) === 1 && (row.ban_expires === null || Number(row.ban_expires) > now),
        isPublic: Number(row.is_public) === 1,
        joinedAt: iso(String(row.created_at)),
        lastSeenAt: row.last_seen === null ? null : new Date(Number(row.last_seen)).toISOString(),
      })),
    });
  });

  /** How many people there are in each role, for the panel's first screen. */
  app.get('/gestao/summary', async (c) => {
    requireCan(c, 'user:list');

    const rows = (await deps(c).client.execute(`SELECT ${effectiveRole('u')} AS role, COUNT(*) AS n FROM user u GROUP BY 1`)).rows;
    const byRole = Object.fromEntries(roles.map((role) => [role, 0])) as Record<string, number>;

    for (const row of rows) {
      const role = String(row.role);

      byRole[role] = (byRole[role] ?? 0) + Number(row.n);
    }

    return c.json({ byRole });
  });

  return app;
}
