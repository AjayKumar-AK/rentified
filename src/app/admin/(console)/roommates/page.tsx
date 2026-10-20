import type { Metadata } from 'next';
import { getAdminClient } from '@/lib/supabase/admin';
import { formatDate, formatDateTime, formatRupees } from '@/lib/format';
import { t } from '@/messages';
import { RoommateActions } from '@/components/admin/RowActions';

export const metadata: Metadata = { title: 'Roommate profiles · Moderation', robots: { index: false, follow: false } };

export default async function AdminRoommates() {
  const { data, error } = await getAdminClient()
    .from('roommate_profiles')
    .select('*')
    .in('status', ['pending_review', 'approved'])
    .order('created_at', { ascending: false })
    .limit(100);
  const rows = (data ?? []) as Record<string, unknown>[];
  return (
    <div className="stack">
      <h1 style={{ fontSize: '2rem' }}>Roommate profiles</h1>
      {error && <div className="alert alert--error">Could not load profiles.</div>}
      {rows.length === 0 && !error && <p className="muted">No profiles to review.</p>}
      {rows.map((p) => (
        <article key={p.id as string} className="card card--pad stack" style={{ gap: 10 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>{p.display_name as string} — {t.labels.seeking[p.seeking as 'room' | 'roommate']}</strong>
            <span className="badge badge--outline">{t.labels.status[p.status as keyof typeof t.labels.status]}</span>
          </div>
          <p className="small muted" style={{ margin: 0 }}>{p.city as string} · {(p.preferred_localities as string[]).join(', ') || 'any locality'} · up to {formatRupees(p.budget_max_inr as number)} · from {formatDate(p.move_in_date as string)} · submitted {formatDateTime(p.created_at as string)}</p>
          <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{p.introduction as string}</p>
          <p className="small" style={{ margin: 0 }}>Contact (private): {t.labels.contactMethod[p.contact_method as 'phone']}: {p.contact_value as string} · public contact consent: {p.consent_public_contact ? '✓ yes' : '✗ no'}</p>
          <RoommateActions id={p.id as string} />
        </article>
      ))}
    </div>
  );
}
