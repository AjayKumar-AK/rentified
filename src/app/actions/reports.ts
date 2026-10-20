'use server';

import { getAdminClient } from '@/lib/supabase/admin';
import { isServiceRoleConfigured } from '@/lib/config';
import type { FormState } from '@/lib/forms';
import { AUTOMATED_MESSAGE, RATE_LIMIT_MESSAGE, allowRequest, looksAutomated } from '@/lib/security/ratelimit';
import { formDataToRaw, reportSchema, zodErrors } from '@/lib/validation/schemas';

/** Reports are private: they go to moderators and are never shown publicly or treated as proof. */
export async function submitReport(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    if (!isServiceRoleConfigured()) return { status: 'error', message: 'Reporting is not available on this deployment yet.' };
    const raw = formDataToRaw(formData);
    if (looksAutomated(raw, 1500)) return { status: 'error', message: AUTOMATED_MESSAGE };
    if (!(await allowRequest('submit_report', 8, 3600))) return { status: 'error', message: RATE_LIMIT_MESSAGE };

    const parsed = reportSchema.safeParse(raw);
    if (!parsed.success) return { status: 'error', message: 'Please fix the highlighted fields.', errors: zodErrors(parsed.error) };
    const i = parsed.data;

    const db = getAdminClient();
    const { data: listing } = await db.from('listings').select('id').eq('slug', i.listing_slug).eq('status', 'approved').maybeSingle();
    if (!listing) return { status: 'error', message: 'That listing is no longer public, so it cannot be reported.' };

    const { error } = await db.from('listing_reports').insert({
      listing_id: listing.id,
      category: i.category,
      description: i.description ?? null,
      reporter_contact: i.reporter_contact && i.contact_consent ? i.reporter_contact : null,
    });
    if (error) {
      console.error('submitReport: insert failed', error.code);
      return { status: 'error', message: 'Your report was not saved. Please try again.' };
    }
    return { status: 'success', message: 'Thank you. A moderator will review this. Reports are private and are not shown on the listing.' };
  } catch {
    return { status: 'error', message: 'Your report was not saved. Please try again.' };
  }
}
