import type { Metadata } from 'next';
import { ListingForm } from '@/components/forms/ListingForm';

export const metadata: Metadata = { title: 'List a property' };

export default function Page() {
  return (
    <div className="narrow">
      <div className="page-head">
        <p className="eyebrow">Contribute · Property</p>
        <h1>List a property</h1>
        <p className="lede">Reviewed before it is public. Your photos, exact address and contact details stay private unless you choose otherwise.</p>
      </div>
      <div style={{ paddingBottom: 72 }}><ListingForm mode="property" /></div>
    </div>
  );
}
