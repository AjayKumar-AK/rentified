import type { Metadata } from 'next';
import Link from 'next/link';
import { getListingByToken } from '@/lib/data/contributor';
import { t } from '@/messages';
import { formatDate, formatRupees } from '@/lib/format';
import { ManagePanel } from '@/components/ManagePanel';

export const metadata: Metadata = { title: 'Manage your listing', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function ManagePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let listing = null;
  let failed = false;
  try { listing = await getListingByToken(token); } catch { failed = true; }

  if (failed) return <div className="narrow page-head"><div className="alert alert--error" role="alert">Something went wrong. Please try again shortly.</div></div>;
  if (!listing) {
    return (
      <div className="narrow page-head">
        <h1>This link is not valid</h1>
        <p className="muted">Check that you copied the whole link. We cannot recover a lost link; if you need help, <Link href="/contact?kind=correction">contact us</Link> with the listing’s address.</p>
      </div>
    );
  }
  return (
    <div className="narrow" style={{ paddingBottom: 80 }}>
      <div className="page-head">
        <p className="eyebrow">Your private link</p>
        <h1>{listing.title}</h1>
        <p className="muted">{listing.locality}, {listing.city} · {formatRupees(listing.rent_inr)}/month · Status: <strong>{t.labels.status[listing.status]}</strong></p>
        <p className="small muted">Last confirmed available: {formatDate(listing.last_confirmed_at)} · Anyone with this link can manage this listing — keep it private.</p>
      </div>
      <ManagePanel token={token} listing={listing} />
    </div>
  );
}
