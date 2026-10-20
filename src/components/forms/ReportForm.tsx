'use client';

import { submitReport } from '@/app/actions/reports';
import { t } from '@/messages';
import * as C from '@/lib/constants';
import { Consent, FormSummary, Honeypot, Select, TextArea, TextInput } from '@/components/forms/fields';
import { useServerForm } from '@/components/forms/useServerForm';

export function ReportForm({ slug }: { slug: string }) {
  const { state, pending, onSubmit, formRef } = useServerForm(submitReport);
  const e = state.errors ?? {};

  if (state.status === 'success') return <div className="alert alert--ok" role="status">{state.message}</div>;

  return (
    <form ref={formRef} onSubmit={onSubmit} className="stack" noValidate>
      <Honeypot />
      <input type="hidden" name="listing_slug" value={slug} />
      <FormSummary state={state} />
      <Select id="report_category" name="category" label="What is the problem?" required placeholder="Choose…" error={e.category}
        options={C.REPORT_CATEGORIES.map((v) => ({ value: v, label: t.labels.report[v] }))} />
      <TextArea id="report_description" name="description" label="Details" optional maxLength={1000} rows={4} error={e.description} hint="Facts help most (e.g. “the owner told me it was rented on 12 Oct”). Reports are private and are not shown on the listing." />
      <TextInput id="reporter_contact" label="Your email or phone" optional error={e.reporter_contact} hint="Only if you are happy for a moderator to follow up." />
      <Consent name="contact_consent" label="You may contact me about this report." error={e.contact_consent} />
      <div className="btn-row">
        <button type="submit" className="btn btn--accent" disabled={pending}>{pending ? 'Sending…' : 'Send report'}</button>
      </div>
    </form>
  );
}
