export interface FreshnessPolicy {
  /** After this many days without confirmation, label the availability as needing reconfirmation. */
  staleAfterDays: number;
  /** After this many days without confirmation, the listing should be expired/unpublished. */
  expireAfterDays: number;
}

export type FreshnessLevel = 'confirmed_recently' | 'needs_reconfirmation' | 'overdue' | 'unconfirmed';

export interface Freshness {
  level: FreshnessLevel;
  /** Whole days since the last availability confirmation, or null if never confirmed. */
  daysSince: number | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * "Last confirmed available" — deliberately separate from "last edited" (updated_at).
 */
export function getFreshness(
  lastConfirmedAt: string | Date | null | undefined,
  policy: FreshnessPolicy,
  now: Date = new Date(),
): Freshness {
  if (!lastConfirmedAt) return { level: 'unconfirmed', daysSince: null };
  const last = lastConfirmedAt instanceof Date ? lastConfirmedAt : new Date(lastConfirmedAt);
  if (Number.isNaN(last.getTime())) return { level: 'unconfirmed', daysSince: null };

  const daysSince = Math.max(0, Math.floor((now.getTime() - last.getTime()) / DAY_MS));
  if (daysSince >= policy.expireAfterDays) return { level: 'overdue', daysSince };
  if (daysSince >= policy.staleAfterDays) return { level: 'needs_reconfirmation', daysSince };
  return { level: 'confirmed_recently', daysSince };
}

/** Timestamp at which a listing confirmed at `from` should expire under the policy. */
export function computeExpiry(from: Date, expireAfterDays: number): Date {
  return new Date(from.getTime() + expireAfterDays * DAY_MS);
}
