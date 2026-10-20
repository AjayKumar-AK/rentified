import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/** Daily housekeeping (Vercel Cron): expires listings/profiles past their expiry timestamp. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { data, error } = await getAdminClient().rpc('expire_stale_listings');
  if (error) return NextResponse.json({ error: 'Failed' }, { status: 500 });
  revalidatePath('/rentals');
  revalidatePath('/roommates');
  return NextResponse.json({ ok: true, result: data });
}
