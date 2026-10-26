'use client';

import Link from 'next/link';
import { submitRoommateProfile } from '@/app/actions/roommates';
import { t } from '@/messages';
import * as C from '@/lib/constants';
import { ChipGroup, Consent, FormSummary, Honeypot, Select, TextArea, TextInput } from '@/components/forms/fields';
import { useServerForm } from '@/components/forms/useServerForm';

const opts = <T extends string>(values: readonly T[], labels: Record<T, string>) => values.map((v) => ({ value: v, label: labels[v] }));

export function RoommateForm() {
  const { state, pending, onSubmit, formRef } = useServerForm(submitRoommateProfile);
  const e = state.errors ?? {};

  if (state.status === 'success') {
    return (
      <div className="stack" role="status">
        <div className="alert alert--ok">
          <h2 style={{ fontSize: '1.7rem' }}>Your profile is in the review queue.</h2>
          <p>It is private for now. Once a moderator approves it, the public parts you agreed to will appear on the roommates page for a limited time. We do not match people automatically or contact anyone on your behalf.</p>
        </div>
        <div className="btn-row">
          <Link className="btn btn--primary" href="/roommates">See roommate seekers</Link>
          <Link className="btn btn--ghost" href="/rentals">Browse rentals</Link>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="form" noValidate>
      <Honeypot />
      <FormSummary state={state} />
      <div className="alert alert--info">
        <strong>A profile is not a property listing.</strong> It says someone is looking — it does not show that a room exists. If you have a room to offer, <Link href="/share/room">share a room instead</Link>.
      </div>

      <fieldset className="fieldset">
        <legend>About what you need</legend>
        <div className="fields">
          <Select id="seeking" label="I am" required defaultValue="room" options={opts(C.SEEKING_TYPES, t.labels.seeking)} error={e.seeking} />
          <TextInput id="display_name" label="Display name" required maxLength={40} error={e.display_name} hint="Shown publicly after approval. A first name is enough." />
          <TextInput id="city" label="City" required error={e.city} />
          <TextInput id="preferred_localities" label="Preferred localities" optional error={e.preferred_localities} hint="Separate with commas, e.g. Adyar, Velachery" />
          <TextInput id="budget_min_inr" label="Budget from (₹/month)" inputMode="numeric" optional error={e.budget_min_inr} />
          <TextInput id="budget_max_inr" label="Budget up to (₹/month)" inputMode="numeric" required error={e.budget_max_inr} />
          <TextInput id="move_in_date" label="Preferred move-in date" type="date" required error={e.move_in_date} defaultValue={new Date().toISOString().slice(0, 10)} />
          <Select id="accommodation_type" label="Accommodation type" optional placeholder="Any" options={opts(C.ACCOMMODATION_TYPES, t.labels.accommodation)} error={e.accommodation_type} />
          <Select id="sharing_preference" label="Room sharing" defaultValue="either" options={opts(C.SHARING_PREFERENCES, t.labels.sharing)} error={e.sharing_preference} />
          <ChipGroup name="lifestyle" legend="Lifestyle (optional)" hint="Only tick what you are comfortable sharing publicly." options={opts(C.LIFESTYLE_TAGS, t.labels.lifestyle)} />
          <TextArea id="introduction" label="Short introduction" required maxLength={600} rows={5} error={e.introduction} hint="Shown publicly after approval. 20–600 characters. Don’t include phone numbers, addresses or your workplace." />
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>How to reach you</legend>
        <p className="fieldset__hint">Kept private by default. Moderators see it; other visitors do not unless you opt in below.</p>
        <div className="fields">
          <Select id="contact_method" label="Preferred contact method" required defaultValue="whatsapp" options={opts(C.CONTACT_METHODS, t.labels.contactMethod)} error={e.contact_method} />
          <TextInput id="contact_value" label="Phone number or email" required error={e.contact_value} />
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>What becomes public</legend>
        <p className="fieldset__hint">
          After approval, these are shown: display name, city, localities, budget, move-in date, preferences and your introduction. Profiles are removed automatically after a limited time.
        </p>
        <div className="stack">
          <Consent name="consent_processing" error={e.consent_processing} label="I agree that Nook rentals may store and process my details to review this profile." detail={<>See the <Link href="/privacy">privacy policy</Link>.</>} />
          <Consent name="consent_public_profile" error={e.consent_public_profile} label="I agree to the public parts of this profile being shown once approved." />
          <Consent name="consent_public_contact" tone="public" label="Optional: also show my contact details publicly." detail="Anyone on the internet could see them, including scrapers. Leave unticked to keep your contact private." />
        </div>
      </fieldset>

      <div className="btn-row">
        <button type="submit" className="btn btn--primary" disabled={pending}>{pending ? 'Submitting…' : 'Submit profile for review'}</button>
      </div>
    </form>
  );
}
