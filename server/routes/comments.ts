import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { z } from 'zod';
import { can } from '../lib/can.ts';
import { deps, readJson, requireCan, requireUser, type AppEnv } from '../context.ts';
import { isLessonId } from '../lib/catalog.ts';
import { commentSelect, placeholders, reactionEmojis, toViews, type Viewer } from '../lib/comments.ts';
import { HttpError } from '../lib/http.ts';
import { rateLimit } from '../lib/rate-limit.ts';
import { hasMarkdownImage, containsAddress, text } from '../lib/text.ts';

const bodyField = text(1, 2000, { multiline: true });

const createInput = z
  .object({
    targetType: z.literal('lesson', { error: 'Por enquanto só as aulas têm comentários.' }),
    targetId: z.string().max(200).refine(isLessonId, 'Essa aula não existe.'),
    parentId: z.string().uuid().nullish(),
    bodyMd: bodyField,
  })
  .strict();

const editInput = z.object({ bodyMd: bodyField }).strict();

const reactionInput = z.object({ emoji: z.enum(reactionEmojis), on: z.boolean() }).strict();

const reportInput = z
  .object({
    reason: z.enum(['spam', 'ofensivo', 'fora-do-tema', 'dados-pessoais', 'outro']),
    details: text(0, 500, { multiline: true }).default(''),
  })
  .strict();

