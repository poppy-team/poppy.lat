import { eq, sql } from 'drizzle-orm';
import type { Db } from '../db/client.ts';
import * as t from '../db/schema.ts';
import { badgeFor, type Badge, type Role } from './can.ts';
import { iso } from './http.ts';
import { effectiveRole } from './role-sql.ts';
import { isLinkService, linkHref, linkLabel, type LinkService, linkServices } from './links.ts';

export interface LinkView {
  service: LinkService;
  label: string;
  /** The value that was saved: the handle, or the address for the site. */
  value: string;
  /** Where the badge leads. Null for e-mail, which is only shown after a click. */
  href: string | null;
}

export interface ProfileView {
  handle: string;
  name: string;
  bio: string;
  badge: Badge;
  isPublic: boolean;
  showInRankings: boolean;
  memberSince: string | null;
  photoUrl: string | null;
  links: LinkView[];
}

/**
 * Builds what the page shows. `viewer` decides what is left out: the photo
 * and the e-mail are only for people who are logged in.
 */
export async function loadProfile(db: Db, userId: string, viewer: { loggedIn: boolean }): Promise<ProfileView | null> {
  const [row] = await db
    .select({
      name: t.user.name,
      role: sql<string>`${sql.raw(effectiveRole('user'))}`,
      handle: t.profiles.handle,
      bio: t.profiles.bio,
      isPublic: t.profiles.isPublic,
      showInRankings: t.profiles.showInRankings,
      createdAt: t.profiles.createdAt,
    })
    .from(t.profiles)
    .innerJoin(t.user, eq(t.user.id, t.profiles.userId))
    .where(eq(t.profiles.userId, userId));

  if (!row) {
    return null;
  }

  const [photo] = await db.select({ key: t.profilePhotos.photoKey }).from(t.profilePhotos).where(eq(t.profilePhotos.userId, userId));
  const stored = await db.select().from(t.profileLinks).where(eq(t.profileLinks.userId, userId));
  const links = stored
    .filter((link) => isLinkService(link.service) && (viewer.loggedIn || link.service !== 'email'))
    .sort((a, b) => linkServices.indexOf(a.service as LinkService) - linkServices.indexOf(b.service as LinkService))
    .map((link) => {
      const service = link.service as LinkService;

      return { service, label: linkLabel(service), value: link.value, href: linkHref(service, link.value) };
    });

  return {
    handle: row.handle,
    name: row.name,
    bio: row.bio,
    badge: badgeFor(row.role as Role),
    isPublic: row.isPublic,
    showInRankings: row.showInRankings,
    memberSince: iso(row.createdAt),
    photoUrl: viewer.loggedIn && photo ? `/api/avatar/${photo.key}` : null,
    links,
  };
}
