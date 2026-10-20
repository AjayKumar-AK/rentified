/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminGetListing } from '@/lib/data/admin';
import { availableActions } from '@/lib/moderation/transitions';
import { getListingWarnings } from '@/lib/moderation/warnings';
import { describeBrokerage, describeDeposit, formatDate, formatDateTime, formatRupees } from '@/lib/format';
import { t } from '@/messages';
import { ModerationForm, ReconfirmForm, VerificationForm } from '@/components/admin/ListingActions';

export const metadata: Metadata = { title: 'Review listing', robots: { index: false, follow: false } };

export default async function AdminListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await adminGetListing(id);
  if (!d) notFound();
  const { listing: l } = d;
  const warnings = getListingWarnings({
    title: l.title, description: l.description, rent_inr: l.rent_inr, deposit_inr: l.deposit_inr,
    brokerage_status: l.brokerage_status, contributor_type: l.contributor_type, private_address: l.private_address,
    photoCount: d.photos.length, duplicateContactCount: d.duplicateContactCount,
  });
  const yes = (b: boolean) => (b ? '✓ Yes' : '✗ No');

  return (
    <div className="stack stack--lg">
      <p className="small"><Link href="/admin/listings">← Listings</Link></p>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>{l.title}</h1>
        <div className="row"><span className="badge badge--dark">{t.labels.status[l.status]}</span>{l.is_demo && <span className="badge badge--demo">Demo</span>}
          {l.status === 'approved' && <Link className="btn btn--ghost btn--sm" href={`/rentals/${l.slug}`}>View public page</Link>}</div>
      </div>

      {warnings.length > 0 && (
        <section className="alert alert--info" aria-label="Validation warnings">
          <strong>Things to look at</strong> <span className="small muted">(heuristics, not proof)</span>
          <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>{warnings.map((w) => <li key={w.message}>{w.level === 'warn' ? '⚠ ' : 'ℹ '}{w.message}</li>)}</ul>
        </section>
      )}

      <div className="detail">
        <div className="stack stack--lg">
          <section className="card card--pad stack">
            <h2 style={{ fontSize: '1.4rem' }}>Photos ({d.photos.length})</h2>
            <div className="admin-photos">
              {d.photos.map((p) => p.url ? <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer"><img src={p.url} alt="Submitted photo" loading="lazy" /></a> : <div key={p.id} className="mini-photo" style={{ aspectRatio: '4/3' }}>unavailable</div>)}
            </div>
          </section>

          <section className="card card--pad stack">
            <h2 style={{ fontSize: '1.4rem' }}>Submission</h2>
            <dl className="kv">
              <dt>Description</dt><dd style={{ whiteSpace: 'pre-line' }}>{l.description}</dd>
              <dt>Type</dt><dd>{t.labels.listingType[l.listing_type]} · {t.labels.accommodation[l.accommodation_type]}</dd>
              <dt>Public location</dt><dd>{l.public_location_text}</dd>
              <dt>Private address</dt><dd>{l.private_address ?? '—'}</dd>
              <dt>Rent</dt><dd>{formatRupees(l.rent_inr)}</dd>
              <dt>Deposit</dt><dd>{describeDeposit(l.deposit_inr)}</dd>
              <dt>Brokerage</dt><dd>{describeBrokerage(l.brokerage_status, l.brokerage_amount_inr)}</dd>
              <dt>Available from</dt><dd>{formatDate(l.available_from)}</dd>
              <dt>Furnishing / beds / baths</dt><dd>{t.labels.furnishing[l.furnishing]} · {l.bedrooms ?? '—'} · {l.bathrooms ?? '—'}</dd>
              <dt>Facilities</dt><dd>{l.amenities.length ? l.amenities.join(', ') : '—'}</dd>
            </dl>
          </section>

          <section className="card card--pad stack">
            <h2 style={{ fontSize: '1.4rem' }}>Contributor (private)</h2>
            <dl className="kv">
              <dt>Role claimed</dt><dd>{t.labels.contributor[l.contributor_type]}</dd>
              <dt>Name</dt><dd>{l.contributor_display_name}</dd>
              <dt>Contact</dt><dd>{t.labels.contactMethod[l.contact_method]}: {l.contact_value}</dd>
              <dt>Consent: processing</dt><dd>{yes(l.consent_processing)}</dd>
              <dt>Consent: photo rights</dt><dd>{yes(l.consent_photo_rights)}</dd>
              <dt>Consent: public contact</dt><dd>{yes(l.consent_public_contact)} {l.consent_public_contact && <span className="small muted">(contact will be shown publicly)</span>}</dd>
              <dt>Policy version</dt><dd>{l.policy_version}</dd>
              <dt>Submitted</dt><dd>{formatDateTime(l.submitted_at)}</dd>
              <dt>Last confirmed available</dt><dd>{formatDateTime(l.last_confirmed_at)}</dd>
              <dt>Last edited</dt><dd>{formatDateTime(l.updated_at)}</dd>
              <dt>Expires</dt><dd>{formatDateTime(l.expires_at)}</dd>
            </dl>
          </section>

          <section className="card card--pad stack">
            <h2 style={{ fontSize: '1.4rem' }}>Review history</h2>
            {d.history.length === 0 ? <p className="muted">No history yet.</p> : (
              <ol style={{ margin: 0, paddingLeft: 18 }}>
                {d.history.map((h) => (
                  <li key={h.id} style={{ marginBottom: 8 }}>
                    <strong>{h.action.replace(/_/g, ' ')}</strong>{h.from_status && h.to_status && h.from_status !== h.to_status ? ` (${h.from_status} → ${h.to_status})` : ''} · {formatDateTime(h.created_at)} · {h.moderator_id ? 'moderator' : 'contributor/system'}
                    {h.reason && <div className="small muted">{h.reason}</div>}
                  </li>
                ))}
              </ol>
            )}
            <h3 style={{ fontSize: '1.1rem' }}>Availability confirmations</h3>
            {d.confirmations.length === 0 ? <p className="muted small">None.</p> : <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{d.confirmations.map((c) => <li key={c.id}>{formatDateTime(c.confirmed_at)} — {c.source.replace(/_/g, ' ')}{c.note ? ` — ${c.note}` : ''}</li>)}</ul>}
          </section>

          {d.reports.length > 0 && (
            <section className="card card--pad stack">
              <h2 style={{ fontSize: '1.4rem' }}>Reports on this listing ({d.reports.length})</h2>
              <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
                {d.reports.map((r) => <li key={r.id}>{t.labels.report[r.category as keyof typeof t.labels.report]} · {r.status} · {formatDateTime(r.created_at)}{r.description ? ` — ${r.description}` : ''}</li>)}
              </ul>
              <Link href="/admin/reports">Open reports queue</Link>
            </section>
          )}
        </div>

        <aside className="detail__side stack">
          <section className="card card--pad">
            <h2 style={{ fontSize: '1.4rem' }}>Decision</h2>
            <ModerationForm listingId={l.id} actions={availableActions(l.status)} />
          </section>
          {l.status === 'approved' && (
            <section className="card card--pad"><h2 style={{ fontSize: '1.2rem' }}>Reconfirm availability</h2><ReconfirmForm listingId={l.id} /></section>
          )}
          <section className="card card--pad">
            <h2 style={{ fontSize: '1.2rem' }}>Verification checks</h2>
            {d.checks.length === 0 ? <p className="small muted">None recorded. Public page shows “not checked”.</p> : (
              <ul className="small" style={{ paddingLeft: 18 }}>{d.checks.map((c) => <li key={c.id}>{c.check_type}: <strong>{c.status}</strong> · {formatDate(c.checked_at)} · {c.method}</li>)}</ul>
            )}
            <VerificationForm listingId={l.id} />
          </section>
        </aside>
      </div>
    </div>
  );
}
