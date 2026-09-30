import type { Db } from '../db/client.ts';
import * as schema from '../db/schema.ts';
import { generateHandle } from './handle.ts';

/**
 * Makes sure a person has a profile row: private, with a generated handle.
 * It runs when the account is created and, as a repair, when a session finds
 * an account that has none (a sign-up that failed halfway leaves one).
 * A second call, or a parallel one, changes nothing.
 */
export async function ensureProfile(db: Db, userId: string): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await db.insert(schema.profiles).values({ userId, handle: generateHandle() }).onConflictDoNothing({ target: schema.profiles.userId });

      return;
    } catch (error) {
      // A taken handle is the one failure worth trying again with another.
      if (attempt === 4) {
        throw error;
      }
    }
  }
}
