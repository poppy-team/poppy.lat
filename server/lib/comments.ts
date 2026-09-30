import type { Client, Row } from '@libsql/client';
import { badgeFor, type Role } from './can.ts';
import { iso } from './http.ts';

export const reactionEmojis = ['👍', '❤️', '🎉', '💡', '🤔', '😅'] as const;
export type ReactionEmoji = (typeof reactionEmojis)[number];

export interface Viewer {
  id: string | null;
  isModerator: boolean;
}

export interface CommentView {
  id: string;
  targetType: string;
  targetId: string;
  parentId: string | null;
  /** Null when the account was removed. */
  author: { handle: string; name: string; badge: 'student' | 'contributor'; profilePublic: boolean; photoUrl: string | null } | null;
  bodyMd: string | null;
  status: string;
  hiddenReason: string | null;
  isPinned: boolean;
  isOfficial: boolean;
  createdAt: string | null;
  editedAt: string | null;
  mine: boolean;
  reactions: { emoji: string; count: number; mine: boolean }[];
}

/** The columns every comment query returns, with the author's public card. */
export const commentSelect = `
  SELECT c.id, c.target_type, c.target_id, c.parent_id, c.author_id, c.body_md, c.status, c.hidden_reason,
         c.is_pinned, c.is_official, c.created_at, c.edited_at,
         u.name AS author_name, u.role AS author_role, p.handle AS author_handle, p.is_public AS author_public,
         ph.photo_key AS author_photo
  FROM comments c
  LEFT JOIN user u ON u.id = c.author_id
  LEFT JOIN profiles p ON p.user_id = c.author_id
  LEFT JOIN profile_photos ph ON ph.user_id = c.author_id`;

export function placeholders(count: number): string {
  return Array.from({ length: count }, () => '?').join(', ');
}

/** Turns rows into what the page shows. A hidden or deleted comment loses its text unless a moderator is looking. */
export async function toViews(client: Client, rows: Row[], viewer: Viewer): Promise<CommentView[]> {
  if (rows.length === 0) {
    return [];
  }

  const ids = rows.map((row) => String(row.id));
  const reactionRows = (
    await client.execute({
      sql: `SELECT comment_id, emoji, count(*) AS n, coalesce(sum(user_id = ?), 0) AS mine
            FROM comment_reactions WHERE comment_id IN (${placeholders(ids.length)}) GROUP BY comment_id, emoji`,
      args: [viewer.id ?? '', ...ids],
    })
  ).rows;
  const byComment = new Map<string, CommentView['reactions']>();

  for (const row of reactionRows) {
    const list = byComment.get(String(row.comment_id)) ?? [];

    list.push({ emoji: String(row.emoji), count: Number(row.n), mine: Number(row.mine) > 0 });
    byComment.set(String(row.comment_id), list);
  }

  return rows.map((row) => {
    const status = String(row.status);
    const showBody = status === 'visible' || viewer.isModerator;
    const authorId = row.author_id === null ? null : String(row.author_id);
    const order = (emoji: string) => reactionEmojis.indexOf(emoji as ReactionEmoji);

    return {
      id: String(row.id),
      targetType: String(row.target_type),
      targetId: String(row.target_id),
      parentId: row.parent_id === null ? null : String(row.parent_id),
      author:
        authorId === null || row.author_handle === null
          ? null
          : {
              handle: String(row.author_handle),
              name: String(row.author_name),
              badge: badgeFor(String(row.author_role) as Role),
              profilePublic: Number(row.author_public) === 1,
              photoUrl: viewer.id && row.author_photo ? `/api/avatar/${String(row.author_photo)}` : null,
            },
      bodyMd: showBody ? String(row.body_md) : null,
      status,
      hiddenReason: viewer.isModerator && row.hidden_reason !== null ? String(row.hidden_reason) : null,
      isPinned: Number(row.is_pinned) === 1,
      isOfficial: Number(row.is_official) === 1,
      createdAt: iso(String(row.created_at)),
      editedAt: iso(row.edited_at === null ? null : String(row.edited_at)),
      mine: authorId !== null && authorId === viewer.id,
      reactions: (byComment.get(String(row.id)) ?? []).sort((a, b) => order(a.emoji) - order(b.emoji)),
    };
  });
}
