import { getPublicSupabaseKey } from '@/lib/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Anonymous client. Subject to RLS: it can only read the three public_* views. */
export function getPublicClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getPublicSupabaseKey();
  if (!url || !key) throw new Error('SUPABASE_NOT_CONFIGURED');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}