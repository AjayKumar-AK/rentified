import { ListingCard } from '@/components/ListingCard';
import { DemoFrame } from '@/components/previews/DemoFrame';
import { demoListings } from '@/lib/demo';
import { getFreshnessPolicy } from '@/lib/config';

/** Preview 1 — rental discovery. Uses the real ListingCard. */
export function DiscoveryPreview({ count = 3 }: { count?: number }) {
  const policy = getFreshnessPolicy();
  return (
    <DemoFrame url="App Preview" label="Preview of the rental directory">
      <div aria-hidden="true" className="row" style={{ gap: 8, marginBottom: 14 }}>
        <span className="badge badge--outline">City: Example City</span>
        <span className="badge badge--outline">Up to ₹30,000</span>
        <span className="badge badge--outline">No brokerage</span>
        <span className="badge badge--outline">Any source</span>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }} aria-hidden="true">
        {demoListings().slice(0, count).map((l) => <ListingCard key={l.id} listing={l} policy={policy} preview />)}
      </div>
    </DemoFrame>
  );
}
