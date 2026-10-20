'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from 'react';
import { createUploadUrls } from '@/app/actions/uploads';
import { getBrowserClient } from '@/lib/supabase/browser';
import { MAX_PHOTOS, MAX_PHOTO_BYTES, PHOTO_BUCKET } from '@/lib/constants';

type Item = {
  key: string;
  preview: string;
  state: 'uploading' | 'done' | 'error';
  progress: number;
  name?: string;
  message?: string;
};

const EXT: Record<string, 'jpg' | 'png' | 'webp'> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/**
 * Uploads straight from the phone/browser to PRIVATE storage via server-minted signed URLs.
 * The listing form submits only the resulting object names; the server re-verifies each one.
 */
export function PhotoUploader({ error, onBusyChange }: { error?: string; onBusyChange?: (busy: boolean) => void }) {
  const [items, setItems] = useState<Item[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const sessionRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const busy = items.some((i) => i.state === 'uploading');
  useEffect(() => onBusyChange?.(busy), [busy, onBusyChange]);

  const patch = (key: string, p: Partial<Item>) => setItems((cur) => cur.map((i) => (i.key === key ? { ...i, ...p } : i)));

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setNotice(null);
    const room = MAX_PHOTOS - items.length;
    const picked = Array.from(files).slice(0, Math.max(0, room));
    if (files.length > room) setNotice(`You can add up to ${MAX_PHOTOS} photos. Extra files were skipped.`);

    const valid: File[] = [];
    const problems: string[] = [];
    for (const f of picked) {
      if (!EXT[f.type]) problems.push(`${f.name}: use a JPEG, PNG or WebP image.`);
      else if (f.size > MAX_PHOTO_BYTES) problems.push(`${f.name}: larger than 5 MB.`);
      else valid.push(f);
    }
    if (problems.length) setNotice(problems.join(' '));
    if (valid.length === 0) return;

    const entries: Item[] = valid.map((f) => ({ key: `${f.name}-${f.size}-${Math.random()}`, preview: URL.createObjectURL(f), state: 'uploading', progress: 5 }));
    setItems((cur) => [...cur, ...entries]);

    const res = await createUploadUrls({ sessionId: sessionRef.current, extensions: valid.map((f) => EXT[f.type]) });
    if (!res.ok) {
      entries.forEach((e) => patch(e.key, { state: 'error', message: res.message }));
      setNotice(res.message);
      return;
    }
    sessionRef.current = res.sessionId;
    setSessionId(res.sessionId);

    const storage = getBrowserClient().storage.from(PHOTO_BUCKET);
    await Promise.all(
      valid.map(async (file, idx) => {
        const slot = res.slots[idx];
        const entry = entries[idx];
        patch(entry.key, { progress: 40 });
        const { error: upErr } = await storage.uploadToSignedUrl(slot.path, slot.token, file, { contentType: file.type });
        if (upErr) patch(entry.key, { state: 'error', message: 'Upload failed. Remove it and try again.' });
        else patch(entry.key, { state: 'done', progress: 100, name: slot.name });
      }),
    );
  }

  function remove(key: string) {
    setItems((cur) => cur.filter((i) => i.key !== key));
  }

  const doneNames = items.filter((i) => i.state === 'done' && i.name).map((i) => i.name as string);

  return (
    <div className="field field--wide">
      <span className="label" id="photos-label">Photos</span>
      <div className="hint" id="photos-hint">
        Add 1–{MAX_PHOTOS} clear photos (JPEG, PNG or WebP, up to 5 MB each). Only upload photos you took or have the right to share. Photos stay private until a moderator approves the listing. Avoid photos showing people, name plates or house numbers.
      </div>
      <div className="dropzone">
        <input
          ref={inputRef} id="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple
          aria-labelledby="photos-label" aria-describedby={error ? 'photos-hint photos-error' : 'photos-hint'}
          aria-invalid={error ? true : undefined}
          onChange={(e) => { void onFiles(e.target.files); e.target.value = ''; }}
          disabled={items.length >= MAX_PHOTOS}
        />
        {items.length > 0 && (
          <div className="thumbs" aria-live="polite">
            {items.map((i) => (
              <div className="thumb" key={i.key}>
                <img src={i.preview} alt="Selected photo preview" />
                {i.state === 'uploading' && <progress value={i.progress} max={100} aria-label="Upload progress" />}
                {i.state === 'done' && <span className="tstate">Uploaded</span>}
                {i.state === 'error' && <span className="tstate" style={{ color: '#a3341c' }}>Failed</span>}
                <button type="button" onClick={() => remove(i.key)} aria-label="Remove this photo">×</button>
              </div>
            ))}
          </div>
        )}
      </div>
      {notice && <div className="error" role="alert">{notice}</div>}
      {error && <div className="error" id="photos-error" role="alert">{error}</div>}
      <input type="hidden" name="upload_session_id" value={sessionId ?? ''} />
      <input type="hidden" name="photo_names" value={JSON.stringify(doneNames)} />
    </div>
  );
}
