'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAction } from '@/lib/auth/admin';
import { getAdminClient } from '@/lib/supabase/admin';
import { getFreshnessPolicy } from '@/lib/config';
import { MODERATION_ACTIONS } from '@/lib/constants';
import { computeExpiry } from '@/lib/freshness';
import type { FormState } from '@/lib/forms';
import { ACTION_TARGET, REASON_REQUIRED, canTransition } from '@/lib/moderation/transitions';
import type { ListingStatus, ModerationActionName } from '@/lib/types';
import { verificationCheckSchema, zodErrors } from '@/lib/validation/schemas';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function revalidatePublic(slug?: string) {
  revalidatePath('/rentals');
  revalidatePath('/roommates');
  if (slug) revalidatePath(`/rentals/${slug}`);
}

/** Every moderator action re-checks authorization on the server. Hiding a button is not security. */
export async function moderateListing(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await requireAdminAction();
    const listingId = String(formData.get('listing_id') ?? '');
    const action = String(formData.get('action') ?? '') as ModerationActionName;
    const reason = String(formData.get('reason') ?? '').trim();
    const confirmedAvailable = formData.get('confirmed_available') === 'on';

    if (!UUID_RE.test(listingId) || !(MODERATION_ACTIONS as readonly string[]).includes(action)) {
      return { status: 'error', message: 'Invalid request.' };
    }
    if (REASON_REQUIRED.has(action) && reason.length < 5) {
      return { status: 'error', message: 'A reason is required for this action (at least 5 characters).', errors: { reason: 'Add a reason' } };
    }
    if (reason.length > 1000) return { status: 'error', message: 'Keep the reason under 1000 characters.', errors: { reason: 'Too long' } };

    const db = getAdminClient();
    const { data: current } = await db.from('listings').select('status, slug').eq('id', listingId).maybeSingle();
    if (!current) return { status: 'error', message: 'Listing not found.' };

    const to: ListingStatus = ACTION_TARGET[action];
    if (!canTransition(current.status as ListingStatus, to)) {
      return { status: 'error', message: `A listing that is "${current.status}" cannot be moved to "${to}".` };
    }

    // Approval and reinstatement make a listing public, so the moderator must explicitly attest to availability.
    const goesLive = to === 'approved';
    if (goesLive && !confirmedAvailable) {
      return {
        status: 'error',
        message: 'Tick the box to confirm you have checked the listing is still marked available before publishing.',
        errors: { confirmed_available: 'Required before publishing' },
      };
    }
    const expiresAt = goesLive ? computeExpiry(new Date(), getFreshnessPolicy().expireAfterDays).toISOString() : null;

    const { error } = await db.rpc('moderate_listing', {
      p_listing_id: listingId,
      p_moderator: admin.userId,
      p_action: action,
      p_to: to,
      p_reason: reason || null,
      p_expires_at: expiresAt,
    });
    if (error) {
      console.error('moderateListing: rpc failed', error.code);
      return { status: 'error', message: 'The action could not be completed. The listing may have changed — reload and try again.' };
    }

    if (goesLive) {
      const { error: confError } = await db.rpc('record_availability', {
        p_listing_id: listingId,
        p_source: 'moderator',
        p_actor: admin.userId,
        p_expires_at: expiresAt,
        p_note: `Moderator confirmed on ${action}`,
      });
      if (confError) console.error('moderateListing: availability record failed', confError.code);
    }

    revalidatePublic(current.slug as string);
    revalidatePath('/admin');
    return { status: 'success', message: `Done: ${action.replace(/_/g, ' ')}.` };
  } catch (e) {
    if (e instanceof Error && e.message === 'Unauthorized') return { status: 'error', message: 'You are not authorized to do that.' };
    return { status: 'error', message: 'Something went wrong. Please try again.' };
  }
}

/** Moderator re-confirms availability (e.g. after contacting the contributor) to extend an approved listing. */
export async function confirmAvailabilityAsModerator(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await requireAdminAction();
    const listingId = String(formData.get('listing_id') ?? '');
    const note = String(formData.get('note') ?? '').trim().slice(0, 500);
    if (!UUID_RE.test(listingId)) return { status: 'error', message: 'Invalid request.' };
    const db = getAdminClient();
    const { data: current } = await db.from('listings').select('status, slug').eq('id', listingId).maybeSingle();
    if (!current || current.status !== 'approved') return { status: 'error', message: 'Only live listings can be reconfirmed.' };
    const expiresAt = computeExpiry(new Date(), getFreshnessPolicy().expireAfterDays).toISOString();
    const { error } = await db.rpc('record_availability', {
      p_listing_id: listingId,
      p_source: 'moderator',
      p_actor: admin.userId,
      p_expires_at: expiresAt,
      p_note: note || null,
    });
    if (error) return { status: 'error', message: 'Could not record the confirmation.' };
    revalidatePublic(current.slug as string);
    return { status: 'success', message: 'Availability confirmed and expiry extended.' };
  } catch (e) {
    if (e instanceof Error && e.message === 'Unauthorized') return { status: 'error', message: 'You are not authorized to do that.' };
    return { status: 'error', message: 'Something went wrong. Please try again.' };
  }
}

