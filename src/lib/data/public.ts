import 'server-only';
import { getPublicClient } from '@/lib/supabase/public';
import { getAdminClient } from '@/lib/supabase/admin';
import { isPublicSupabaseConfigured, isServiceRoleConfigured } from '@/lib/config';
import { PAGE_SIZE, PHOTO_BUCKET, PHOTO_URL_TTL_SECONDS } from '@/lib/constants';
import { safeSearchTerm } from '@/lib/format';
import type { DirectoryFilters, ListingWithPhotos, PublicListing, PublicRoommateProfile } from '@/lib/types';

export type DirectoryResult =
  | { status: 'unconfigured' }
  | { status: 'error' }
  | { status: 'ok'; listings: ListingWithPhotos[]; total: number; page: number; pageCount: number };

function istDate(offsetDays = 0): string {
  const d = new Date(Date.now() + 5.5 * 3600_000 + offsetDays * 86_400_000);
  return d.toISOString().slice(0, 10);
}

/**
 * Photos live in a private bucket. For APPROVED listings only (the list of paths comes from the
 * public_listing_photos view), mint short-lived signed URLs server-side.
 */
async function attachPhotos(listings: PublicListing[]): Promise<ListingWithPhotos[]> {
  if (listings.length === 0) return [];
  const empty = listings.map((l) => ({ ...l, photos: [] as ListingWithPhotos['photos'] }));
  if (!isServiceRoleConfigured()) return empty;

  try {
    const { data: photoData, error } = await getPublicClient()
      .from('public_listing_photos')
      .select('listing_id, storage_path, position, alt_text')
      .in('listing_id', listings.map((l) => l.id))
      .order('position', { ascending: true });
    const rows = (photoData ?? []) as { listing_id: string; storage_path: string; position: number; alt_text: string | null }[];
    if (error || rows.length === 0) return empty;

    const { data: signed } = await getAdminClient()
      .storage.from(PHOTO_BUCKET)
      .createSignedUrls(rows.map((r) => r.storage_path as string), PHOTO_URL_TTL_SECONDS);
    const urlByPath = new Map<string, string>();
    for (const s of signed ?? []) if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);

    return listings.map((l) => ({
      ...l,
      photos: rows
        .filter((r) => r.listing_id === l.id && urlByPath.has(r.storage_path as string))
        .map((r) => ({
          url: urlByPath.get(r.storage_path as string) as string,
          alt: (r.alt_text as string | null) ?? `Photo of ${l.title}`,
        })),
    }));
  } catch {
    return empty;
  }
}

export async function searchListings(filters: DirectoryFilters): Promise<DirectoryResult> {
  if (!isPublicSupabaseConfigured()) return { status: 'unconfigured' };
  const page = Math.max(1, Math.floor(filters.page ?? 1));

  try {
    let query = getPublicClient().from('public_listings').select('*', { count: 'exact' });

    const city = filters.city ? safeSearchTerm(filters.city) : '';
    if (city) query = query.ilike('city', `%${city}%`);
    const q = filters.q ? safeSearchTerm(filters.q) : '';
    if (q) query = query.or(`title.ilike.%${q}%,locality.ilike.%${q}%,city.ilike.%${q}%`);
    if (filters.minRent !== undefined) query = query.gte('rent_inr', filters.minRent);
    if (filters.maxRent !== undefined) query = query.lte('rent_inr', filters.maxRent);
    if (filters.accommodation) query = query.eq('accommodation_type', filters.accommodation);
    if (filters.contributor) query = query.eq('contributor_type', filters.contributor);
    if (filters.brokerage === 'none') query = query.eq('brokerage_status', 'none');
    if (filters.category) query = query.eq('listing_type', filters.category);
    if (filters.availability === 'now') query = query.lte('available_from', istDate(0));
    if (filters.availability === '30d') query = query.lte('available_from', istDate(30));

    const from = (page - 1) * PAGE_SIZE;
    const { data, count, error } = await query
      .order('last_confirmed_at', { ascending: false, nullsFirst: false })
      .order('approved_at', { ascending: false, nullsFirst: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) return { status: 'error' };

    const total = count ?? 0;
    return {
      status: 'ok',
      listings: await attachPhotos((data ?? []) as PublicListing[]),
      total,
      page,
      pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    };
  } catch {
    return { status: 'error' };
  }
}

export async function getListingBySlug(slug: string): Promise<ListingWithPhotos | null | 'error'> {
  if (!isPublicSupabaseConfigured()) return 'error';
  if (!/^[a-z0-9-]{3,100}$/.test(slug)) return null;
  try {
    const { data, error } = await getPublicClient().from('public_listings').select('*').eq('slug', slug).maybeSingle();
    if (error) return 'error';
    if (!data) return null;
    const [withPhotos] = await attachPhotos([data as PublicListing]);
    return withPhotos ?? null;
  } catch {
    return 'error';
  }
}

export async function listRoommateProfiles(): Promise<PublicRoommateProfile[] | 'unconfigured' | 'error'> {
  if (!isPublicSupabaseConfigured()) return 'unconfigured';
  try {
    const { data, error } = await getPublicClient()
      .from('public_roommate_profiles')
      .select('*')
      .order('approved_at', { ascending: false, nullsFirst: false })
      .limit(48);
    if (error) return 'error';
    return (data ?? []) as PublicRoommateProfile[];
  } catch {
    return 'error';
  }
}
