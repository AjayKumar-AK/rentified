// TEMPORARY DIAGNOSTIC. Delete this folder (src/app/api/debug-rl) once the upload error is fixed.
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServiceSupabaseKey, getPublicSupabaseKey } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getServiceSupabaseKey();
  const out: Record<string, unknown> = {
    hasUrl: Boolean(url),
    urlHost: url ? (() => { try { return new URL(url).host; } catch { return 'INVALID_URL'; } })() : null,
    hasServiceKey: Boolean(key),
    serviceKeyKind: key ? (key.startsWith('sb_secret_') ? 'new sb_secret' : key.startsWith('eyJ') ? 'legacy JWT' : 'unrecognised format') : null,
    serviceKeyLength: key?.length ?? 0,
    hasPublicKey: Boolean(getPublicSupabaseKey()),
    hasRateLimitSalt: Boolean(process.env.RATE_LIMIT_SALT),
  };
  if (url && key) {
    try {
      const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data, error } = await sb.rpc('check_rate_limit', { p_key: 'debug', p_action: 'debug', p_max: 1000, p_window_seconds: 60 });
      out.rpcData = data ?? null;
      out.rpcError = error ? { code: error.code, message: error.message, hint: error.hint, details: error.details } : null;
    } catch (e) {
      out.thrown = e instanceof Error ? e.message : String(e);
    }
  }
  return NextResponse.json(out);
}