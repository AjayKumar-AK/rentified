'use client';

import Link from 'next/link';
import { submitRequirement } from '@/app/actions/requirements';
import { t } from '@/messages';
import * as C from '@/lib/constants';
import { ChipGroup, Consent, FormSummary, Honeypot, Select, TextArea, TextInput } from '@/components/forms/fields';
import { useServerForm } from '@/components/forms/useServerForm';

const opts = <T extends string>(values: readonly T[], labels: Record<T, string>) => values.map((v) => ({ value: v, label: labels[v] }));

export function RequirementForm() {
  const { state, pending, onSubmit, formRef } = useServerForm(submitRequirement);
  const e = state.errors ?? {};

  if (state.status === 'success') {
    return (
      <div className="stack" role="status">
        <div className="alert alert--ok">
          <h2 style={{ fontSize: '1.7rem' }}>Your requirement is saved.</h2>
          <p><strong>What happens next:</strong> it is stored privately and will not be shown to the public. People running Nook rentals may read it to understand what renters need and which listings to look for.</p>
          <p><strong>What does not happen:</strong> we do not send alerts, match you automatically, or contact you unless you ticked the box allowing it — and even then we cannot promise a reply or a result. Meanwhile, you can browse approved listings yourself.</p>
        </div>
        <div className="btn-row">
          <Link className="btn btn--primary" href="/rentals">Browse rentals</Link>
          <Link className="btn btn--ghost" href="/roommates">Look at roommate profiles</Link>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="form" noValidate>
      <Honeypot />
      <FormSummary state={state} />
      <fieldset className="fieldset">
        <legend>What are you looking for?</legend>
        <div className="fields">
          <TextInput id="city" label="City" required error={e.city} />
          <TextInput id="preferred_localities" label="Preferred localities" optional error={e.preferred_localities} hint="Separate with commas." />
          <TextInput id="budget_min_inr" label="Budget from (₹/month)" inputMode="numeric" optional error={e.budget_min_inr} />
          <TextInput id="budget_max_inr" label="Budget up to (₹/month)" inputMode="numeric" required error={e.budget_max_inr} />
          <TextInput id="move_in_date" label="Move-in date" type="date" required error={e.move_in_date} defaultValue={new Date().toISOString().slice(0, 10)} />
          <Select id="furnishing_pref" label="Furnishing" defaultValue="not_specified" options={[...opts(C.FURNISHING_STATUSES.filter((f) => f !== 'not_specified'), t.labels.furnishing), { value: 'not_specified', label: 'No preference' }]} error={e.furnishing_pref} />
          <Select id="brokerage_pref" label="Brokerage" defaultValue="no_preference" options={opts(C.BROKERAGE_PREFERENCES, t.labels.brokeragePref)} error={e.brokerage_pref} />
          <ChipGroup name="accommodation_types" legend="Accommodation types (choose at least one)" options={opts(C.ACCOMMODATION_TYPES, t.labels.accommodation)} error={e.accommodation_types} />
          <TextArea id="notes" label="Anything else?" optional maxLength={800} rows={4} error={e.notes} hint="e.g. near a metro station, pet-friendly. Please don’t include sensitive details such as religion or caste." />
        </div>
      </fieldset>
      <fieldset className="fieldset">
        <legend>How to reach you</legend>
        <p className="fieldset__hint">Private. Never shown publicly.</p>
        <div className="fields">
          <TextInput id="contact_name" label="Name" optional autoComplete="name" error={e.contact_name} />
          <Select id="contact_method" label="Preferred contact method" defaultValue="whatsapp" options={opts(C.CONTACT_METHODS, t.labels.contactMethod)} error={e.contact_method} />
          <TextInput id="contact_value" label="Phone number or email" required error={e.contact_value} />
        </div>
      </fieldset>
      <fieldset className="fieldset">
        <legend>Consent</legend>
        <div className="stack">
          <Consent name="consent_processing" error={e.consent_processing} label="I agree that Nook rentals may store and process this requirement." detail={<>See the <Link href="/privacy">privacy policy</Link>.</>} />
          <Consent name="consent_contact_me" label="Optional: you may contact me if a relevant listing is shared." detail="This is permission only — it is not a promise that we will contact you." />
        </div>
      </fieldset>
      <div className="btn-row">
        <button type="submit" className="btn btn--primary" disabled={pending}>{pending ? 'Saving…' : 'Save my requirement'}</button>
      </div>
    </form>
  );
}
