import type { Client } from '@libsql/client';
import { HttpError } from './http.ts';

/**
 * Fixed-window limiter kept in the database, so it holds across the many
 * short-lived serverless instances. One row per key; the window restarts
 * when it has run out.
 */
export async function rateLimit(
  client: Client,
  bucket: string,
  subject: string,
  max: number,
  windowSeconds: number,
  now: number = Date.now(),
): Promise<void> {
  const key = `${bucket}:${subject}`;
  const windowMs = windowSeconds * 1000;
  const result = await client.execute({
    sql: `INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1)
          ON CONFLICT (key) DO UPDATE SET
            count = CASE WHEN window_start <= ? THEN 1 ELSE count + 1 END,
            window_start = CASE WHEN window_start <= ? THEN ? ELSE window_start END
          RETURNING count, window_start`,
    args: [key, now, now - windowMs, now - windowMs, now],
  });
  const row = result.rows[0];
  const count = Number(row?.count ?? 1);
  const start = Number(row?.window_start ?? now);

  // Old windows are swept now and then so the table stays small.
  if (Math.random() < 0.02) {
    await client.execute({ sql: 'DELETE FROM rate_limits WHERE window_start < ?', args: [now - 24 * 3600 * 1000] });
  }

  if (count > max) {
    const retryAfter = Math.max(1, Math.ceil((start + windowMs - now) / 1000));

    throw new HttpError(429, 'rate_limited', 'Muitas tentativas em pouco tempo. Espere um pouco e tente de novo.', { retryAfter });
  }
}
