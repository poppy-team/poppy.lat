import { eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { deps, readJson, requireUser, type AppEnv } from '../context.ts';
import * as t from '../db/schema.ts';
import { iso } from '../lib/http.ts';
import { isLessonId } from '../lib/catalog.ts';
import { rateLimit } from '../lib/rate-limit.ts';

const lessonEntry = z
  .object({
    id: z.string().max(200).refine(isLessonId, 'Essa aula não existe.'),
    status: z.enum(['started', 'completed']),
    codeTab: z.enum(['Ori', 'Aipo']).nullish(),
  })
  .strict();

const progressInput = z.object({ lessons: z.array(lessonEntry).max(200) }).strict();

export function progressRoutes() {
  const app = new Hono<AppEnv>();

  app.get('/me/progress', async (c) => {
    const user = requireUser(c);
    const rows = await deps(c).db.select().from(t.lessonProgress).where(eq(t.lessonProgress.userId, user.id));

    return c.json({
      lessons: rows.map((row) => ({ id: row.lessonId, status: row.status, codeTab: row.codeTab, updatedAt: iso(row.updatedAt) })),
    });
  });

  /**
   * Merges what the browser knows into the account. Finishing a lesson is
   * never undone by a merge, so signing in on a second device cannot lose it.
   */
  app.put('/me/progress', async (c) => {
    const user = requireUser(c);
    const { db, client } = deps(c);
    const input = await readJson(c, progressInput);

    await rateLimit(client, 'progress', user.id, 120, 3600);

    for (const lesson of input.lessons) {
      await db
        .insert(t.lessonProgress)
        .values({ userId: user.id, lessonId: lesson.id, status: lesson.status, codeTab: lesson.codeTab ?? null })
        .onConflictDoUpdate({
          target: [t.lessonProgress.userId, t.lessonProgress.lessonId],
          set: {
            status: sql`CASE WHEN ${t.lessonProgress.status} = 'completed' THEN 'completed' ELSE excluded.status END`,
            codeTab: sql`COALESCE(excluded.code_tab, ${t.lessonProgress.codeTab})`,
            updatedAt: sql`(datetime('now'))`,
          },
        });
    }

    const rows = await db.select().from(t.lessonProgress).where(eq(t.lessonProgress.userId, user.id));

    return c.json({
      lessons: rows.map((row) => ({ id: row.lessonId, status: row.status, codeTab: row.codeTab, updatedAt: iso(row.updatedAt) })),
    });
  });

  return app;
}
