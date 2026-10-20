'use server';

import { getAdminClient } from '@/lib/supabase/admin';
import { isServiceRoleConfigured } from '@/lib/config';
import { POLICY_VERSION } from '@/lib/constants';
import type { FormState } from '@/lib/forms';
import { AUTOMATED_MESSAGE, RATE_LIMIT_MESSAGE, allowRequest, looksAutomated } from '@/lib/security/ratelimit';
import { createRoommateSchema, formDataToRaw, zodErrors } from '@/lib/validation/schemas';

export async function submitRoommateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    if (!isServiceRoleConfigured()) return { status: 'error', message: 'This site is not connected to its database yet, so submissions are switched off.' };
    const raw = formDataToRaw(formData);
    if (looksAutomated(raw)) return { status: 'error', message: AUTOMATED_MESSAGE };
    if (!(await allowRequest('submit_roommate', 4, 3600))) return { status: 'error', message: RATE_LIMIT_MESSAGE };

    const parsed = createRoommateSchema().safeParse(raw);
    if (!parsed.success) return { status: 'error', message: 'Please fix the highlighted fields.', errors: zodErrors(parsed.error) };
    const i = parsed.data;

    const db = getAdminClient();
    const { data, error } = await db
      .from('roommate_profiles')
      .insert({
        status: 'pending_review',
        display_name: i.display_name,
        city: i.city,
        preferred_localities: i.preferred_localities,
        budget_min_inr: i.budget_min_inr ?? null,
        budget_max_inr: i.budget_max_inr,
        move_in_date: i.move_in_date,
        accommodation_type: i.accommodation_type ?? null,
        seeking: i.seeking,
        sharing_preference: i.sharing_preference,
        lifestyle: i.lifestyle,
        introduction: i.introduction,
        contact_method: i.contact_method,
        contact_value: i.contact_value,
        consent_processing: true,
        consent_public_profile: true,
        consent_public_contact: i.consent_public_contact,
        policy_version: POLICY_VERSION,
      })
      .select('id')
      .single();
    if (error || !data) {
      console.error('submitRoommateProfile: insert failed', error?.code);
      return { status: 'error', message: 'Something went wrong and your profile was not saved. Please try again.' };
    }

    await Promise.all([
      db.from('moderation_actions').insert({ roommate_profile_id: data.id, action: 'submit', to_status: 'pending_review' }),
      db.from('consent_records').insert([
        { subject_table: 'roommate_profiles', subject_id: data.id, consent_type: 'processing', granted: true, policy_version: POLICY_VERSION },
        { subject_table: 'roommate_profiles', subject_id: data.id, consent_type: 'public_profile', granted: true, policy_version: POLICY_VERSION },
        { subject_table: 'roommate_profiles', subject_id: data.id, consent_type: 'public_contact', granted: i.consent_public_contact, policy_version: POLICY_VERSION },
      ]),
    ]);
    return { status: 'success', message: 'Submitted for review.' };
  } catch {
    return { status: 'error', message: 'Something went wrong and your profile was not saved. Please try again.' };
  }
}
