import 'server-only';
import { redirect } from 'next/navigation';
import { createAuthClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { isPublicSupabaseConfigured, isServiceRoleConfigured } from '@/lib/config';

export type AdminContext =
  | { status: 'unconfigured' }
  | { status: 'signed_out' }
  | { status: 'forbidden'; email: string | null }
  | { status: 'ok'; userId: string; email: string | null };

/**
 * Resolves who is calling. Authentication = valid Supabase session (verified with the Auth server,
 * not just a cookie). Authorization = a row in public.admin_users (only creatable via SQL by the project owner).
 */
export async function getAdminContext(): Promise<AdminContext> {
  if (!isPublicSupabaseConfigured() || !isServiceRoleConfigured()) return { status: 'unconfigured' };

  const supabase = await createAuthClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { status: 'signed_out' };

  const { data: row, error: lookupError } = await getAdminClient()
    .from('admin_users')
    .select('user_id')
    .eq('user_id', data.user.id)
    .maybeSingle();
  if (lookupError || !row) return { status: 'forbidden', email: data.user.email ?? null };

  return { status: 'ok', userId: data.user.id, email: data.user.email ?? null };
}

/** For admin pages: redirects anyone who is not an authorized administrator. */
export async function requireAdminPage(): Promise<{ userId: string; email: string | null }> {
  const ctx = await getAdminContext();
  if (ctx.status !== 'ok') redirect('/admin/login');
  return ctx;
}

/** For server actions: throws unless the caller is an authorized administrator. */
export async function requireAdminAction(): Promise<{ userId: string; email: string | null }> {
  const ctx = await getAdminContext();
  if (ctx.status !== 'ok') throw new Error('Unauthorized');
  return ctx;
}
