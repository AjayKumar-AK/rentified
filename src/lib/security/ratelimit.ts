import 'server-only';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { getAdminClient } from '@/lib/supabase/admin';

/**
 * Database-backed rate limit keyed on a salted hash of the visitor IP (raw IPs are never stored).
 * Fails CLOSED: if the limiter cannot be reached, the request is refused.
 */
export async function allowRequest(action: string, max: number, windowSeconds: number): Promise<boolean> {
  const h = await headers();
  const ip = (h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? 'unknown').trim();
  const key = createHash('sha256').update(`${process.env.RATE_LIMIT_SALT ?? ''}:${ip}`).digest('hex');
  try {
    const { data, error } = await getAdminClient().rpc('check_rate_limit', {
      p_key: key,
      p_action: action,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) return false;
    return data === true;
  } catch {
    return false;
  }
}

/** Cheap bot checks: a honeypot field that humans never see, and an implausibly fast submit. */
export function looksAutomated(raw: Record<string, unknown>, minMillis = 2500): boolean {
  if (typeof raw.website === 'string' && raw.website.trim() !== '') return true;
  const started = Number(raw.form_started_at);
  if (Number.isFinite(started) && started > 0 && Date.now() - started < minMillis) return true;
  return false;
}

export const RATE_LIMIT_MESSAGE = 'Too many attempts from this connection. Please wait a while and try again.';
export const AUTOMATED_MESSAGE = 'That was submitted very quickly. Please review the form and try again.';
