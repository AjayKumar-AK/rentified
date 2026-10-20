/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { t } from '@/messages';
import { describeBrokerage, describeDeposit, formatDate, formatRupees } from '@/lib/format';
import { getFreshness, type FreshnessPolicy } from '@/lib/freshness';
import type { ListingWithPhotos } from '@/lib/types';

export function ListingCard({ listing, policy, preview = false }: { listing: ListingWithPhotos; policy: FreshnessPolicy; preview?: boolean }) {
  const photo = listing.photos[0];
  const fresh = getFreshness(listing.last_confirmed_at, policy);
  const availableNow = new Date(listing.available_from) <= new Date();
  const body = (
    <>
      <div className="lcard__photo">
        {photo ? <img src={photo.url} alt={photo.alt} loading="lazy" width={640} height={480} /> : <div className="ph">No photo available</div>}
        <div className="lcard__flags">
          <span className="badge badge--dark">{t.labels.contributor[listing.contributor_type]}</span>
          {listing.is_demo && <span className="badge badge--demo">Demo</span>}
        </div>
      </div>
      <div className="lcard__body">
        <div className="lcard__rent">{formatRupees(listing.rent_inr)} <small>/ month</small></div>
        <div className="lcard__title">{listing.title}</div>
        <div className="lcard__meta">
          {listing.locality}, {listing.city} · {t.labels.accommodation[listing.accommodation_type]}
        </div>
        <div className="lcard__meta">
          {availableNow ? 'Available now' : `Available from ${formatDate(listing.available_from)}`}
        </div>
        <div className="lcard__costs">
          <span>{describeDeposit(listing.deposit_inr)}</span>
          <span>{describeBrokerage(listing.brokerage_status, listing.brokerage_amount_inr)}</span>
        </div>
        <div className="lcard__fresh">
          <span className="badge badge--outline">✓ Submission reviewed</span>{' '}
          <span className={`badge ${fresh.level === 'confirmed_recently' ? '' : 'badge--warn'}`}>
            {listing.last_confirmed_at ? `${t.freshness[fresh.level]}` : t.freshness.unconfirmed}
          </span>
        </div>
      </div>
    </>
  );
  return preview ? (
    <div className="card lcard">{body}</div>
  ) : (
    <Link href={`/rentals/${listing.slug}`} className="card lcard">{body}</Link>
  );
}
