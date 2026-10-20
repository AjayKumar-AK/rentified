import type { Metadata } from 'next';
import { getAdminClient } from '@/lib/supabase/admin';
import { formatDateTime } from '@/lib/format';
import { t } from '@/messages';
import { RequestActions } from '@/components/admin/RowActions';

export const metadata: Metadata = { title: 'Requests · Moderation', robots: { index: false, follow: false } };

export default async function AdminRequests() {
  const { data, error } = await getAdminClient().from('data_requests').select('*').eq('status', 'open').order('created_at', { ascending: true }).limit(100);
  const rows = (data ?? []) as Record<string, unknown>[];
  return (
    <div className="stack">
      <h1 style={{ fontSize: '2rem' }}>Correction, removal &amp; feedback requests</h1>
      <p className="small muted">Check the requester is really the contributor (e.g. via the contact on the listing) before changing or revealing anything.</p>
      {error && <div className="alert alert--error">Could not load requests.</div>}
      {rows.length === 0 && !error && <p className="muted">No open requests.</p>}
      {rows.map((r) => (
        <article key={r.id as string} className="card card--pad stack" style={{ gap: 10 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}><strong>{t.labels.requestKind[r.kind as keyof typeof t.labels.requestKind]}</strong><span className="small muted">{formatDateTime(r.created_at as string)}</span></div>
          <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{r.message as string}</p>
          <div className="small muted">Contact: {(r.contact_value as string | null) ?? 'none given'}{r.listing_id ? <> · <a href={`/admin/listings/${r.listing_id as string}`}>related listing</a></> : null}</div>
          <RequestActions id={r.id as string} />
        </article>
      ))}
    </div>
  );
}
