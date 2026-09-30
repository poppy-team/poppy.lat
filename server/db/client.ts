import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema.ts';

export type Db = ReturnType<typeof createDb>['db'];

export function createDb(url: string, authToken?: string): { client: Client; db: ReturnType<typeof drizzle<typeof schema>> } {
  const client = createClient(authToken ? { url, authToken } : { url });

  return { client, db: drizzle(client, { schema }) };
}

const migrationsDir = path.join(import.meta.dirname, 'migrations');

/**
 * Applies the numbered `.sql` files that have not run yet, each in its own
 * transaction, and records them. Safe to run again: it only does what is new.
 */
export async function migrate(client: Client, dir: string = migrationsDir): Promise<string[]> {
  await client.execute(
    'CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime(\'now\')))',
  );

  const done = new Set((await client.execute('SELECT name FROM _migrations')).rows.map((row) => String(row.name)));
  const files = readdirSync(dir)
    .filter((file) => /^\d+-.+\.sql$/u.test(file))
    .sort();
  const applied: string[] = [];

  for (const file of files) {
    if (done.has(file)) {
      continue;
    }

    const body = readFileSync(path.join(dir, file), 'utf8');
    const transaction = await client.transaction('write');

    try {
      await transaction.executeMultiple(body);
      await transaction.execute({ sql: 'INSERT INTO _migrations (name) VALUES (?)', args: [file] });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Migration ${file} failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      transaction.close();
    }

    applied.push(file);
  }

  return applied;
}

/** A private in-memory database with every migration applied, for tests. */
export async function createTestDb() {
  const handle = createDb(':memory:');
  await migrate(handle.client);

  return handle;
}
