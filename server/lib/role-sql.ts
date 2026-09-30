/**
 * The role a person really has, as SQL. `user.role` holds student, contributor
 * or admin; "creator" is a grant in `user_grants` (see migration 007). Every
 * query that shows or checks a role uses this, so the answer is the same
 * everywhere: admin first, then creator, then the base role.
 */
export function effectiveRole(alias = 'u'): string {
  return `(CASE WHEN ${alias}.role = 'admin' THEN 'admin'
                 WHEN EXISTS (SELECT 1 FROM user_grants g WHERE g.user_id = ${alias}.id AND g.capability = 'creator') THEN 'creator'
                 ELSE ${alias}.role END)`;
}
