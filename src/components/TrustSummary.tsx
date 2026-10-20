import { t } from '@/messages';
import { daysAgoLabel, formatDate } from '@/lib/format';
import { getFreshness, type FreshnessPolicy } from '@/lib/freshness';
import type { PublicListing } from '@/lib/types';

/** Honest, itemised trust signals. Each line states what HAS and has NOT been checked. */
export function TrustSummary({ listing, policy }: { listing: PublicListing; policy: FreshnessPolicy }) {
  const fresh = getFreshness(listing.last_confirmed_at, policy);
  const freshIcon = fresh.level === 'confirmed_recently' ? '✓' : '!';
  const freshClass = fresh.level === 'confirmed_recently' ? 'ic--yes' : 'ic--warn';
  return (
    <ul className="trust" aria-label="What has been checked">
      <li>
        <span className="ic ic--yes" aria-hidden="true">✓</span>
        <div>
          <strong>{t.trust.reviewed}</strong>
          <div className="small muted">{t.trust.reviewedHelp}</div>
          {listing.approved_at && <div className="small muted">Approved {formatDate(listing.approved_at)}</div>}
        </div>
      </li>
      <li>
        <span className={`ic ${freshClass}`} aria-hidden="true">{freshIcon}</span>
        <div>
          <strong>{t.trust.confirmed}: {listing.last_confirmed_at ? formatDate(listing.last_confirmed_at) : 'never'}</strong>
          <div className="small muted">
            {t.freshness[fresh.level]}
            {fresh.daysSince !== null ? ` (${daysAgoLabel(fresh.daysSince)})` : ''}. {t.trust.editedNote}
          </div>
        </div>
      </li>
      <li>
        <span className={`ic ${listing.identity_checked_at ? 'ic--yes' : 'ic--no'}`} aria-hidden="true">{listing.identity_checked_at ? '✓' : '–'}</span>
        <div>
          <strong>{listing.identity_checked_at ? `${t.trust.identity} on ${formatDate(listing.identity_checked_at)}` : t.trust.identityNo}</strong>
          {!listing.identity_checked_at && <div className="small muted">A phone number or email alone is not an identity check.</div>}
        </div>
      </li>
      <li>
        <span className={`ic ${listing.property_checked_at ? 'ic--yes' : 'ic--no'}`} aria-hidden="true">{listing.property_checked_at ? '✓' : '–'}</span>
        <div>
          <strong>{listing.property_checked_at ? `${t.trust.property} on ${formatDate(listing.property_checked_at)}` : t.trust.propertyNo}</strong>
          {!listing.property_checked_at && <div className="small muted">No one from Rentified has inspected this property or confirmed ownership.</div>}
        </div>
      </li>
    </ul>
  );
}
