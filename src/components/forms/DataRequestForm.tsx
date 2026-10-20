'use client';

import { submitDataRequest } from '@/app/actions/requests';
import { t } from '@/messages';
import * as C from '@/lib/constants';
import { FormSummary, Honeypot, Select, TextArea, TextInput } from '@/components/forms/fields';
import { useServerForm } from '@/components/forms/useServerForm';

export function DataRequestForm({ defaultKind = 'feedback', defaultRef = '' }: { defaultKind?: string; defaultRef?: string }) {
  const { state, pending, onSubmit, formRef } = useServerForm(submitDataRequest);
  const e = state.errors ?? {};
  if (state.status === 'success') return <div className="alert alert--ok" role="status">{state.message}</div>;
  return (
    <form ref={formRef} onSubmit={onSubmit} className="stack" noValidate>
      <Honeypot />
      <FormSummary state={state} />
      <Select id="kind" label="What do you need?" required defaultValue={defaultKind} error={e.kind} options={C.DATA_REQUEST_KINDS.map((v) => ({ value: v, label: t.labels.requestKind[v] }))} />
      <TextInput id="listing_ref" label="Link to the listing" optional defaultValue={defaultRef} error={e.listing_ref} hint="If this is about a listing, paste its web address." />
      <TextArea id="message" label="Message" required maxLength={1500} rows={5} error={e.message} />
      <TextInput id="contact_value" label="Your email or phone" optional error={e.contact_value} hint="Required for correction, removal and access requests so we can reach you and check it is really you." />
      <div className="btn-row"><button type="submit" className="btn btn--primary" disabled={pending}>{pending ? 'Sending…' : 'Send'}</button></div>
    </form>
  );
}
