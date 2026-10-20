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

/** Public (browser-safe) Supabase key: legacy "anon" or new "publishable" name. Literal refs so Next inlines them. */
export function getPublicSupabaseKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    undefined
  );
}

/** Server-only privileged key: legacy "service_role" or new "secret" name. */
export function getServiceSupabaseKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim() || undefined;
}

export function isPublicSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && getPublicSupabaseKey());
}

export function isServiceRoleConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && getServiceSupabaseKey());
}

/** Site origin. Tolerates a missing/empty value or one without a scheme; never throws. */
export function getSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim().replace(/\/+$/, '');
  if (!raw) return 'http://localhost:3000';
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    return 'http://localhost:3000';
  }
}