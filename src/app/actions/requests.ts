'use server';

import { getAdminClient } from '@/lib/supabase/admin';
import { isServiceRoleConfigured } from '@/lib/config';
import type { FormState } from '@/lib/forms';
import { AUTOMATED_MESSAGE, RATE_LIMIT_MESSAGE, allowRequest, looksAutomated } from '@/lib/security/ratelimit';
import { dataRequestSchema, formDataToRaw, zodErrors } from '@/lib/validation/schemas';

/** Correction / removal / access requests and general feedback, usable by anyone about anything they submitted. */
export async function submitDataRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    if (!isServiceRoleConfigured()) return { status: 'error', message: 'This form is not available on this deployment yet.' };
    const raw = formDataToRaw(formData);
    if (looksAutomated(raw, 1500)) return { status: 'error', message: AUTOMATED_MESSAGE };
    if (!(await allowRequest('submit_request', 5, 3600))) return { status: 'error', message: RATE_LIMIT_MESSAGE };

    const parsed = dataRequestSchema.safeParse(raw);
    if (!parsed.success) return { status: 'error', message: 'Please fix the highlighted fields.', errors: zodErrors(parsed.error) };
    const i = parsed.data;

    const db = getAdminClient();
    let listingId: string | null = null;
    if (i.listing_ref) {
      const slug = i.listing_ref.split('?')[0].replace(/\/+$/, '').split('/').pop() ?? '';
      if (/^[a-z0-9-]{3,100}$/.test(slug)) {
        const { data } = await db.from('listings').select('id').eq('slug', slug).maybeSingle();
        listingId = data?.id ?? null;
      }
    }

    const { error } = await db.from('data_requests').insert({
      kind: i.kind,
      listing_id: listingId,
      message: i.listing_ref && !listingId ? `[listing ref: ${i.listing_ref.slice(0, 120)}] ${i.message}` : i.message,
      contact_value: i.contact_value ?? null,
    });
    if (error) {
      console.error('submitDataRequest: insert failed', error.code);
      return { status: 'error', message: 'Your request was not saved. Please try again.' };
    }
    return { status: 'success', message: 'Received. A person will read this; we have not set an automatic response time, so please be patient.' };
  } catch {
    return { status: 'error', message: 'Your request was not saved. Please try again.' };
  }
}
