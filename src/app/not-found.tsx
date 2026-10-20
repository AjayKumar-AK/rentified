import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="narrow page-head" style={{ paddingBottom: 96 }}>
      <p className="eyebrow">404</p>
      <h1>We couldn’t find that page</h1>
      <p className="lede">A listing may have been rented, expired or removed — that is the system working as intended.</p>
      <div className="btn-row"><Link href="/rentals" className="btn btn--primary">Browse rentals</Link><Link href="/" className="btn btn--ghost">Home</Link></div>
    </div>
  );
}
