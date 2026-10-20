import type { Metadata } from 'next';
import Link from 'next/link';
import { POLICY_VERSION } from '@/lib/constants';

export const metadata: Metadata = { title: 'Privacy' };

export default function PrivacyPage() {
  return (
    <div className="narrow prose" style={{ paddingBottom: 80 }}>
      <div className="page-head">
        <p className="eyebrow">Privacy</p>
        <h1>How we handle your information</h1>
        <p className="muted small">Policy version {POLICY_VERSION}</p>
      </div>
      <div className="alert alert--info">
        This is a plain-language policy for an early experiment. It has <strong>not yet had a legal review</strong> for Indian data-protection, consumer-protection or housing rules. It should be reviewed before any wide public launch.
      </div>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Rental listings:</strong> title, description, city, locality, rent and costs, photos, your name or display name, and your contact details. Optionally an exact address, which stays private.</li>
        <li><strong>Roommate-seeker profiles:</strong> display name, city, localities, budget, move-in date, preferences, introduction and contact details.</li>
        <li><strong>Renter requirements:</strong> city, budget, accommodation type, move-in date, preferences, optional notes and contact details.</li>
        <li><strong>Reports and requests:</strong> what you tell us, and your contact details only if you choose to give them.</li>
        <li><strong>Technical abuse protection:</strong> a one-way, salted hash of your network address to limit spam. We do not store the address itself.</li>
      </ul>
      <p>We do not ask for identity documents, Aadhaar, PAN, bank or payment details. Please do not send them.</p>

      <h2>What is public and what is private</h2>
      <ul>
        <li><strong>Public after approval:</strong> listing details, photos, locality and rent. For roommate profiles: display name, city, localities, budget, move-in date, preferences and introduction.</li>
        <li><strong>Private always:</strong> exact addresses, renter requirements, reports, internal moderation notes.</li>
        <li><strong>Private unless you opt in:</strong> your phone number or email. It is shown only if you tick the separate “show my contact details publicly” box. Once public, anyone — including automated scrapers — can see it.</li>
        <li>Nothing is public until a moderator approves it, and photos stay in private storage until then.</li>
      </ul>

      <h2>Why we use it</h2>
      <p>To review and publish what you submit, to let moderators follow up with you, to keep listings accurate and safe, and to understand whether the service is useful. We do not sell personal data, show advertising, or use your details for marketing.</p>

      <h2>Who can see it</h2>
      <p>Moderators we authorize; our hosting and database providers, who process data for us (Supabase and Vercel); and the public, only for the parts described above.</p>

      <h2>How long we keep it</h2>
      <p>Listings and profiles stop being public automatically if they are not reconfirmed in time. We keep a short moderation history (what changed, when, and by whom) for accountability. We have not yet set final retention periods for private records; this will be settled before wider launch, and you can ask us to delete yours at any time.</p>

      <h2>Your choices</h2>
      <p>You can ask us to <strong>correct, remove, or show you</strong> what we hold about you, or withdraw consent for public contact details, at any time. Use the <Link href="/contact?kind=removal">contact form</Link>. If you have your private management link, you can also mark a listing as no longer available yourself.</p>

      <h2>Cookies</h2>
      <p>We do not use advertising or tracking cookies. Moderators sign in using a session cookie. We do not currently run third-party analytics.</p>

      <h2>Contact</h2>
      <p>Use the <Link href="/contact">contact form</Link>.</p>
    </div>
  );
}
