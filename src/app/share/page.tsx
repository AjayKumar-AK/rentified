import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Share a rental' };

export default function SharePage() {
  return (
    <div className="container">
      <div className="page-head">
        <p className="eyebrow">Contribute</p>
        <h1>What would you like to share?</h1>
        <p className="lede">Every submission is reviewed before it is public. Choose the option that fits.</p>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', paddingBottom: 64 }}>
        <Link href="/share/property" className="card card--pad stack" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="badge badge--dark">Owner or broker</span>
          <h2 style={{ fontSize: '1.6rem' }}>A property to rent</h2>
          <p className="muted">An apartment, house, villa or studio that is available now or soon.</p>
          <span className="btn btn--primary btn--sm" style={{ justifySelf: 'start' }}>List a property</span>
        </Link>
        <Link href="/share/room" className="card card--pad stack" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="badge badge--dark">Tenant, owner or room provider</span>
          <h2 style={{ fontSize: '1.6rem' }}>A room or shared space</h2>
          <p className="muted">A private room, shared room or PG space — you do not have to be the owner.</p>
          <span className="btn btn--primary btn--sm" style={{ justifySelf: 'start' }}>Offer a room</span>
        </Link>
        <Link href="/roommates/new" className="card card--pad stack" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="badge badge--outline">Looking, not listing</span>
          <h2 style={{ fontSize: '1.6rem' }}>I need a room or roommate</h2>
          <p className="muted">Create a roommate-seeker profile. It is separate from property listings.</p>
          <span className="btn btn--ghost btn--sm" style={{ justifySelf: 'start' }}>Create a profile</span>
        </Link>
        <Link href="/looking" className="card card--pad stack" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="badge badge--outline">Renter</span>
          <h2 style={{ fontSize: '1.6rem' }}>Register a requirement</h2>
          <p className="muted">Tell us what you are looking for. It stays private; we do not promise matching or alerts.</p>
          <span className="btn btn--ghost btn--sm" style={{ justifySelf: 'start' }}>Register</span>
        </Link>
      </div>
    </div>
  );
}
