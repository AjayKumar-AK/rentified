import 'server-only';
import { getAdminClient } from '@/lib/supabase/admin';
import { PHOTO_BUCKET } from '@/lib/constants';
import { safeSearchTerm } from '@/lib/format';
import { getFreshnessPolicy } from '@/lib/config';
import type { AdminListing, ListingStatus } from '@/lib/types';

export interface AdminListingRow {
  id: string;
  slug: string;
  title: string;
  city: string;
  locality: string;
  listing_type: string;
  contributor_type: string;
  status: ListingStatus;
  rent_inr: number;
  submitted_at: string;
  last_confirmed_at: string | null;
  expires_at: string | null;
  is_demo: boolean;
}

export async function adminListListings(status: ListingStatus | 'all', q: string): Promise<AdminListingRow[]> {
  let query = getAdminClient()
    .from('listings')
    .select('id, slug, title, city, locality, listing_type, contributor_type, status, rent_inr, submitted_at, last_confirmed_at, expires_at, is_demo')
    .order('submitted_at', { ascending: status === 'pending_review' })
    .limit(100);
  if (status !== 'all') query = query.eq('status', status);
  const term = safeSearchTerm(q);
  if (term) query = query.or(`title.ilike.%${term}%,city.ilike.%${term}%,locality.ilike.%${term}%`);
  const { data, error } = await query;
  if (error) throw new Error('Could not load listings');
  return (data ?? []) as AdminListingRow[];
}

export async function adminDashboardCounts() {
  const db = getAdminClient();
  const statuses: ListingStatus[] = [
    'pending_review',
    'changes_requested',
    'approved',
    'rejected',
    'unavailable',
    'expired',
    'removed',
  ];
  const countAll = async (table: string) => {
    const { count: c } = await db.from(table).select('id', { count: 'exact', head: true });
    return c ?? 0;
  };

  const byStatus: Record<string, number> = {};
  await Promise.all(
    statuses.map(async (s) => {
      const { count: c } = await db.from('listings').select('id', { count: 'exact', head: true }).eq('status', s);
      byStatus[s] = c ?? 0;
    }),
  );

  const recentCutoff = new Date(Date.now() - getFreshnessPolicy().staleAfterDays * 86_400_000).toISOString();
  const [{ count: freshApproved }, { count: openReports }, { count: pendingRoommates }, { count: openRequests }, { count: newRequirements }, totalSubmissions, totalRequirements] =
    await Promise.all([
      db.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'approved').eq('is_demo', false).gte('last_confirmed_at', recentCutoff),
      db.from('listing_reports').select('id', { count: 'exact', head: true }).in('status', ['open', 'reviewing']),
      db.from('roommate_profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
      db.from('data_requests').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      db.from('renter_requirements').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      countAll('listings'),
      countAll('renter_requirements'),
    ]);

  return {
    byStatus,
    freshApproved: freshApproved ?? 0,
    openReports: openReports ?? 0,
    pendingRoommates: pendingRoommates ?? 0,
    openRequests: openRequests ?? 0,
    newRequirements: newRequirements ?? 0,
    totalSubmissions,
    totalRequirements,
  };
}

export interface AdminListingDetail {
  listing: AdminListing;
  photos: { id: string; url: string | null; path: string }[];
  history: { id: string; action: string; from_status: string | null; to_status: string | null; reason: string | null; moderator_id: string | null; created_at: string }[];
  confirmations: { id: string; confirmed_at: string; source: string; note: string | null }[];
  checks: { id: string; check_type: string; status: string; method: string; notes: string | null; checked_at: string }[];
  reports: { id: string; category: string; description: string | null; status: string; created_at: string }[];
  duplicateContactCount: number;
  moderatorNote: string | null;
}

export async function adminGetListing(id: string): Promise<AdminListingDetail | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const db = getAdminClient();
  const { data: listing } = await db.from('listings').select('*').eq('id', id).maybeSingle();
  if (!listing) return null;

  const [photosRes, historyRes, confRes, checksRes, reportsRes, dupRes] = await Promise.all([
    db.from('listing_photos').select('id, storage_path, position').eq('listing_id', id).order('position'),
    db.from('moderation_actions').select('id, action, from_status, to_status, reason, moderator_id, created_at').eq('listing_id', id).order('created_at', { ascending: false }),
    db.from('availability_confirmations').select('id, confirmed_at, source, note').eq('listing_id', id).order('confirmed_at', { ascending: false }),
    db.from('verification_checks').select('id, check_type, status, method, notes, checked_at').eq('listing_id', id).order('checked_at', { ascending: false }),
    db.from('listing_reports').select('id, category, description, status, created_at').eq('listing_id', id).order('created_at', { ascending: false }),
    db.from('listings').select('id', { count: 'exact', head: true }).eq('contact_value', listing.contact_value as string).neq('id', id).neq('status', 'removed'),
  ]);

  const photoRows = (photosRes.data ?? []) as { id: string; storage_path: string }[];
  const { data: signed } = photoRows.length
    ? await db.storage.from(PHOTO_BUCKET).createSignedUrls(photoRows.map((p) => p.storage_path as string), 3600)
    : { data: [] as { path: string | null; signedUrl: string }[] };
  const urlByPath = new Map<string, string>();
  for (const s of signed ?? []) if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);

  const history = (historyRes.data ?? []) as AdminListingDetail['history'];
  const lastChangeRequest = history.find((h) => h.action === 'request_changes');

  return {
    listing: listing as AdminListing,
    photos: photoRows.map((p) => ({ id: p.id as string, path: p.storage_path as string, url: urlByPath.get(p.storage_path as string) ?? null })),
    history,
    confirmations: (confRes.data ?? []) as AdminListingDetail['confirmations'],
    checks: (checksRes.data ?? []) as AdminListingDetail['checks'],
    reports: (reportsRes.data ?? []) as AdminListingDetail['reports'],
    duplicateContactCount: dupRes.count ?? 0,
    moderatorNote: lastChangeRequest?.reason ?? null,
  };
}
