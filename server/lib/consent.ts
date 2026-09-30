/**
 * Accounts are for adults only (decided 2026-09-30, see the legal review):
 * the lessons stay open to everyone without an account, and an account asks
 * for the date of birth once. Only the fact that the person confirmed being 18
 * or older is kept, never the date itself.
 */

/** Bump when the Terms or the Privacy Policy change in a way people must accept again. */
export const termsVersion = '2026-09-30';

export const minimumAge = 18;

/** Whole years between a YYYY-MM-DD birth date and `today`, or null when the date is not a real one. */
export function ageOn(birthDate: string, today: Date = new Date()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(birthDate);

  if (!match) {
    return null;
  }

  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }

  const [nowYear, nowMonth, nowDay] = [today.getUTCFullYear(), today.getUTCMonth() + 1, today.getUTCDate()];
  const age = nowYear - year - (nowMonth < month || (nowMonth === month && nowDay < day) ? 1 : 0);

  return age >= 0 && age <= 130 ? age : null;
}

/** True once the person confirmed their age and accepted the current Terms. */
export function hasConsented(row: { adultConfirmedAt: unknown; termsVersion: unknown } | undefined): boolean {
  return Boolean(row?.adultConfirmedAt) && row?.termsVersion === termsVersion;
}
