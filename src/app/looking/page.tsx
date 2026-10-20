import type { Metadata } from 'next';
import { RequirementForm } from '@/components/forms/RequirementForm';

export const metadata: Metadata = { title: 'Looking for a place' };

export default function Page() {
  return (
    <div className="narrow">
      <div className="page-head">
        <p className="eyebrow">Renters</p>
        <h1>Looking for a place?</h1>
        <p className="lede">Browse approved rentals any time — no sign-up needed. You can also register what you need. It stays private and helps us see where renters are looking. We do not send alerts or match you automatically.</p>
      </div>
      <div style={{ paddingBottom: 72 }}><RequirementForm /></div>
    </div>
  );
}
