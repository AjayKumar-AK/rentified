'use server';

import { getAdminClient } from '@/lib/supabase/admin';
import { isServiceRoleConfigured } from '@/lib/config';
import { POLICY_VERSION } from '@/lib/constants';
import type { FormState } from '@/lib/forms';
import { AUTOMATED_MESSAGE, RATE_LIMIT_MESSAGE, allowRequest, looksAutomated } from '@/lib/security/ratelimit';
import { createRequirementSchema, formDataToRaw, zodErrors } from '@/lib/validation/schemas';

export async function submitRequirement(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    if (!isServiceRoleConfigured()) return { status: 'error', message: 'This site is not connected to its database yet, so submissions are switched off.' };
    const raw = formDataToRaw(formData);
    if (looksAutomated(raw)) return { status: 'error', message: AUTOMATED_MESSAGE };
    if (!(await allowRequest('submit_requirement', 5, 3600))) return { status: 'error', message: RATE_LIMIT_MESSAGE };

    const parsed = createRequirementSchema().safeParse(raw);
    if (!parsed.success) return { status: 'error', message: 'Please fix the highlighted fields.', errors: zodErrors(parsed.error) };
    const i = parsed.data;

    const db = getAdminClient();
    const { data, error } = await db
      .from('renter_requirements')
      .insert({
        city: i.city,
        preferred_localities: i.preferred_localities,
        budget_min_inr: i.budget_min_inr ?? null,
        budget_max_inr: i.budget_max_inr,
        accommodation_types: i.accommodation_types,
        move_in_date: i.move_in_date,
        furnishing_pref: i.furnishing_pref,
        brokerage_pref: i.brokerage_pref,
        notes: i.notes ?? null,
        contact_name: i.contact_name ?? null,
        contact_method: i.contact_method,
        contact_value: i.contact_value,
        consent_processing: true,
        consent_contact_me: i.consent_contact_me,
        policy_version: POLICY_VERSION,
      })
      .select('id')
      .single();
    if (error || !data) {
      console.error('submitRequirement: insert failed', error?.code);
      return { status: 'error', message: 'Something went wrong and your requirement was not saved. Please try again.' };
    }
    await db.from('consent_records').insert([
      { subject_table: 'renter_requirements', subject_id: data.id, consent_type: 'processing', granted: true, policy_version: POLICY_VERSION },
      { subject_table: 'renter_requirements', subject_id: data.id, consent_type: 'contact_me', granted: i.consent_contact_me, policy_version: POLICY_VERSION },
    ]);
    return { status: 'success', message: 'Saved.' };
  } catch {
    return { status: 'error', message: 'Something went wrong and your requirement was not saved. Please try again.' };
  }
}
