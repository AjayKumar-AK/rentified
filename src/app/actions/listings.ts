'use server';

import { getAdminClient } from '@/lib/supabase/admin';
import { isServiceRoleConfigured } from '@/lib/config';
import { POLICY_VERSION } from '@/lib/constants';
import { slugify } from '@/lib/format';
import type { FormState } from '@/lib/forms';
import { AUTOMATED_MESSAGE, RATE_LIMIT_MESSAGE, allowRequest, looksAutomated } from '@/lib/security/ratelimit';
import { createReconfirmToken, shortId } from '@/lib/security/token';
import { verifyUploadedPhotos } from '@/lib/uploads';
import { createListingSchema, formDataToRaw, zodErrors } from '@/lib/validation/schemas';

const NOT_READY: FormState = { status: 'error', message: 'This site is not connected to its database yet, so submissions are switched off.' };
const FAILED: FormState = { status: 'error', message: 'Something went wrong on our side and your submission was not saved. Please try again in a moment.' };

export async function submitListing(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    if (!isServiceRoleConfigured()) return NOT_READY;
    const raw = formDataToRaw(formData);
    if (looksAutomated(raw)) return { status: 'error', message: AUTOMATED_MESSAGE };
    if (!(await allowRequest('submit_listing', 5, 3600))) return { status: 'error', message: RATE_LIMIT_MESSAGE };

    const parsed = createListingSchema().safeParse(raw);
    if (!parsed.success) {
      return { status: 'error', message: 'Please fix the highlighted fields.', errors: zodErrors(parsed.error) };
    }
    const input = parsed.data;

    const photos = await verifyUploadedPhotos(input.upload_session_id, input.photo_names);
    if (!photos.ok) return { status: 'error', message: photos.message, errors: { photo_names: photos.message } };

    const db = getAdminClient();
    const { token, hash } = createReconfirmToken();
    const nowIso = new Date().toISOString();

    const { data: listing, error } = await db
      .from('listings')
      .insert({
        slug: `${slugify(input.title)}-${shortId()}`,
        listing_type: input.listing_type,
        contributor_type: input.contributor_type,
        status: 'pending_review', // never taken from the client
        title: input.title,
        description: input.description,
        city: input.city,
        locality: input.locality,
        public_location_text: input.public_location_text,
        private_address: input.private_address ?? null,
        accommodation_type: input.accommodation_type,
        rent_inr: input.rent_inr,
        deposit_inr: input.deposit_inr ?? null,
        brokerage_status: input.brokerage_status,
        brokerage_amount_inr: input.brokerage_status === 'applies' ? (input.brokerage_amount_inr ?? null) : null,
        available_from: input.available_from,
        furnishing: input.furnishing,
        bedrooms: input.bedrooms ?? null,
        bathrooms: input.bathrooms ?? null,
        amenities: input.amenities,
        contributor_display_name: input.contributor_display_name,
        contact_method: input.contact_method,
        contact_value: input.contact_value,
        consent_processing: true,
        consent_photo_rights: true,
        consent_public_contact: input.consent_public_contact,
        policy_version: POLICY_VERSION,
        reconfirm_token_hash: hash,
        last_confirmed_at: nowIso, // contributor-attested at submission
      })
      .select('id')
      .single();
    if (error || !listing) {
      console.error('submitListing: insert failed', error?.code);
      return FAILED;
    }

    const { error: photoError } = await db.from('listing_photos').insert(
      photos.items.map((p, i) => ({
        listing_id: listing.id,
        storage_path: p.path,
        position: i,
        content_type: p.type,
        size_bytes: p.size,
        alt_text: `Photo ${i + 1} of ${input.title}`,
      })),
    );
    if (photoError) {
      console.error('submitListing: photo insert failed', photoError.code);
      await db.from('listings').delete().eq('id', listing.id);
      return FAILED;
    }

    await Promise.all([
      db.from('availability_confirmations').insert({ listing_id: listing.id, source: 'contributor_at_submission' }),
      db.from('moderation_actions').insert({ listing_id: listing.id, action: 'submit', to_status: 'pending_review' }),
      db.from('consent_records').insert([
        { subject_table: 'listings', subject_id: listing.id, consent_type: 'processing', granted: true, policy_version: POLICY_VERSION },
        { subject_table: 'listings', subject_id: listing.id, consent_type: 'photo_rights', granted: true, policy_version: POLICY_VERSION },
        { subject_table: 'listings', subject_id: listing.id, consent_type: 'public_contact', granted: input.consent_public_contact, policy_version: POLICY_VERSION },
      ]),
    ]);

    return { status: 'success', message: 'Submitted for review.', reconfirmToken: token };
  } catch (e) {
    console.error('submitListing: unexpected error', e instanceof Error ? e.name : 'unknown');
    return FAILED;
  }
}
