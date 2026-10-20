import type { Metadata } from 'next';
import { ListingForm } from '@/components/forms/ListingForm';

export const metadata: Metadata = { title: 'Offer a room' };

export default function Page() {
  return (
    <div className="narrow">
      <div className="page-head">
        <p className="eyebrow">Contribute · Room</p>
        <h1>Offer a room</h1>
        <p className="lede">You do not have to be the owner — just say who you are. Reviewed before it is public.</p>
      </div>
      <div style={{ paddingBottom: 72 }}><ListingForm mode="room" /></div>
    </div>
  );
}
