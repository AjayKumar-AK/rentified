import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Help' };

const items: { q: string; a: React.ReactNode }[] = [
  { q: 'How do I share a rental?', a: <>Go to <Link href="/share">Share a rental</Link>, choose a property or a room, add photos and details, and submit. A moderator reviews it before it becomes public.</> },
  { q: 'How long does review take?', a: 'We have not set a guaranteed time. This is a small early project run by people, so please be patient.' },
  { q: 'I submitted a listing. How do I confirm it is still available?', a: 'Use the private management link shown once after you submitted. It lets you confirm availability, mark the place as taken, or respond to a request for changes. We cannot recover a lost link.' },
  { q: 'What do the trust labels mean?', a: '“Submission reviewed” means a moderator checked completeness and rules. “Last confirmed available” is the date someone responsible last said the place is free. “Identity checked” and “Property checked” appear only when a real, recorded check happened — most listings will say not checked. None of this guarantees a listing is genuine.' },
  { q: 'Why is there no contact button on some listings?', a: 'Contributors choose whether to show contact details publicly. If they did not, there is no way to contact them through the listing yet.' },
  { q: 'How do I report a problem?', a: 'Open the listing and use “Report this listing”. Reports are private and reviewed by a moderator.' },
  { q: 'How do I remove or correct my information?', a: <>Use the <Link href="/contact?kind=removal">contact form</Link>, or use your private management link to take a listing down.</> },
  { q: 'Staying safe', a: 'Meet in person and see the property before paying anything. Be wary of anyone who rushes you, asks for advance payment, or will not meet. Ask to see ownership or authority to rent. Report anything suspicious.' },
];

export default function HelpPage() {
  return (
    <div className="narrow" style={{ paddingBottom: 80 }}>
      <div className="page-head"><p className="eyebrow">Help</p><h1>Help centre</h1></div>
      <div className="faq">
        {items.map((i) => <details key={i.q}><summary>{i.q}</summary><p>{i.a}</p></details>)}
      </div>
      <p className="muted" style={{ marginTop: 24 }}>Still stuck? <Link href="/contact">Contact us</Link>.</p>
    </div>
  );
}
