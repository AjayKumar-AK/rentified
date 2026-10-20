import type { Metadata } from 'next';
import { DataRequestForm } from '@/components/forms/DataRequestForm';
import { DATA_REQUEST_KINDS } from '@/lib/constants';

export const metadata: Metadata = { title: 'Contact & feedback' };

export default async function ContactPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const kindRaw = Array.isArray(sp.kind) ? sp.kind[0] : sp.kind;
  const refRaw = Array.isArray(sp.ref) ? sp.ref[0] : sp.ref;
  const kind = (DATA_REQUEST_KINDS as readonly string[]).includes(kindRaw ?? '') ? (kindRaw as string) : 'feedback';
  return (
    <div className="narrow" style={{ paddingBottom: 80 }}>
      <div className="page-head">
        <p className="eyebrow">Contact</p>
        <h1>Contact &amp; feedback</h1>
        <p className="lede">Send feedback, or ask us to correct, remove or show you the information we hold about you. A person reads every message; we have not set a guaranteed response time.</p>
      </div>
      <DataRequestForm defaultKind={kind} defaultRef={(refRaw ?? '').slice(0, 200)} />
    </div>
  );
}
