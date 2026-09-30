export type SiteSection = 'projects' | 'docs' | 'learn' | 'blog' | 'account' | '';

/**
 * The section of the site a path belongs to, so its link reads as current in
 * the header and in the tab bar of narrow screens.
 */
export function siteSection(routePath: string): SiteSection {
  const path = routePath.replace(/^\/en(?=\/)/u, '');

  if (path.startsWith('/projects/')) {
    return 'projects';
  }

  if (path.startsWith('/aprender') || path.startsWith('/learn')) {
    return 'learn';
  }

  if (path.startsWith('/blog')) {
    return 'blog';
  }

  if (path.startsWith('/conta')) {
    return 'account';
  }

  return /^\/[a-z]+\/docs\//u.test(path) ? 'docs' : '';
}
