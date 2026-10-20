'use server';

import { getAdminClient } from '@/lib/supabase/admin';
import { allowRequest, RATE_LIMIT_MESSAGE } from '@/lib/security/ratelimit';
import { newId } from '@/lib/security/token';
import { isServiceRoleConfigured } from '@/lib/config';
import { MAX_PHOTOS, PHOTO_BUCKET } from '@/lib/constants';

export interface UploadSlot {
  name: string;
  path: string;
  token: string;
}
export type UploadUrlsResult = { ok: true; sessionId: string; slots: UploadSlot[] } | { ok: false; message: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Mints signed upload URLs for a pending upload session. Photos stay private until a listing is approved. */
export async function createUploadUrls(input: { sessionId: string | null; extensions: string[] }): Promise<UploadUrlsResult> {
  try {
    if (!isServiceRoleConfigured()) return { ok: false, message: 'Photo uploads are not set up on this deployment yet.' };
    const exts = Array.isArray(input.extensions) ? input.extensions : [];
    if (exts.length === 0 || exts.length > MAX_PHOTOS || !exts.every((e) => e === 'jpg' || e === 'png' || e === 'webp')) {
      return { ok: false, message: 'Unsupported photo type.' };
    }
    if (!(await allowRequest('upload_urls', 20, 3600))) return { ok: false, message: RATE_LIMIT_MESSAGE };

    const sessionId = input.sessionId && UUID_RE.test(input.sessionId) ? input.sessionId : newId();
    const bucket = getAdminClient().storage.from(PHOTO_BUCKET);
    const slots: UploadSlot[] = [];
    for (const ext of exts) {
      const name = `${newId()}.${ext}`;
      const path = `pending/${sessionId}/${name}`;
      const { data, error } = await bucket.createSignedUploadUrl(path);
      if (error || !data) return { ok: false, message: 'Could not prepare the upload. Please try again.' };
      slots.push({ name, path, token: data.token });
    }
    return { ok: true, sessionId, slots };
  } catch {
    return { ok: false, message: 'Could not prepare the upload. Please try again.' };
  }
}