const listQuery = z.object({
  targetType: z.literal('lesson'),
  targetId: z.string().max(200).refine(isLessonId, 'Essa aula não existe.'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(1000).default(0),
});

const linksAfter = 3;

export function commentRoutes() {
  const app = new Hono<AppEnv>();

  function viewerOf(c: Parameters<typeof requireUser>[0]): Viewer {
    const user = c.get('user');

    return { id: user?.id ?? null, isModerator: Boolean(user && can(user, 'comment:hide')) };
  }

  /** Reading is open to everyone; only the write actions need an account. */
  app.get('/comments', async (c) => {
    const { client } = deps(c);
    const query = listQuery.parse(c.req.query());
    const viewer = viewerOf(c);
    const roots = (
      await client.execute({
        sql: `${commentSelect}
              WHERE c.target_type = ? AND c.target_id = ? AND c.parent_id IS NULL
                AND (c.status = 'visible' OR ? = 1
                     OR EXISTS (SELECT 1 FROM comments r WHERE r.parent_id = c.id AND r.status = 'visible'))
              ORDER BY c.is_pinned DESC, c.created_at DESC, c.rowid DESC LIMIT ? OFFSET ?`,
        args: [query.targetType, query.targetId, viewer.isModerator ? 1 : 0, query.limit + 1, query.offset],
      })
    ).rows;
    const more = roots.length > query.limit;
    const page = roots.slice(0, query.limit);
    const replies = page.length
      ? (
          await client.execute({
            sql: `${commentSelect} WHERE c.parent_id IN (${placeholders(page.length)}) AND (c.status = 'visible' OR ? = 1)
                  ORDER BY c.created_at ASC, c.rowid ASC LIMIT 500`,
            args: [...page.map((row) => String(row.id)), viewer.isModerator ? 1 : 0],
          })
        ).rows
      : [];
    const [total] = (
      await client.execute({
        sql: "SELECT count(*) AS n FROM comments WHERE target_type = ? AND target_id = ? AND status = 'visible'",
        args: [query.targetType, query.targetId],
      })
    ).rows;

    return c.json({
      comments: await toViews(client, [...page, ...replies], viewer),
      total: Number(total?.n ?? 0),
      more,
    });
  });

  app.post('/comments', async (c) => {
    const user = requireCan(c, 'comment:create');
    const { client } = deps(c);
    const input = await readJson(c, createInput);

    if (hasMarkdownImage.test(input.bodyMd)) {
      throw new HttpError(422, 'no_images', 'Imagens não são aceitas nos comentários.');
    }

    const [mute] = (await client.execute({ sql: 'SELECT muted_until FROM user_mutes WHERE user_id = ?', args: [user.id] })).rows;

    if (mute && Number(mute.muted_until) > Date.now()) {
      throw new HttpError(403, 'muted', 'Você está temporariamente sem poder comentar.', {
        until: new Date(Number(mute.muted_until)).toISOString(),
      });
    }

    await rateLimit(client, 'comment-min', user.id, 5, 60);
    await rateLimit(client, 'comment-hour', user.id, 30, 3600);

    if (user.role === 'student' && containsAddress(input.bodyMd)) {
      const [earlier] = (
        await client.execute({ sql: "SELECT count(*) AS n FROM comments WHERE author_id = ? AND status = 'visible'", args: [user.id] })
      ).rows;

      if (Number(earlier?.n ?? 0) < linksAfter) {
        throw new HttpError(422, 'links_later', `Links ficam liberados depois de ${linksAfter} comentários. É para evitar spam.`);
      }
    }

    let parentId: string | null = null;

    if (input.parentId) {
      const [parent] = (
        await client.execute({
          sql: 'SELECT id, parent_id, target_type, target_id, status FROM comments WHERE id = ?',
          args: [input.parentId],
        })
      ).rows;

      if (!parent || parent.target_type !== input.targetType || parent.target_id !== input.targetId) {
        throw new HttpError(404, 'not_found', 'O comentário respondido não existe.');
      }

      if (parent.status !== 'visible') {
        throw new HttpError(409, 'parent_unavailable', 'Este comentário não recebe mais respostas.');
      }

      // Conversations are one level deep: a reply to a reply goes under the first comment.
      parentId = parent.parent_id === null ? String(parent.id) : String(parent.parent_id);
    }

    const [same] = (
      await client.execute({
        sql: "SELECT 1 AS x FROM comments WHERE author_id = ? AND body_md = ? AND created_at > datetime('now', '-10 minutes')",
        args: [user.id, input.bodyMd],
      })
    ).rows;

    if (same) {
      throw new HttpError(409, 'duplicate', 'Você acabou de enviar exatamente este comentário.');
    }

    const id = randomUUID();

    await client.execute({
      sql: 'INSERT INTO comments (id, target_type, target_id, parent_id, author_id, body_md) VALUES (?, ?, ?, ?, ?, ?)',
      args: [id, input.targetType, input.targetId, parentId, user.id, input.bodyMd],
    });

    const [row] = (await client.execute({ sql: `${commentSelect} WHERE c.id = ?`, args: [id] })).rows;
    const [comment] = await toViews(client, row ? [row] : [], viewerOf(c));

    return c.json({ comment }, 201);
  });

  app.put('/comments/:id', async (c) => {
    const user = requireUser(c);
    const { client } = deps(c);
    const id = c.req.param('id');
    const [current] = (await client.execute({ sql: 'SELECT author_id, status FROM comments WHERE id = ?', args: [id] })).rows;

    // Someone else's comment answers "not found", like a comment that does not exist.
    if (!current || current.author_id !== user.id) {
      throw new HttpError(404, 'not_found', 'Comentário não encontrado.');
    }

    requireCan(c, 'comment:edit-own', { ownerId: String(current.author_id) });

    if (current.status !== 'visible') {
      throw new HttpError(409, 'not_editable', 'Este comentário não pode mais ser editado.');
    }

    const input = await readJson(c, editInput);

    await rateLimit(client, 'comment-edit', user.id, 30, 3600);

    if (hasMarkdownImage.test(input.bodyMd)) {
      throw new HttpError(422, 'no_images', 'Imagens não são aceitas nos comentários.');
    }

    await client.execute({
      sql: "UPDATE comments SET body_md = ?, edited_at = datetime('now') WHERE id = ? AND author_id = ? AND status = 'visible'",
      args: [input.bodyMd, id, user.id],
    });

    const [row] = (await client.execute({ sql: `${commentSelect} WHERE c.id = ?`, args: [id] })).rows;
    const [comment] = await toViews(client, row ? [row] : [], viewerOf(c));

    return c.json({ comment });
  });

  /** Deleting your own comment: gone if nobody answered, otherwise a placeholder keeps the thread readable. */
  app.delete('/comments/:id', async (c) => {
    const user = requireUser(c);
    const { client } = deps(c);
    const id = c.req.param('id');
    const [current] = (await client.execute({ sql: 'SELECT author_id FROM comments WHERE id = ?', args: [id] })).rows;

    if (!current || current.author_id !== user.id) {
      throw new HttpError(404, 'not_found', 'Comentário não encontrado.');
    }

    requireCan(c, 'comment:delete-own', { ownerId: String(current.author_id) });

    const [replies] = (await client.execute({ sql: 'SELECT count(*) AS n FROM comments WHERE parent_id = ?', args: [id] })).rows;

    if (Number(replies?.n ?? 0) > 0) {
      await client.execute({
        sql: "UPDATE comments SET body_md = '[removido]', status = 'deleted_by_author', is_pinned = 0, is_official = 0 WHERE id = ? AND author_id = ?",
        args: [id, user.id],
      });
    } else {
      await client.execute({ sql: 'DELETE FROM comments WHERE id = ? AND author_id = ?', args: [id, user.id] });
    }

    return c.json({ deleted: true });
  });

  app.post('/comments/:id/reactions', async (c) => {
    const user = requireCan(c, 'comment:react');
    const { client } = deps(c);
    const id = c.req.param('id');
    const input = await readJson(c, reactionInput);

    await rateLimit(client, 'reaction', user.id, 120, 3600);

    const [comment] = (await client.execute({ sql: 'SELECT status FROM comments WHERE id = ?', args: [id] })).rows;

    if (!comment || comment.status !== 'visible') {
      throw new HttpError(404, 'not_found', 'Comentário não encontrado.');
    }

    if (input.on) {
      await client.execute({
        sql: 'INSERT OR IGNORE INTO comment_reactions (comment_id, user_id, emoji) VALUES (?, ?, ?)',
        args: [id, user.id, input.emoji],
      });
    } else {
      await client.execute({
        sql: 'DELETE FROM comment_reactions WHERE comment_id = ? AND user_id = ? AND emoji = ?',
        args: [id, user.id, input.emoji],
      });
    }

    const [row] = (await client.execute({ sql: `${commentSelect} WHERE c.id = ?`, args: [id] })).rows;
    const [view] = await toViews(client, row ? [row] : [], viewerOf(c));

    return c.json({ reactions: view?.reactions ?? [] });
  });

  app.post('/comments/:id/report', async (c) => {
    const user = requireCan(c, 'comment:report');
    const { client } = deps(c);
    const id = c.req.param('id');
    const input = await readJson(c, reportInput);

    await rateLimit(client, 'report', user.id, 10, 3600);

    const [comment] = (await client.execute({ sql: 'SELECT author_id, status FROM comments WHERE id = ?', args: [id] })).rows;

    if (!comment || comment.status !== 'visible') {
      throw new HttpError(404, 'not_found', 'Comentário não encontrado.');
    }

    if (comment.author_id === user.id) {
      throw new HttpError(422, 'own_comment', 'Você não pode denunciar o seu próprio comentário.');
    }

    // Reporting twice is harmless: the second time changes nothing.
    await client.execute({
      sql: 'INSERT OR IGNORE INTO reports (id, comment_id, reporter_id, reason, details) VALUES (?, ?, ?, ?, ?)',
      args: [randomUUID(), id, user.id, input.reason, input.details],
    });

    return c.json({ reported: true }, 201);
  });

  return app;
}
