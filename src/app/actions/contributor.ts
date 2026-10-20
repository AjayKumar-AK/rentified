'use server';

import { revalidatePath } from 'next/cache';
import { getAdminClient } from '@/lib/supabase/admin';
import { getFreshnessPolicy } from '@/lib/config';
import { computeExpiry } from '@/lib/freshness';
import type { FormState } from '@/lib/forms';
import { getListingByToken } from '@/lib/data/contributor';
import { RATE_LIMIT_MESSAGE, allowRequest } from '@/lib/security/ratelimit';
import { createListingCorrectionSchema, formDataToRaw, zodErrors } from '@/lib/validation/schemas';

/**
 * Contributor reconfirms availability via their private link. This records "last confirmed available"
 * and extends expiry; it does NOT let them edit the listing, and it never re-publishes anything that
 * a moderator has taken down (only approved/expired listings are affected).
 */
export async function reconfirmAvailability(token: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  try {
    if (!(await allowRequest('reconfirm', 20, 3600))) return { status: 'error', message: RATE_LIMIT_MESSAGE };
    const listing = await getListingByToken(token);
    if (!listing) return { status: 'error', message: 'This link is not valid.' };
    if (listing.status !== 'approved' && listing.status !== 'expired') {
      return { status: 'error', message: 'This listing is not currently live, so there is nothing to reconfirm.' };
    }
    const expiresAt = computeExpiry(new Date(), getFreshnessPolicy().expireAfterDays).toISOString();
    const db = getAdminClient();
    const { error } = await db.rpc('record_availability', {
      p_listing_id: listing.id,
      p_source: 'contributor_link',
      p_actor: null,
      p_expires_at: expiresAt,
      p_note: null,
    });
    if (error) return { status: 'error', message: 'Could not record your confirmation. Please try again.' };

    if (listing.status === 'expired') {
      // Previously approved, then expired only for lack of confirmation: restore it now that the contributor has confirmed.
      await db.rpc('moderate_listing', {
        p_listing_id: listing.id,
        p_moderator: null,
        p_action: 'reconfirm',
        p_to: 'approved',
        p_reason: 'Contributor reconfirmed availability after expiry',
        p_expires_at: expiresAt,
      });
    } else {
      await db.from('moderation_actions').insert({ listing_id: listing.id, action: 'reconfirm', from_status: 'approved', to_status: 'approved' });
    }
    revalidatePath('/rentals');
    revalidatePath(`/rentals/${listing.slug}`);
    return { status: 'success', message: 'Thanks — availability confirmed.' };
  } catch {
    return { status: 'error', message: 'Could not record your confirmation. Please try again.' };
  }
}

/** Contributor says the place is no longer available: takes it down immediately. */
export async function markNoLongerAvailable(token: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  try {
    if (!(await allowRequest('reconfirm', 20, 3600))) return { status: 'error', message: RATE_LIMIT_MESSAGE };
    const listing = await getListingByToken(token);
    if (!listing) return { status: 'error', message: 'This link is not valid.' };
    if (listing.status !== 'approved') return { status: 'error', message: 'This listing is not currently public.' };
    const { error } = await getAdminClient().rpc('moderate_listing', {
      p_listing_id: listing.id,
      p_moderator: null,
      p_action: 'mark_unavailable',
      p_to: 'unavailable',
      p_reason: 'Marked unavailable by the contributor',
      p_expires_at: null,
    });
    if (error) return { status: 'error', message: 'Could not update the listing. Please try again.' };
    revalidatePath('/rentals');
    revalidatePath(`/rentals/${listing.slug}`);
    return { status: 'success', message: 'Done — the listing has been taken down. Thank you for letting us know.' };
  } catch {
    return { status: 'error', message: 'Could not update the listing. Please try again.' };
  }
}

/** Contributor corrects a few fields — only while a moderator has asked for changes — then resubmits for review. */
export async function submitCorrection(token: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    if (!(await allowRequest('correction', 10, 3600))) return { status: 'error', message: RATE_LIMIT_MESSAGE };
    const listing = await getListingByToken(token);
    if (!listing) return { status: 'error', message: 'This link is not valid.' };
    if (listing.status !== 'changes_requested') return { status: 'error', message: 'No changes are being requested for this listing right now.' };

    const parsed = createListingCorrectionSchema().safeParse(formDataToRaw(formData));
    if (!parsed.success) return { status: 'error', message: 'Please fix the highlighted fields.', errors: zodErrors(parsed.error) };
    const i = parsed.data;

    const db = getAdminClient();
    const { error } = await db
      .from('listings')
      .update({ title: i.title, description: i.description, rent_inr: i.rent_inr, deposit_inr: i.deposit_inr ?? null, available_from: i.available_from })
      .eq('id', listing.id)
      .eq('status', 'changes_requested');
    if (error) return { status: 'error', message: 'Could not save your changes. Please try again.' };

    const { error: moveError } = await db.rpc('moderate_listing', {
      p_listing_id: listing.id,
      p_moderator: null,
      p_action: 'resubmit',
      p_to: 'pending_review',
      p_reason: 'Contributor submitted corrections',
      p_expires_at: null,
    });
    if (moveError) return { status: 'error', message: 'Could not resubmit your listing. Please try again.' };
    return { status: 'success', message: 'Thanks — your changes were sent back for review.' };
  } catch {
    return { status: 'error', message: 'Could not save your changes. Please try again.' };
  }
}
