import type { FreshnessPolicy } from '@/lib/freshness';

function positiveNumber(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Freshness policy. Defaults are starting points, not universal facts about rental markets. */
export function getFreshnessPolicy(): FreshnessPolicy & { roommateExpireAfterDays: number } {
  const staleAfterDays = positiveNumber(process.env.FRESHNESS_STALE_AFTER_DAYS, 7);
  const expireAfterDays = Math.max(
    positiveNumber(process.env.FRESHNESS_EXPIRE_AFTER_DAYS, 14),
    staleAfterDays,
  );
  return {
    staleAfterDays,
    expireAfterDays,
    roommateExpireAfterDays: positiveNumber(process.env.ROOMMATE_PROFILE_EXPIRE_AFTER_DAYS, 30),
  };
}

export function isPublicSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function isServiceRoleConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
