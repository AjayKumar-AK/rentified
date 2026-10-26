import Link from 'next/link';
import { t } from '@/messages';

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <Link href="/" className="wordmark" style={{ color: '#fff' }}>Nook<span>.</span></Link>
            <p className="small" style={{ marginTop: 10 }}>
              An early, community-built rental directory for India. Coverage is limited and grows as people contribute.
            </p>
          </div>
          <div>
            <h4>{t.footer.browse}</h4>
            <ul>
              <li><Link href="/rentals">All rentals</Link></li>
              <li><Link href="/looking">Register what you need</Link></li>
            </ul>
          </div>
          <div>
            <h4>{t.footer.contribute}</h4>
            <ul>
              <li><Link href="/share/property">Owner: list a property</Link></li>
              <li><Link href="/share/room">Tenant: offer a room</Link></li>
            </ul>
          </div>
          <div>
            <h4>{t.footer.roommates}</h4>
            <ul>
              <li><Link href="/roommates">Roommate seekers</Link></li>
              <li><Link href="/roommates/new">Create a profile</Link></li>
            </ul>
          </div>
          <div>
            <h4>About</h4>
            <ul>
              <li><Link href="/help">{t.footer.help}</Link></li>
              <li><Link href="/privacy">{t.footer.privacy}</Link></li>
              <li><Link href="/terms">{t.footer.terms}</Link></li>
              <li><Link href="/contact">{t.footer.contact}</Link></li>
            </ul>
          </div>
        </div>
        <p className="small" style={{ marginTop: 32, opacity: 0.8 }}>
          Nook does not verify that every listing is genuine or available. Never pay a deposit or advance before seeing a property in person.
        </p>
      </div>
    </footer>
  );
}