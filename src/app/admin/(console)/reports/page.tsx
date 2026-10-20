import type { Metadata } from 'next';
import Link from 'next/link';
import { getAdminClient } from '@/lib/supabase/admin';
import { formatDateTime } from '@/lib/format';
import { t } from '@/messages';
import { ReportActions } from '@/components/admin/RowActions';

export const metadata: Metadata = { title: 'Reports · Moderation', robots: { index: false, follow: false } };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const showClosed = sp.show === 'closed';
  const { data, error } = await getAdminClient()
    .from('listing_reports')
    .select('id, category, description, reporter_contact, status, internal_notes, created_at, listing_id, listings(title, slug, status)')
    .in('status', showClosed ? ['actioned', 'dismissed'] : ['open', 'reviewing'])
    .order('created_at', { ascending: false })
    .limit(100);
  type Row = { id: string; category: keyof typeof t.labels.report; description: string | null; reporter_contact: string | null; status: string; internal_notes: string | null; created_at: string; listing_id: string; listings: { title: string; slug: string; status: string } | { title: string; slug: string; status: string }[] | null };
  const rows = (data ?? []) as unknown as Row[];
  return (
    <div className="stack">
      <h1 style={{ fontSize: '2rem' }}>Reports</h1>
      <nav className="tabs" aria-label="Report filter">
        <Link href="/admin/reports" aria-current={!showClosed ? 'page' : undefined}>Open</Link>
        <Link href="/admin/reports?show=closed" aria-current={showClosed ? 'page' : undefined}>Closed</Link>
      </nav>
      <p className="small muted">Reports are private prompts for review. They are not proof, and are never shown publicly.</p>
      {error && <div className="alert alert--error">Could not load reports.</div>}
      {rows.length === 0 && !error && <p className="muted">No reports here.</p>}
      {rows.map((r) => {
        const l = Array.isArray(r.listings) ? r.listings[0] : r.listings;
        return (
          <article key={r.id} className="card card--pad stack" style={{ gap: 10 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <strong>{t.labels.report[r.category]}</strong>
              <span className="small muted">{formatDateTime(r.created_at)} · {r.status}</span>
            </div>
            <div className="small">Listing: <Link href={`/admin/listings/${r.listing_id}`}>{l?.title ?? 'listing'}</Link> {l && <span className="muted">({l.status})</span>}</div>
            {r.description && <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{r.description}</p>}
            {r.reporter_contact && <div className="small muted">Reporter agreed to be contacted: {r.reporter_contact}</div>}
            <ReportActions id={r.id} status={r.status} notes={r.internal_notes} />
          </article>
        );
      })}
    </div>
  );
}
