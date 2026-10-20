import Link from 'next/link';
import { t } from '@/messages';
import { DiscoveryPreview } from '@/components/previews/DiscoveryPreview';
import { ContributePreview } from '@/components/previews/ContributePreview';
import { TrustPreview } from '@/components/previews/TrustPreview';

const faqs: { q: string; a: string }[] = [
  { q: 'Who can contribute?', a: 'Property owners, current tenants with a room to offer, and other people who know about a genuine rental opportunity. You do not have to be the owner, but you must say honestly who you are, and the listing shows it.' },
  { q: 'Is this only for owners?', a: 'No. Owners, tenants and room providers can all share. Brokers can too, and their listings are labelled as broker listings so they are never mixed up with owner listings.' },
  { q: 'Are listings verified?', a: 'Not in the way you might hope. Every listing is reviewed by a moderator for completeness and platform rules before it is public. That review does not prove ownership, identity or that the place is still available. Each listing states separately what has actually been checked and when — and where nothing further was checked, it says so.' },
  { q: 'How is contact information handled?', a: 'Contact details you give us are private by default and visible only to moderators. They are shown publicly only if you tick a separate, optional box saying so. Exact addresses are never published by default; listings show a locality.' },
  { q: 'What happens if a listing is outdated?', a: 'Listings show the date availability was last confirmed. If it is not reconfirmed within a set time, the listing is labelled and then removed from public view automatically. Anyone can report a listing as rented or misleading, and a moderator looks at every report.' },
  { q: 'Can people find roommates here?', a: 'Yes. You can offer a room, or create a roommate-seeker profile. They are kept separate on purpose: a profile says someone is looking, it is not evidence that a room exists.' },
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div>
            <p className="eyebrow">{t.hero.eyebrow}</p>
            <h1>{t.hero.title}</h1>
            <p className="lede">{t.hero.body}</p>
            <div className="btn-row" style={{ marginTop: 28 }}>
              <Link href="/share" className="btn btn--primary">{t.hero.primary}</Link>
              <Link href="/rentals" className="btn btn--ghost">{t.hero.secondary}</Link>
            </div>
            <p className="small muted" style={{ marginTop: 18, maxWidth: '52ch' }}>{t.hero.note}</p>
          </div>
          <div><DiscoveryPreview count={2} /></div>
        </div>
      </section>

      <section className="section section--sage" aria-labelledby="discover-h">
        <div className="container">
          <p className="eyebrow">Rental discovery</p>
          <h2 id="discover-h">See the costs and the source before you call anyone.</h2>
          <p className="lede" style={{ marginBottom: 32 }}>
            Rent, deposit and brokerage are shown up front — and when someone left a field blank, it says “not specified” . Every card says who shared it and when availability was last confirmed.
          </p>
          <DiscoveryPreview count={3} />
          <div className="btn-row" style={{ marginTop: 28 }}>
            <Link href="/rentals" className="btn btn--primary">Browse approved rentals</Link>
            <Link href="/looking" className="btn btn--ghost">Register what you need</Link>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="how-h">
        <div className="container">
          <p className="eyebrow">How it works</p>
          <h2 id="how-h">Contribute, review, check, correct.</h2>
          <div className="steps" style={{ marginTop: 28 }}>
            <div className="step"><h3>People contribute</h3><p className="muted">Owners, tenants and room providers share what is available, with photos and the real costs.</p></div>
            <div className="step"><h3>We review before publishing</h3><p className="muted">Nothing is public until a moderator has looked at it. Photos and contact details stay private until then.</p></div>
            <div className="step"><h3>Checks are stated plainly</h3><p className="muted">Each listing says what has — and has not — been checked, and when availability was last confirmed.</p></div>
            <div className="step"><h3>Anyone can flag problems</h3><p className="muted">Report a listing that is rented, wrong or suspicious. Reports are private and a moderator reviews them.</p></div>
          </div>
        </div>
      </section>

      <section className="section section--forest" aria-labelledby="contrib-h">
        <div className="container two-col">
          <div>
            <p className="eyebrow">Share a rental</p>
            <h2 id="contrib-h">Have a home or a room to share? It takes a few minutes.</h2>
            <p style={{ maxWidth: '56ch' }}>
              Owners can list a property. Current tenants can offer a room. Both go through the same review. You add photos, costs and a locality — your exact address and contact details stay private unless you choose otherwise.
            </p>
            <ul style={{ paddingLeft: 18, maxWidth: '56ch' }}>
              <li>At least one photo is required, so listings are never just text.</li>
              <li>Be honest about your role: owner, tenant or broker is shown on the listing.</li>
              <li>You get a private link to confirm availability or mark it taken — no account needed.</li>
            </ul>
            <div className="btn-row" style={{ marginTop: 20 }}>
              <Link href="/share/property" className="btn btn--accent">List a property</Link>
              <Link href="/share/room" className="btn btn--ghost" style={{ color: '#fff', borderColor: '#fff' }}>Offer a room</Link>
            </div>
          </div>
          <ContributePreview />
        </div>
      </section>

      <section className="section" aria-labelledby="mate-h">
        <div className="container two-col">
          <div>
            <p className="eyebrow">Roommates</p>
            <h2 id="mate-h">Offering a room and looking for one are different things.</h2>
            <p className="lede">
              If you have a room, share it as a listing and it is reviewed like any other. If you are looking for a room or a roommate, create a roommate-seeker profile instead. Profiles are kept separate and clearly labelled — a profile shows that someone is searching, not that a place exists.
            </p>
            <div className="btn-row" style={{ marginTop: 16 }}>
              <Link href="/roommates" className="btn btn--primary">See roommate seekers</Link>
              <Link href="/roommates/new" className="btn btn--ghost">Create a profile</Link>
            </div>
          </div>
          <div className="card card--pad stack">
            <div className="row"><span className="badge badge--dark">Listing</span><strong>A room that exists</strong></div>
            <p className="muted small" style={{ margin: 0 }}>Has photos, rent, a locality and a confirmed-available date. Reviewed and reported like any rental.</p>
            <hr style={{ border: 0, borderTop: '1px dashed var(--line-strong)', width: '100%' }} />
            <div className="row"><span className="badge badge--outline">Seeker profile</span><strong>A person who is looking</strong></div>
            <p className="muted small" style={{ margin: 0 }}>Has a budget, preferences and a short introduction. Contact details are private unless the person opts in.</p>
          </div>
        </div>
      </section>

      <section className="section section--sage" aria-labelledby="trust-h">
        <div className="container two-col">
          <TrustPreview />
          <div>
            <p className="eyebrow">Trust &amp; freshness</p>
            <h2 id="trust-h">We tell you what has been checked — not just “verified”.</h2>
            <p className="lede">There is deliberately no single “verified” badge. Four things are tracked separately:</p>
            <ul>
              <li><strong>Submission reviewed</strong> — a moderator checked completeness and rules. It does not prove ownership or availability.</li>
              <li><strong>Availability confirmed</strong> — the date the responsible person last said it is still free.</li>
              <li><strong>Identity / property checked</strong> — shown only if a real check was done and recorded. Usually, they will say “not checked”.</li>
              <li><strong>Community reports</strong> — private flags reviewed by a moderator; never shown as accusations.</li>
            </ul>
            <p className="muted">Listings that are not reconfirmed in time are labelled, then dropped from public view. Time limits are configurable.</p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="faq-h">
        <div className="narrow">
          <p className="eyebrow">Questions</p>
          <h2 id="faq-h">Frequently asked questions</h2>
          <div className="faq">
            {faqs.map((f) => (
              <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
            ))}
          </div>
          <p className="muted" style={{ marginTop: 24 }}>More in the <Link href="/help">help centre</Link>, or <Link href="/contact">send feedback</Link>.</p>
        </div>
      </section>
    </>
  );
}
