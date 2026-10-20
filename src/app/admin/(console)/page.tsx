import type { Metadata } from 'next';
import { Fragment } from 'react';
import Link from 'next/link';
import { adminDashboardCounts } from '@/lib/data/admin';
import { t } from '@/messages';
import { getFreshnessPolicy } from '@/lib/config';

export const metadata: Metadata = { title: 'Moderation', robots: { index: false, follow: false } };

export default async function AdminHome() {
  const c = await adminDashboardCounts();
  const policy = getFreshnessPolicy();
  const stat = (label: string, n: number, href: string) => (
    <Link href={href} className="card stat" style={{ textDecoration: 'none', color: 'inherit' }}><b>{n}</b><span className="small muted">{label}</span></Link>
  );
  return (
    <div className="stack stack--lg">
      <h1 style={{ fontSize: '2.2rem' }}>Moderation overview</h1>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
        {stat('Listings to review', c.byStatus.pending_review ?? 0, '/admin/listings?status=pending_review')}
        {stat('Awaiting contributor changes', c.byStatus.changes_requested ?? 0, '/admin/listings?status=changes_requested')}
        {stat('Open reports', c.openReports, '/admin/reports')}
        {stat('Roommate profiles to review', c.pendingRoommates, '/admin/roommates')}
        {stat('Open data requests', c.openRequests, '/admin/requests')}
        {stat('New renter requirements', c.newRequirements, '/admin/requirements')}
      </div>
      <section className="card card--pad">
        <h2 style={{ fontSize: '1.4rem' }}>Experiment metrics (real counts only)</h2>
        <dl className="kv">
          <dt>Total submissions</dt><dd>{c.totalSubmissions}</dd>
          <dt>Approved listings</dt><dd>{c.byStatus.approved ?? 0}</dd>
          <dt>Approved &amp; confirmed within {policy.staleAfterDays} days (non-demo)</dt><dd>{c.freshApproved}</dd>
          <dt>Renter requirements registered</dt><dd>{c.totalRequirements}</dd>
          {Object.entries(c.byStatus).map(([s, n]) => (<Fragment key={s}><dt>{t.labels.status[s as keyof typeof t.labels.status]}</dt><dd>{n}</dd></Fragment>))}
        </dl>
        <p className="small muted" style={{ marginBottom: 0 }}>Targets from the brief: 20 genuine contributions, 10 reviewed listings with recent confirmation. Counts include demo data if you seeded it; the “confirmed” figure excludes it.</p>
      </section>
      <p className="small muted">Freshness policy: ask for reconfirmation after {policy.staleAfterDays} days, expire after {policy.expireAfterDays} days (configurable via environment variables).</p>
    </div>
  );
}
