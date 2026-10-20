import 'server-only';
import { getAdminClient } from '@/lib/supabase/admin';
import { MAX_PHOTO_BYTES, MAX_PHOTOS, PHOTO_BUCKET, PHOTO_MIME_TYPES } from '@/lib/constants';
import { PHOTO_NAME_RE } from '@/lib/validation/schemas';

export interface VerifiedPhoto {
  path: string;
  type: string;
  size: number;
}

/**
 * The browser uploads directly to Supabase Storage with signed upload URLs (so large phone photos
 * never pass through the serverless function body limit). The server therefore re-verifies every
 * referenced object (exists, size, MIME type, correct session folder) before trusting it.
 */
export async function verifyUploadedPhotos(
  sessionId: string,
  names: string[],
): Promise<{ ok: true; items: VerifiedPhoto[] } | { ok: false; message: string }> {
  if (names.length === 0 || names.length > MAX_PHOTOS || new Set(names).size !== names.length) {
    return { ok: false, message: `Add between 1 and ${MAX_PHOTOS} photos.` };
  }
  if (!names.every((n) => PHOTO_NAME_RE.test(n))) return { ok: false, message: 'One of the photos is invalid. Please add it again.' };

  const folder = `pending/${sessionId}`;
  const { data, error } = await getAdminClient().storage.from(PHOTO_BUCKET).list(folder, { limit: 100 });
  if (error || !data) return { ok: false, message: 'We could not check your photos. Please try again.' };

  const byName = new Map(data.map((o) => [o.name, o]));
  const items: VerifiedPhoto[] = [];
  for (const name of names) {
    const obj = byName.get(name);
    const meta = (obj?.metadata ?? {}) as { size?: number; mimetype?: string };
    if (!obj || typeof meta.size !== 'number' || typeof meta.mimetype !== 'string') {
      return { ok: false, message: 'A photo did not finish uploading. Please remove it and add it again.' };
    }
    if (meta.size <= 0 || meta.size > MAX_PHOTO_BYTES) return { ok: false, message: 'A photo is larger than 5 MB.' };
    if (!(PHOTO_MIME_TYPES as readonly string[]).includes(meta.mimetype)) {
      return { ok: false, message: 'Photos must be JPEG, PNG or WebP.' };
    }
    items.push({ path: `${folder}/${name}`, type: meta.mimetype, size: meta.size });
  }
  return { ok: true, items };
}
