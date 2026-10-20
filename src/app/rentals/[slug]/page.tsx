/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { t } from '@/messages';
import { getFreshnessPolicy } from '@/lib/config';
import { getListingBySlug } from '@/lib/data/public';
import { contactHref } from '@/lib/validation/contact';
import { describeBrokerage, describeDeposit, formatDate, formatRupees } from '@/lib/format';
import { TrustSummary } from '@/components/TrustSummary';
import { ReportForm } from '@/components/forms/ReportForm';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const l = await getListingBySlug(slug);
  if (!l || l === 'error') return { title: 'Listing not available', robots: { index: false } };
  return {
    title: l.title,
    description: `${t.labels.accommodation[l.accommodation_type]} in ${l.locality}, ${l.city} — ${formatRupees(l.rent_inr)}/month. ${t.labels.contributorLong[l.contributor_type]}.`,
  };
}

export default async function ListingPage({ params }: Props) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (listing === 'error') {
    return (
      <div className="narrow page-head">
        <div className="alert alert--error" role="alert">We could not load this listing right now. Please try again shortly.</div>
      </div>
    );
  }
  if (!listing) notFound();

  const policy = getFreshnessPolicy();
  const href = listing.public_contact_method && listing.public_contact_value ? contactHref(listing.public_contact_method, listing.public_contact_value) : null;
  const availableNow = new Date(listing.available_from) <= new Date();

  return (
    <div className="container" style={{ paddingBottom: 80 }}>
      <p className="small" style={{ margin: '20px 0 12px' }}><Link href="/rentals">← All rentals</Link></p>
      {listing.is_demo && <div className="alert alert--info" style={{ marginBottom: 16 }}><strong>{t.trust.demo}.</strong> Do not contact anyone about this listing.</div>}

      <div className="detail">
        <div>
          <div className="gallery">
            {listing.photos.length > 0 ? (
              <>
                <div className="gallery__main" id="photo-main"><img src={listing.photos[0].url} alt={listing.photos[0].alt} width={960} height={720} /></div>
                {listing.photos.length > 1 && (
                  <div className="gallery__thumbs">
                    {listing.photos.slice(1).map((p, i) => (
                      <a key={p.url} href={p.url} target="_blank" rel="noopener noreferrer" aria-label={`Open photo ${i + 2} in a new tab`}><img src={p.url} alt={p.alt} loading="lazy" width={176} height={132} /></a>
                    ))}
                  </div>
                )}
              </>
            ) : <div className="gallery__main"><div className="mini-photo" style={{ height: '100%' }}>No photos available</div></div>}
          </div>

          <h1 style={{ marginTop: 28, fontSize: 'clamp(1.9rem, 3.6vw, 2.8rem)' }}>{listing.title}</h1>
          <p className="muted">{listing.public_location_text} · {t.labels.accommodation[listing.accommodation_type]}</p>
          <div className="row" style={{ marginBottom: 8 }}>
            <span className="badge badge--dark">{t.labels.contributorLong[listing.contributor_type]}</span>
            <span className="badge badge--outline">{t.labels.listingType[listing.listing_type]}</span>
          </div>

          <dl className="facts">
            <div><dt>Monthly rent</dt><dd>{formatRupees(listing.rent_inr)}</dd></div>
            <div><dt>Deposit</dt><dd>{listing.deposit_inr === null ? 'Not specified' : listing.deposit_inr === 0 ? 'None (as stated)' : formatRupees(listing.deposit_inr)}</dd></div>
            <div><dt>Brokerage</dt><dd>{describeBrokerage(listing.brokerage_status, listing.brokerage_amount_inr).replace('Brokerage ', '').replace(/^./, (c) => c.toUpperCase())}</dd></div>
            <div><dt>Available</dt><dd>{availableNow ? 'Now' : formatDate(listing.available_from)}</dd></div>
            <div><dt>Furnishing</dt><dd>{t.labels.furnishing[listing.furnishing]}</dd></div>
            {listing.bedrooms !== null && <div><dt>Bedrooms</dt><dd>{listing.bedrooms}</dd></div>}
            {listing.bathrooms !== null && <div><dt>Bathrooms</dt><dd>{listing.bathrooms}</dd></div>}
          </dl>
          <p className="sr-only">{describeDeposit(listing.deposit_inr)}</p>

          <h2 style={{ fontSize: '1.5rem' }}>About this place</h2>
          <p style={{ whiteSpace: 'pre-line' }}>{listing.description}</p>

          {listing.amenities.length > 0 && (
            <>
              <h2 style={{ fontSize: '1.5rem' }}>Facilities</h2>
              <div className="row">
                {listing.amenities.map((a) => <span className="badge badge--outline" key={a}>{(t.labels.amenity as Record<string, string>)[a] ?? a}</span>)}
              </div>
            </>
          )}
        </div>

        <aside className="detail__side stack" aria-label="Trust, contact and reporting">
          <div className="card card--pad">
            <h2 style={{ fontSize: '1.4rem' }}>What has been checked</h2>
            <TrustSummary listing={listing} policy={policy} />
          </div>

          <div className="card card--pad">
            <h2 style={{ fontSize: '1.4rem' }}>Contact</h2>
            {href && listing.public_contact_method ? (
              <>
                <p className="small muted">The contributor chose to show this publicly. Never pay a deposit or advance before seeing the place in person.</p>
                <a className="btn btn--primary" href={href} rel="nofollow noopener">
                  {listing.public_contact_method === 'email' ? 'Email' : listing.public_contact_method === 'whatsapp' ? 'WhatsApp' : 'Call'} the contributor
                </a>
              </>
            ) : (
              <p className="muted" style={{ margin: 0 }}>The contributor has not made contact details public. Contact is not available through this page yet.</p>
            )}
          </div>

          <details className="card card--pad" id="report">
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>⚑ Report this listing</summary>
            <div style={{ marginTop: 16 }}>
              <p className="small muted">Already rented? Wrong price? Suspicious? Tell us. Reports are private, reviewed by a moderator, and never shown on the listing.</p>
              <ReportForm slug={listing.slug} />
            </div>
          </details>
          <p className="small muted">Are you the contributor? <Link href={`/contact?kind=correction&ref=${encodeURIComponent(`/rentals/${listing.slug}`)}`}>Request a correction or removal</Link>.</p>
        </aside>
      </div>
    </div>
  );
}
