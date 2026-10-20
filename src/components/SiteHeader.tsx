import Link from 'next/link';
import { t } from '@/messages';
import { MobileMenu } from '@/components/MobileMenu';

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container">
        <div className="site-header__row">
          <Link href="/" className="wordmark" aria-label="Rentified home">
            Rent<span>ified</span>
          </Link>
          <nav className="nav" aria-label="Main">
            <Link href="/rentals">{t.nav.browse}</Link>
            <Link href="/share">{t.nav.share}</Link>
            <Link href="/roommates">{t.nav.roommates}</Link>
            <Link href="/looking" className="btn btn--ghost btn--sm">{t.nav.looking}</Link>
          </nav>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
