import { randomUUID } from 'node:crypto';
import { and, desc, eq, or, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { deps, readJson, requireCan, type AppEnv, type Ctx } from '../context.ts';
import * as t from '../db/schema.ts';
import { isLessonId } from '../lib/catalog.ts';
import { HttpError, iso } from '../lib/http.ts';
import { rateLimit } from '../lib/rate-limit.ts';
import { likePattern, text } from '../lib/text.ts';

const maxNotesPerUser = 500;

const lessonField = z.string().max(200).refine(isLessonId, 'Essa aula não existe.').nullish();

const createInput = z
  .object({
    title: text(0, 120),
    bodyMd: text(0, 50_000, { multiline: true }),
    lessonId: lessonField,
  })
  .strict();

const updateInput = createInput.extend({ version: z.number().int().min(1) }).strict();

type NoteRow = typeof t.notes.$inferSelect;

function view(note: NoteRow) {
  return {
    id: note.id,
    title: note.title,
    bodyMd: note.bodyMd,
    lessonId: note.lessonId,
    version: note.version,
    createdAt: iso(note.createdAt),
    updatedAt: iso(note.updatedAt),
  };
}

function summary(note: NoteRow) {
  const { bodyMd, ...rest } = view(note);

  return { ...rest, excerpt: bodyMd.slice(0, 200) };
}

/**
 * Notes belong to one person and nobody else can read them, moderators and
 * administrators included: every query filters by the logged-in user's id, and
 * a note of someone else answers "not found", never "forbidden".
 */
export function noteRoutes() {
  const app = new Hono<AppEnv>();

  async function ownNote(c: Ctx, id: string): Promise<NoteRow> {
    const user = requireCan(c, 'notes:own', { ownerId: c.get('user')?.id ?? null });
    const [note] = await deps(c).db.select().from(t.notes).where(and(eq(t.notes.id, id), eq(t.notes.userId, user.id)));

    if (!note) {
      throw new HttpError(404, 'not_found', 'Anotação não encontrada.');
    }

    return note;
  }

  app.get('/me/notes', async (c) => {
    const user = requireCan(c, 'notes:own', { ownerId: c.get('user')?.id ?? null });
    const { db } = deps(c);
    const query = z
      .object({
        lesson: z.string().max(200).optional(),
        q: z.string().max(80).optional(),
        limit: z.coerce.number().int().min(1).max(50).default(30),
        offset: z.coerce.number().int().min(0).max(1000).default(0),
      })
      .parse(c.req.query());
    const filters = [eq(t.notes.userId, user.id)];

    if (query.lesson) {
      filters.push(eq(t.notes.lessonId, query.lesson));
    }

    if (query.q?.trim()) {
      const pattern = likePattern(query.q.trim());

      filters.push(or(sql`${t.notes.title} LIKE ${pattern} ESCAPE '\\'`, sql`${t.notes.bodyMd} LIKE ${pattern} ESCAPE '\\'`)!);
    }

    const rows = await db
      .select()
      .from(t.notes)
      .where(and(...filters))
      .orderBy(desc(t.notes.updatedAt), desc(t.notes.id))
      .limit(query.limit)
      .offset(query.offset);

    return c.json({ notes: rows.map(summary) });
  });

  app.get('/me/notes/:id', async (c) => c.json({ note: view(await ownNote(c, c.req.param('id'))) }));

  app.post('/me/notes', async (c) => {
    const user = requireCan(c, 'notes:own', { ownerId: c.get('user')?.id ?? null });
    const { db, client } = deps(c);
    const input = await readJson(c, createInput);

    await rateLimit(client, 'note-create', user.id, 60, 3600);

    const [count] = await db.select({ n: sql<number>`count(*)` }).from(t.notes).where(eq(t.notes.userId, user.id));

    if ((count?.n ?? 0) >= maxNotesPerUser) {
      throw new HttpError(409, 'notes_full', `Você chegou ao limite de ${maxNotesPerUser} anotações. Apague ou baixe algumas antes de criar outras.`);
    }

    const [note] = await db
      .insert(t.notes)
      .values({ id: randomUUID(), userId: user.id, title: input.title, bodyMd: input.bodyMd, lessonId: input.lessonId ?? null })
      .returning();

    return c.json({ note: view(note!) }, 201);
  });

  /**
   * Saves a note only if the version the browser edited is still the current
   * one. Two tabs (or devices) never silently overwrite each other: the second
   * gets 409 with the saved version and decides what to keep.
   */
  app.put('/me/notes/:id', async (c) => {
    const id = c.req.param('id');
    const current = await ownNote(c, id);
    const { db, client } = deps(c);
    const input = await readJson(c, updateInput);

    await rateLimit(client, 'note-save', current.userId, 900, 3600);

    const [saved] = await db
      .update(t.notes)
      .set({
        title: input.title,
        bodyMd: input.bodyMd,
        lessonId: input.lessonId ?? null,
        version: sql`${t.notes.version} + 1`,
        updatedAt: sql`(datetime('now'))`,
      })
      .where(and(eq(t.notes.id, id), eq(t.notes.userId, current.userId), eq(t.notes.version, input.version)))
      .returning();

    if (!saved) {
      const latest = await ownNote(c, id);

      throw new HttpError(409, 'version_conflict', 'Esta anotação foi alterada em outro lugar.', { note: view(latest) });
    }

    return c.json({ note: view(saved) });
  });

  app.delete('/me/notes/:id', async (c) => {
    const note = await ownNote(c, c.req.param('id'));

    await deps(c).db.delete(t.notes).where(and(eq(t.notes.id, note.id), eq(t.notes.userId, note.userId)));

    return c.json({ deleted: true });
  });

  return app;
}

