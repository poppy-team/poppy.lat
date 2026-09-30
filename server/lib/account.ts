import type { Client } from '@libsql/client';

/**
 * Deletes the account and what hangs from it. Comments that others have
 * answered stay, without author and with the text replaced, so the
 * conversation around them still makes sense; the rest are deleted.
 */
export async function deleteAccount(client: Client, userId: string): Promise<void> {
  await client.batch(
    [
      {
        sql: `UPDATE comments SET author_id = NULL, body_md = '[removido]', status = 'deleted_by_author', is_pinned = 0, is_official = 0
              WHERE author_id = ? AND EXISTS (SELECT 1 FROM comments child WHERE child.parent_id = comments.id AND (child.author_id IS NULL OR child.author_id <> ?))`,
        args: [userId, userId],
      },
      { sql: 'DELETE FROM comments WHERE author_id = ?', args: [userId] },
      { sql: 'DELETE FROM comment_reactions WHERE user_id = ?', args: [userId] },
      { sql: 'DELETE FROM reports WHERE reporter_id = ?', args: [userId] },
      { sql: 'DELETE FROM notes WHERE user_id = ?', args: [userId] },
      { sql: 'DELETE FROM lesson_progress WHERE user_id = ?', args: [userId] },
      { sql: 'DELETE FROM profile_links WHERE user_id = ?', args: [userId] },
      { sql: 'DELETE FROM profile_photos WHERE user_id = ?', args: [userId] },
      { sql: 'DELETE FROM user_mutes WHERE user_id = ?', args: [userId] },
      { sql: 'DELETE FROM notification_state WHERE user_id = ?', args: [userId] },
      { sql: 'DELETE FROM user_grants WHERE user_id = ?', args: [userId] },
      { sql: 'DELETE FROM profiles WHERE user_id = ?', args: [userId] },
      { sql: 'DELETE FROM session WHERE user_id = ?', args: [userId] },
      { sql: 'DELETE FROM account WHERE user_id = ?', args: [userId] },
      { sql: 'DELETE FROM user WHERE id = ?', args: [userId] },
    ],
    'write',
  );
}
