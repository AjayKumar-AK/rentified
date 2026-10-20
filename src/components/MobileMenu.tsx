'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { t } from '@/messages';

/** Disclosure button + dropdown panel. Closes on navigation and on Escape. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button type="button" className="btn btn--ghost btn--sm menu-toggle" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((o) => !o)}>
        {open ? t.nav.close : t.nav.menu}
      </button>
      <nav id="mobile-nav" className={`mobile-nav${open ? ' open' : ''}`} aria-label="Mobile">
        <div className="container">
          <Link href="/rentals">{t.nav.browse}</Link>
          <Link href="/share">{t.nav.share}</Link>
          <Link href="/roommates">{t.nav.roommates}</Link>
          <Link href="/looking">{t.nav.looking}</Link>
          <Link href="/help">Help</Link>
        </div>
      </nav>
    </>
  );
}
