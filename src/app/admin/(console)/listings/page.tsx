import type { Metadata } from 'next';
import Link from 'next/link';
import { adminListListings } from '@/lib/data/admin';
import { LISTING_STATUSES } from '@/lib/constants';
import { formatDateTime, formatRupees } from '@/lib/format';
import { t } from '@/messages';
import type { ListingStatus } from '@/lib/types';

export const metadata: Metadata = { title: 'Listings · Moderation', robots: { index: false, follow: false } };

export default async function AdminListings({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const status = (LISTING_STATUSES as readonly string[]).includes(sp.status ?? '') ? (sp.status as ListingStatus) : sp.status === 'all' ? 'all' : 'pending_review';
  const q = sp.q ?? '';
  const rows = await adminListListings(status, q);
  const tabs: (ListingStatus | 'all')[] = ['pending_review', 'changes_requested', 'approved', 'unavailable', 'expired', 'rejected', 'removed', 'all'];
  return (
    <div className="stack">
      <h1 style={{ fontSize: '2rem' }}>Listings</h1>
      <nav className="tabs" aria-label="Status filter">
        {tabs.map((s) => (
          <Link key={s} href={`/admin/listings?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ''}`} aria-current={status === s ? 'page' : undefined}>{s === 'all' ? 'All' : t.labels.status[s]}</Link>
        ))}
      </nav>
      <form method="get" className="row" role="search">
        <input type="hidden" name="status" value={status} />
        <label className="sr-only" htmlFor="aq">Search</label>
        <input id="aq" name="q" className="input" style={{ maxWidth: 320 }} placeholder="Title, city or locality" defaultValue={q} />
        <button className="btn btn--primary btn--sm">Search</button>
      </form>
      {rows.length === 0 ? <p className="muted">Nothing here.</p> : (
        <div className="table-wrap card">
          <table className="admin-table">
            <thead><tr><th>Listing</th><th>Source</th><th>Rent</th><th>Status</th><th>Submitted</th><th>Last confirmed</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><Link href={`/admin/listings/${r.id}`}>{r.title}</Link>{r.is_demo && <> <span className="badge badge--demo">Demo</span></>}<div className="small muted">{r.locality}, {r.city}</div></td>
                  <td>{r.contributor_type} · {r.listing_type}</td>
                  <td>{formatRupees(r.rent_inr)}</td>
                  <td><span className="badge badge--outline">{t.labels.status[r.status]}</span></td>
                  <td>{formatDateTime(r.submitted_at)}</td>
                  <td>{formatDateTime(r.last_confirmed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
