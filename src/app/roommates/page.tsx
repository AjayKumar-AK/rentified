import type { Metadata } from 'next';
import Link from 'next/link';
import { t } from '@/messages';
import { listRoommateProfiles } from '@/lib/data/public';
import { contactHref } from '@/lib/validation/contact';
import { formatDate, formatRupees } from '@/lib/format';
import { EmptyState } from '@/components/EmptyState';

export const metadata: Metadata = { title: 'Roommates' };
export const dynamic = 'force-dynamic';

export default async function RoommatesPage() {
  const profiles = await listRoommateProfiles();
  return (
    <div className="container" style={{ paddingBottom: 80 }}>
      <div className="page-head">
        <p className="eyebrow">Roommates</p>
        <h1>People looking for a room or roommate</h1>
        <p className="lede">
          These are <strong>seeker profiles</strong>, not property listings — a profile shows that someone is searching, not that a room exists. Profiles are reviewed before they appear, are not identity-checked, and expire after a limited time.
        </p>
        <div className="btn-row">
          <Link href="/roommates/new" className="btn btn--primary">Create a profile</Link>
          <Link href="/share/room" className="btn btn--ghost">I have a room to offer</Link>
        </div>
      </div>

      {profiles === 'unconfigured' && <div className="alert alert--info" role="status">This site is not connected to a database yet.</div>}
      {profiles === 'error' && <div className="alert alert--error" role="alert">We could not load profiles right now. Please try again shortly.</div>}
      {Array.isArray(profiles) && profiles.length === 0 && (
        <EmptyState title="No roommate profiles are public yet" actions={<Link href="/roommates/new" className="btn btn--primary">Create the first profile</Link>}>
          Profiles appear here after review.
        </EmptyState>
      )}
      {Array.isArray(profiles) && profiles.length > 0 && (
        <div className="grid">
          {profiles.map((p) => {
            const href = p.public_contact_method && p.public_contact_value ? contactHref(p.public_contact_method, p.public_contact_value) : null;
            return (
              <article key={p.id} className="card card--pad stack" style={{ gap: 10 }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="badge badge--outline">Seeker profile</span>
                  <span className="small muted">{t.labels.seeking[p.seeking]}</span>
                </div>
                <h2 style={{ fontSize: '1.4rem', margin: 0 }}>{p.display_name}</h2>
                <p className="small muted" style={{ margin: 0 }}>
                  {p.city}{p.preferred_localities.length > 0 ? ` · ${p.preferred_localities.join(', ')}` : ''}
                </p>
                <p className="small" style={{ margin: 0 }}>
                  Budget {p.budget_min_inr ? `${formatRupees(p.budget_min_inr)}–` : 'up to '}{formatRupees(p.budget_max_inr)}/month · from {formatDate(p.move_in_date)} · {t.labels.sharing[p.sharing_preference]}
                </p>
                <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{p.introduction}</p>
                {p.lifestyle.length > 0 && <div className="row">{p.lifestyle.map((x) => <span key={x} className="badge">{(t.labels.lifestyle as Record<string, string>)[x] ?? x}</span>)}</div>}
                {href && p.public_contact_method ? (
                  <a className="btn btn--ghost btn--sm" href={href} rel="nofollow noopener" style={{ justifySelf: 'start' }}>Contact via {t.labels.contactMethod[p.public_contact_method]}</a>
                ) : <p className="small muted" style={{ margin: 0 }}>Contact details are private.</p>}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
