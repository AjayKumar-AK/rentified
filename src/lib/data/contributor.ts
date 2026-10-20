import 'server-only';
import { getAdminClient } from '@/lib/supabase/admin';
import { hashToken, isPlausibleToken } from '@/lib/security/token';
import type { ListingStatus } from '@/lib/types';

export interface ContributorListing {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: ListingStatus;
  rent_inr: number;
  deposit_inr: number | null;
  available_from: string;
  city: string;
  locality: string;
  last_confirmed_at: string | null;
  expires_at: string | null;
  changeRequest: string | null;
}

/** Resolves a contributor's private link token to their own listing. Returns only non-sensitive fields. */
export async function getListingByToken(token: string): Promise<ContributorListing | null> {
  if (!isPlausibleToken(token)) return null;
  const db = getAdminClient();
  const { data } = await db
    .from('listings')
    .select('id, slug, title, description, status, rent_inr, deposit_inr, available_from, city, locality, last_confirmed_at, expires_at')
    .eq('reconfirm_token_hash', hashToken(token))
    .maybeSingle();
  if (!data) return null;

  let changeRequest: string | null = null;
  if (data.status === 'changes_requested') {
    const { data: last } = await db
      .from('moderation_actions')
      .select('reason')
      .eq('listing_id', data.id)
      .eq('action', 'request_changes')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    changeRequest = last?.reason ?? null;
  }
  return { ...(data as Omit<ContributorListing, 'changeRequest'>), changeRequest };
}
