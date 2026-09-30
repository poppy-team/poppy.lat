import { sql } from 'drizzle-orm';
import { blob, index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Typed view of the tables in `migrations/*.sql`, which are the source of
 * truth (they also hold the CHECK constraints and triggers). A test compares
 * these columns with the real database so the two cannot drift apart.
 *
 * Property names for the login tables are the ones Better Auth expects.
 */
const now = sql`(datetime('now'))`;

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  role: text('role').notNull().default('student'),
  banned: integer('banned', { mode: 'boolean' }).default(false),
  banReason: text('ban_reason'),
  banExpires: integer('ban_expires', { mode: 'timestamp_ms' }),
});

export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    impersonatedBy: text('impersonated_by'),
  },
  (table) => [index('session_user_id').on(table.userId)],
);

export const account = sqliteTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp_ms' }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp_ms' }),
    scope: text('scope'),
    password: text('password'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('account_user_id').on(table.userId)],
);

export const verification = sqliteTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('verification_identifier').on(table.identifier)],
);

export const profiles = sqliteTable('profiles', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  handle: text('handle').notNull().unique(),
  bio: text('bio').notNull().default(''),
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(false),
  showInRankings: integer('show_in_rankings', { mode: 'boolean' }).notNull().default(false),
  notificationsSeenAt: text('notifications_seen_at'),
  notificationsClearedAt: text('notifications_cleared_at'),
  adultConfirmedAt: text('adult_confirmed_at'),
  termsVersion: text('terms_version'),
  termsAcceptedAt: text('terms_accepted_at'),
  createdAt: text('created_at').notNull().default(now),
});

export const profilePhotos = sqliteTable('profile_photos', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  photoKey: text('photo_key').notNull().unique(),
  mime: text('mime').notNull().default('image/webp'),
  bytes: blob('bytes', { mode: 'buffer' }).notNull(),
  updatedAt: text('updated_at').notNull().default(now),
});

export const profileLinks = sqliteTable(
  'profile_links',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    service: text('service').notNull(),
    value: text('value').notNull(),
    updatedAt: text('updated_at').notNull().default(now),
  },
  (table) => [primaryKey({ columns: [table.userId, table.service] })],
);

export const notes = sqliteTable(
  'notes',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    lessonId: text('lesson_id'),
    exerciseId: text('exercise_id'),
    title: text('title').notNull().default(''),
    bodyMd: text('body_md').notNull(),
    version: integer('version').notNull().default(1),
    createdAt: text('created_at').notNull().default(now),
    updatedAt: text('updated_at').notNull().default(now),
  },
  (table) => [index('notes_by_user').on(table.userId, table.updatedAt), index('notes_by_lesson').on(table.userId, table.lessonId)],
);

export const comments = sqliteTable(
  'comments',
  {
    id: text('id').primaryKey(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    parentId: text('parent_id'),
    authorId: text('author_id').references(() => user.id, { onDelete: 'set null' }),
    bodyMd: text('body_md').notNull(),
    status: text('status').notNull().default('visible'),
    hiddenReason: text('hidden_reason'),
    isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
    isOfficial: integer('is_official', { mode: 'boolean' }).notNull().default(false),
    editedAt: text('edited_at'),
    createdAt: text('created_at').notNull().default(now),
  },
  (table) => [
    index('comments_by_target').on(table.targetType, table.targetId, table.createdAt),
    index('comments_by_parent').on(table.parentId),
    index('comments_by_author').on(table.authorId, table.createdAt),
  ],
);

export const commentReactions = sqliteTable(
  'comment_reactions',
  {
    commentId: text('comment_id')
      .notNull()
      .references(() => comments.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    emoji: text('emoji').notNull(),
    createdAt: text('created_at').notNull().default(now),
  },
  (table) => [primaryKey({ columns: [table.commentId, table.userId, table.emoji] })],
);

export const reports = sqliteTable(
  'reports',
  {
    id: text('id').primaryKey(),
    commentId: text('comment_id')
      .notNull()
      .references(() => comments.id, { onDelete: 'cascade' }),
    reporterId: text('reporter_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    reason: text('reason').notNull(),
    details: text('details').notNull().default(''),
    status: text('status').notNull().default('open'),
    createdAt: text('created_at').notNull().default(now),
  },
  (table) => [index('reports_open').on(table.status, table.createdAt)],
);

export const moderationLog = sqliteTable('moderation_log', {
  id: integer('id').primaryKey({ autoIncrement: false }),
  actorId: text('actor_id').notNull(),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  reason: text('reason').notNull().default(''),
  createdAt: text('created_at').notNull().default(now),
});

export const lessonProgress = sqliteTable(
  'lesson_progress',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    lessonId: text('lesson_id').notNull(),
    status: text('status').notNull(),
    codeTab: text('code_tab'),
    updatedAt: text('updated_at').notNull().default(now),
  },
  (table) => [primaryKey({ columns: [table.userId, table.lessonId] })],
);

/** Extra permissions besides the base role. Today only "creator" (see migration 007). */
export const userGrants = sqliteTable(
  'user_grants',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    capability: text('capability').notNull(),
    grantedBy: text('granted_by'),
    createdAt: text('created_at').notNull().default(now),
  },
  (table) => [primaryKey({ columns: [table.userId, table.capability] })],
);

export const notificationState = sqliteTable(
  'notification_state',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    commentId: text('comment_id')
      .notNull()
      .references(() => comments.id, { onDelete: 'cascade' }),
    isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
    isDeleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(false),
    updatedAt: text('updated_at').notNull().default(now),
  },
  (table) => [primaryKey({ columns: [table.userId, table.commentId] })],
);

export const rateLimits = sqliteTable('rate_limits', {
  key: text('key').primaryKey(),
  windowStart: integer('window_start').notNull(),
  count: integer('count').notNull(),
});

export const userMutes = sqliteTable('user_mutes', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  mutedUntil: integer('muted_until').notNull(),
  reason: text('reason').notNull().default(''),
  createdBy: text('created_by').notNull(),
  createdAt: text('created_at').notNull().default(now),
});
