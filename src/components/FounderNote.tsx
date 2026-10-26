'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react';

const EMAIL = 'ajaykumar.sudarsan1407@gmail.com';
const STORAGE_KEY = 'Nook rentals-founder-note-closed';

/**
 * Floating note from the founder. Closing it is remembered in this browser only (localStorage,
 * wrapped in try/catch because storage can be blocked). A small avatar button reopens it.
 */
export function FounderNote() {
  const [open, setOpen] = useState<boolean | null>(null); // null until mounted, avoids a flash/hydration mismatch
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    let closed = false;
    try { closed = window.localStorage.getItem(STORAGE_KEY) === '1'; } catch { /* storage unavailable */ }
    setOpen(!closed);
  }, []);

  function setAndRemember(next: boolean) {
    setOpen(next);
    try { window.localStorage.setItem(STORAGE_KEY, next ? '0' : '1'); } catch { /* ignore */ }
  }

  if (open === null) return null;

  const avatar = photoFailed ? (
    <span className="founder__initial" aria-hidden="true">A</span>
  ) : (
    <img src="/founder.jpg" alt="" width={56} height={56} className="founder__photo" onError={() => setPhotoFailed(true)} />
  );

  if (!open) {
    return (
      <button type="button" className="founder-fab" onClick={() => setAndRemember(true)} aria-label="Open a note from the founder">
        <span className="founder__initial" aria-hidden="true">A</span>
      </button>
    );
  }

  return (
    <aside className="founder" role="complementary" aria-label="A note from the founder">
      <button type="button" className="founder__close" onClick={() => setAndRemember(false)} aria-label="Close this note">×</button>
      <div className="founder__head">
        {avatar}
        <div>
          <strong>Built on Trust. Growing Through Community</strong>
        </div>
      </div>
      <div className="founder__body small">
        <p>
          Hi I am Ajay, founder of Nook rentals.
        </p>
        <p>
          We are starting Nook rentals with simple goal: to make finding rental homes and roommates easier, more transparent, and free of cost.
        </p>
        <p>
          Nook rentals is a community-driven platform. Its growth and usefulness depend on people like you contributing genuine listings and helping others find a place they can call home.
        </p>
        <p>
          There are no <strong>payment gateways or paid features</strong>. Nook rentals is <strong>completely free</strong> to use. If we cannot manage the running expenses, we may ask for voluntary contributions, and we will say so openly.
        </p>
        <p>
          <strong>Have a question, suggestion, or feedback?</strong> Feel free to reach out.
        </p>
        <p>
          <strong>Email:</strong> <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>Every genuine contribution helps Nook rentals grow.</strong>
        </p>
      </div>
    </aside>
  );
}