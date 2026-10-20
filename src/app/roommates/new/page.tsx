import type { Metadata } from 'next';
import { RoommateForm } from '@/components/forms/RoommateForm';

export const metadata: Metadata = { title: 'Create a roommate profile' };

export default function Page() {
  return (
    <div className="narrow">
      <div className="page-head">
        <p className="eyebrow">Roommates</p>
        <h1>Create a roommate-seeker profile</h1>
        <p className="lede">Tell people what you are looking for. Reviewed before it is public, and removed automatically after a limited time.</p>
      </div>
      <div style={{ paddingBottom: 72 }}><RoommateForm /></div>
    </div>
  );
}
