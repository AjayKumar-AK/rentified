import type { Metadata } from 'next';
import Link from 'next/link';
import { POLICY_VERSION } from '@/lib/constants';

export const metadata: Metadata = { title: 'Terms' };

export default function TermsPage() {
  return (
    <div className="narrow prose" style={{ paddingBottom: 80 }}>
      <div className="page-head">
        <p className="eyebrow">Terms</p>
        <h1>Terms of use</h1>
        <p className="muted small">Version {POLICY_VERSION}</p>
      </div>
      <div className="alert alert--info">
        These plain-language terms are for an early experiment and have <strong>not yet had a legal review</strong>. They should be reviewed before any wide public launch.
      </div>

      <h2>What Rentified is</h2>
      <p>A community-contributed directory of rental information. We are not a broker, agent, landlord or party to any rental. We do not handle rent, deposits or bookings and you should never pay a deposit or advance before seeing a property in person and meeting the person who has the right to rent it out.</p>

      <h2>No guarantee of accuracy or availability</h2>
      <p>Listings are submitted by third parties. A moderator reviews each listing for completeness and platform rules; that does not verify ownership, identity, accuracy or availability. Labels such as “identity checked” or “property checked” appear only where a documented check was actually carried out. Coverage is limited and may be unavailable in your area.</p>

      <h2>If you contribute</h2>
      <ul>
        <li>Be truthful, including about whether you are the owner, a tenant or a broker.</li>
        <li>Only share what you have the right to share, including photos.</li>
        <li>Do not post misleading prices, fake or duplicate listings, content that discriminates, or other people’s personal details.</li>
        <li>Keep your listing current. Mark it unavailable once it is taken.</li>
        <li>You keep ownership of your content and give us permission to display it on the service while it is live.</li>
      </ul>

      <h2>What we may do</h2>
      <p>We may reject, edit-by-request, unpublish or remove content, and block abuse, at our discretion and without notice where needed to protect people or the service.</p>

      <h2>Reporting</h2>
      <p>Anyone can report a listing. Reports are private and are a prompt for review, not a finding of wrongdoing.</p>

      <h2>Liability</h2>
      <p>The service is provided “as is” during this early version. To the extent permitted by law, we are not responsible for losses arising from dealings between users. This section needs legal review before launch.</p>

      <h2>Contact</h2>
      <p>Use the <Link href="/contact">contact form</Link>.</p>
    </div>
  );
}
