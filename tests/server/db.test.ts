import { getTableColumns, getTableName } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { createTestDb, migrate } from '../../server/db/client.ts';
import * as schema from '../../server/db/schema.ts';

describe('database', () => {
  test('applies every migration once and is safe to run again', async () => {
    const { client } = await createTestDb();

    expect(await migrate(client)).toEqual([]);

    const tables = (await client.execute("SELECT name FROM sqlite_master WHERE type = 'table'")).rows.map((row) => String(row.name));

    for (const name of ['user', 'session', 'account', 'verification', 'profiles', 'profile_photos', 'profile_links', 'notes', 'comments', 'comment_reactions', 'reports', 'moderation_log', 'lesson_progress', 'rate_limits', 'user_mutes']) {
      expect(tables).toContain(name);
    }
  });

  test('the typed schema matches the real columns', async () => {
    const { client } = await createTestDb();

    for (const table of Object.values(schema)) {
      const name = getTableName(table);
      const real = (await client.execute(`PRAGMA table_info(${name})`)).rows.map((row) => String(row.name)).sort();
      const typed = Object.values(getTableColumns(table)).map((column) => column.name).sort();

      expect({ table: name, columns: typed }).toEqual({ table: name, columns: real });
    }
  });

  test('the moderation log only accepts new rows', async () => {
    const { client } = await createTestDb();

    await client.execute("INSERT INTO moderation_log (actor_id, action, target_type, target_id) VALUES ('a', 'hide', 'comment', 'c')");
    await expect(client.execute("UPDATE moderation_log SET reason = 'x'")).rejects.toThrow(/somente de acréscimo/u);
    await expect(client.execute('DELETE FROM moderation_log')).rejects.toThrow(/somente de acréscimo/u);
  });
});