/** Records a verification check. Only an actual completed check should ever be recorded as "passed". */
export async function recordVerificationCheck(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await requireAdminAction();
    const parsed = verificationCheckSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { status: 'error', message: 'Please fix the highlighted fields.', errors: zodErrors(parsed.error) };
    const i = parsed.data;
    const db = getAdminClient();
    const { data: row } = await db.from('listings').select('slug').eq('id', i.listing_id).maybeSingle();
    if (!row) return { status: 'error', message: 'Listing not found.' };
    const { error } = await db.from('verification_checks').insert({
      listing_id: i.listing_id,
      check_type: i.check_type,
      status: i.status,
      method: i.method,
      notes: i.notes ?? null,
      reviewer_id: admin.userId,
    });
    if (error) return { status: 'error', message: 'Could not record the check.' };
    revalidatePublic(row.slug as string);
    return { status: 'success', message: 'Check recorded.' };
  } catch (e) {
    if (e instanceof Error && e.message === 'Unauthorized') return { status: 'error', message: 'You are not authorized to do that.' };
    return { status: 'error', message: 'Something went wrong. Please try again.' };
  }
}

export async function updateReport(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await requireAdminAction();
    const id = String(formData.get('report_id') ?? '');
    const status = String(formData.get('status') ?? '');
    const notes = String(formData.get('internal_notes') ?? '').trim().slice(0, 1000);
    if (!UUID_RE.test(id) || !['reviewing', 'actioned', 'dismissed'].includes(status)) return { status: 'error', message: 'Invalid request.' };
    const { error } = await getAdminClient()
      .from('listing_reports')
      .update({ status, internal_notes: notes || null, reviewed_by: admin.userId, reviewed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return { status: 'error', message: 'Could not update the report.' };
    revalidatePath('/admin/reports');
    return { status: 'success', message: 'Report updated.' };
  } catch (e) {
    if (e instanceof Error && e.message === 'Unauthorized') return { status: 'error', message: 'You are not authorized to do that.' };
    return { status: 'error', message: 'Something went wrong. Please try again.' };
  }
}

export async function moderateRoommateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await requireAdminAction();
    const id = String(formData.get('profile_id') ?? '');
    const action = String(formData.get('action') ?? '');
    const reason = String(formData.get('reason') ?? '').trim();
    const map: Record<string, { to: ListingStatus; act: string }> = {
      approve: { to: 'approved', act: 'approve' },
      reject: { to: 'rejected', act: 'reject' },
      unpublish: { to: 'removed', act: 'unpublish' },
    };
    const m = map[action];
    if (!UUID_RE.test(id) || !m) return { status: 'error', message: 'Invalid request.' };
    if (m.act !== 'approve' && reason.length < 5) return { status: 'error', message: 'A reason is required (at least 5 characters).' };
    const expiresAt = m.to === 'approved' ? new Date(Date.now() + getFreshnessPolicy().roommateExpireAfterDays * 86_400_000).toISOString() : null;
    const { error } = await getAdminClient().rpc('moderate_roommate_profile', {
      p_profile_id: id,
      p_moderator: admin.userId,
      p_action: m.act,
      p_to: m.to,
      p_reason: reason || null,
      p_expires_at: expiresAt,
    });
    if (error) return { status: 'error', message: 'The action could not be completed. Reload and try again.' };
    revalidatePath('/roommates');
    revalidatePath('/admin/roommates');
    return { status: 'success', message: 'Done.' };
  } catch (e) {
    if (e instanceof Error && e.message === 'Unauthorized') return { status: 'error', message: 'You are not authorized to do that.' };
    return { status: 'error', message: 'Something went wrong. Please try again.' };
  }
}

export async function updateRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await requireAdminAction();
    const id = String(formData.get('request_id') ?? '');
    const status = String(formData.get('status') ?? '');
    if (!UUID_RE.test(id) || !['done', 'declined'].includes(status)) return { status: 'error', message: 'Invalid request.' };
    const { error } = await getAdminClient()
      .from('data_requests')
      .update({ status, handled_by: admin.userId, handled_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return { status: 'error', message: 'Could not update.' };
    revalidatePath('/admin/requests');
    return { status: 'success', message: 'Updated.' };
  } catch (e) {
    if (e instanceof Error && e.message === 'Unauthorized') return { status: 'error', message: 'You are not authorized to do that.' };
    return { status: 'error', message: 'Something went wrong.' };
  }
}
