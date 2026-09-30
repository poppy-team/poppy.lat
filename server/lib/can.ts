/**
 * Who may do what. One function decides everything and the answer is "no"
 * unless a rule below says "yes". Every route calls it; the table in
 * tests/server/can.test.ts is the written form of the permission matrix.
 */
export type Role = 'student' | 'contributor' | 'admin';

export interface Actor {
  id: string;
  role: Role;
}

export type Action =
  | 'comment:read'
  | 'comment:create'
  | 'comment:react'
  | 'comment:edit-own'
  | 'comment:delete-own'
  | 'comment:report'
  | 'comment:hide'
  | 'comment:restore'
  | 'comment:pin'
  | 'comment:official'
  | 'comment:purge'
  | 'report:resolve'
  | 'user:mute'
  | 'user:ban'
  | 'user:role'
  | 'photo:remove-other'
  | 'log:read'
  | 'notes:own'
  | 'profile:own';

const anyone: ReadonlySet<Action> = new Set(['comment:read']);

const member: ReadonlySet<Action> = new Set([
  'comment:create',
  'comment:react',
  'comment:report',
  'comment:edit-own',
  'comment:delete-own',
  'notes:own',
  'profile:own',
]);

const moderator: ReadonlySet<Action> = new Set([
  'comment:hide',
  'comment:restore',
  'comment:pin',
  'comment:official',
  'report:resolve',
  'user:mute',
  'photo:remove-other',
]);

const administrator: ReadonlySet<Action> = new Set(['user:ban', 'user:role', 'comment:purge', 'log:read']);

/** Actions that only ever apply to the actor's own data, whatever the role. */
const ownOnly: ReadonlySet<Action> = new Set(['comment:edit-own', 'comment:delete-own', 'notes:own', 'profile:own']);

export function can(actor: Actor | null, action: Action, resource?: { ownerId?: string | null }): boolean {
  if (anyone.has(action)) {
    return true;
  }

  if (!actor) {
    return false;
  }

  if (ownOnly.has(action) && (!resource?.ownerId || resource.ownerId !== actor.id)) {
    return false;
  }

  if (member.has(action)) {
    return true;
  }

  if (moderator.has(action)) {
    return actor.role === 'contributor' || actor.role === 'admin';
  }

  if (administrator.has(action)) {
    return actor.role === 'admin';
  }

  return false;
}

const rank: Record<Role, number> = { student: 0, contributor: 1, admin: 2 };

/** A moderator may only act on people they outrank; admins are only changed by role. */
export function outranks(actor: Role, target: Role): boolean {
  return rank[actor] > rank[target];
}

/** The badge shown next to a name. The role decides it; nobody can pick it. */
export function badgeFor(role: Role): 'student' | 'contributor' {
  return role === 'student' ? 'student' : 'contributor';
}
