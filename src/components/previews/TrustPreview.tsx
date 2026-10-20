import { DemoFrame } from '@/components/previews/DemoFrame';
import { TrustSummary } from '@/components/TrustSummary';
import { demoListings } from '@/lib/demo';
import { getFreshnessPolicy } from '@/lib/config';

/** Preview 3 — listing trust & freshness. Uses the real TrustSummary. */
export function TrustPreview() {
  const listing = demoListings()[0];
  return (
    <DemoFrame url="App Preview / example" label="Preview of a listing's trust details">
      <div aria-hidden="true" className="stack" style={{ gap: 12 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <div className="lcard__rent">₹28,000 <small>/ month</small></div>
            <div className="lcard__meta">Sample Nagar, Example City · Shared by the owner</div>
          </div>
          <span className="badge badge--demo">Demo</span>
        </div>
        <TrustSummary listing={listing} policy={getFreshnessPolicy()} />
        <div className="row">
          <span className="btn btn--ghost btn--sm" style={{ pointerEvents: 'none' }}>⚑ Report this listing</span>
          <span className="small muted">Reports are private and reviewed by a moderator.</span>
        </div>
      </div>
    </DemoFrame>
  );
}
