import type { Metadata } from 'next';
import { getAdminClient } from '@/lib/supabase/admin';
import { formatDate, formatDateTime, formatRupees } from '@/lib/format';
import { t } from '@/messages';

export const metadata: Metadata = { title: 'Requirements · Moderation', robots: { index: false, follow: false } };

export default async function AdminRequirements() {
  const { data, error } = await getAdminClient().from('renter_requirements').select('*').order('created_at', { ascending: false }).limit(100);
  const rows = (data ?? []) as Record<string, unknown>[];
  return (
    <div className="stack">
      <h1 style={{ fontSize: '2rem' }}>Renter requirements</h1>
      <p className="small muted">Private. Used to understand demand. Only contact people who ticked the contact box.</p>
      {error && <div className="alert alert--error">Could not load requirements.</div>}
      {rows.length === 0 && !error && <p className="muted">None yet.</p>}
      <div className="table-wrap card">
        {rows.length > 0 && (
          <table className="admin-table">
            <thead><tr><th>Where</th><th>Budget</th><th>Types</th><th>Move-in</th><th>Contact</th><th>Submitted</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id as string}>
                  <td>{r.city as string}<div className="small muted">{(r.preferred_localities as string[]).join(', ')}</div></td>
                  <td>{r.budget_min_inr ? `${formatRupees(r.budget_min_inr as number)}–` : '≤ '}{formatRupees(r.budget_max_inr as number)}</td>
                  <td>{(r.accommodation_types as string[]).map((x) => t.labels.accommodation[x as keyof typeof t.labels.accommodation]).join(', ')}</td>
                  <td>{formatDate(r.move_in_date as string)}</td>
                  <td>{r.consent_contact_me ? `${r.contact_value as string}` : <span className="muted">do not contact</span>}</td>
                  <td>{formatDateTime(r.created_at as string)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
