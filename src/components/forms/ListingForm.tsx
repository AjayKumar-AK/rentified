'use client';

import Link from 'next/link';
import { useState } from 'react';
import { submitListing } from '@/app/actions/listings';
import { t } from '@/messages';
import * as C from '@/lib/constants';
import { ChipGroup, Consent, FormSummary, Honeypot, Select, TextArea, TextInput } from '@/components/forms/fields';
import { PhotoUploader } from '@/components/forms/PhotoUploader';
import { useServerForm } from '@/components/forms/useServerForm';

type Mode = 'property' | 'room';

const opts = <T extends string>(values: readonly T[], labels: Record<T, string>) => values.map((v) => ({ value: v, label: labels[v] }));

export function ListingForm({ mode }: { mode: Mode }) {
  const [uploading, setUploading] = useState(false);
  const { state, pending, onSubmit, formRef } = useServerForm(submitListing);
  const e = state.errors ?? {};
  const isRoom = mode === 'room';

  if (state.status === 'success') return <SubmittedPanel token={state.reconfirmToken} />;

  const contributorOptions = isRoom
    ? [{ value: 'tenant', label: 'I am a current tenant' }, { value: 'owner', label: 'I am the owner' }, { value: 'other', label: 'Another legitimate contributor' }]
    : [{ value: 'owner', label: 'I am the owner' }, { value: 'broker', label: 'I am a broker or agent' }, { value: 'other', label: 'Another legitimate contributor' }];

  return (
    <form ref={formRef} onSubmit={onSubmit} className="form" noValidate>
      <input type="hidden" name="listing_type" value={mode} />
      <Honeypot />
      <FormSummary state={state} />

      <fieldset className="fieldset">
        <legend>Who is sharing this?</legend>
        <p className="fieldset__hint">
          Be honest about your role. It is shown on the listing so renters know who the information comes from. You do not need to be the owner.
        </p>
        <div className="fields">
          <Select id="contributor_type" label="Your role" options={contributorOptions} required error={e.contributor_type} defaultValue={contributorOptions[0].value} />
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>The place</legend>
        <div className="fields">
          <TextInput id="title" label="Short title" hint="e.g. “Sunny 2BHK near the lake”" required maxLength={90} error={e.title} />
          <Select
            id="accommodation_type" label={isRoom ? 'Room type' : 'Home type'} required placeholder="Choose…" error={e.accommodation_type}
            options={opts(isRoom ? C.ROOM_ACCOMMODATION_TYPES : C.PROPERTY_ACCOMMODATION_TYPES, t.labels.accommodation)}
          />
          <TextInput id="city" label="City" required autoComplete="address-level2" error={e.city} />
          <TextInput id="locality" label="Locality / neighbourhood" required error={e.locality} hint="This is shown publicly." />
          <TextInput
            id="public_location_text" label="Public location text" optional maxLength={140} error={e.public_location_text}
            hint="Defaults to “locality, city”. You may add a landmark (e.g. “near Metro station”). Do not enter your house number."
          />
          <TextInput
            id="private_address" label="Exact address" optional maxLength={250} error={e.private_address}
            hint="Private. Only moderators can see it, to check for duplicates. It is never shown publicly."
          />
          <TextArea id="description" label="Description" required maxLength={2000} rows={6} error={e.description} hint="Describe the place, the building, nearby facilities and house rules. 20–2000 characters. Do not put phone numbers here." />
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Rent and costs</legend>
        <p className="fieldset__hint">Leave a field blank if you don’t know — we will show “not specified”, not zero.</p>
        <div className="fields">
          <TextInput id="rent_inr" label="Monthly rent (₹)" inputMode="numeric" required error={e.rent_inr} />
          <TextInput id="deposit_inr" label="Security deposit (₹)" inputMode="numeric" optional error={e.deposit_inr} hint="Enter 0 only if there is genuinely no deposit." />
          <Select
            id="brokerage_status" label="Brokerage" required defaultValue="not_specified" error={e.brokerage_status}
            options={[{ value: 'none', label: 'No brokerage' }, { value: 'applies', label: 'Brokerage applies' }, { value: 'not_specified', label: 'Not specified' }]}
          />
          <TextInput id="brokerage_amount_inr" label="Brokerage amount (₹)" inputMode="numeric" optional error={e.brokerage_amount_inr} hint="Only if brokerage applies." />
          <TextInput id="available_from" label="Available from" type="date" required error={e.available_from} defaultValue={new Date().toISOString().slice(0, 10)} />
          <Select id="furnishing" label="Furnishing" defaultValue="not_specified" options={opts(C.FURNISHING_STATUSES, t.labels.furnishing)} error={e.furnishing} />
          <TextInput id="bedrooms" label={isRoom ? 'Bedrooms in the home' : 'Bedrooms'} inputMode="numeric" optional error={e.bedrooms} />
          <TextInput id="bathrooms" label="Bathrooms" inputMode="numeric" optional error={e.bathrooms} />
          <ChipGroup name="amenities" legend="Facilities" options={opts(C.AMENITIES, t.labels.amenity)} error={e.amenities} />
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Photos</legend>
        <PhotoUploader error={e.photo_names ?? e.upload_session_id} onBusyChange={setUploading} />
      </fieldset>

      <fieldset className="fieldset">
        <legend>Contact details</legend>
        <p className="fieldset__hint">
          Moderators use this to follow up with you. It is <strong>not published</strong> unless you tick the separate public-contact box below.
        </p>
        <div className="fields">
          <TextInput id="contributor_display_name" label="Your name (or display name)" required autoComplete="name" error={e.contributor_display_name} />
          <Select id="contact_method" label="Preferred contact method" required defaultValue="phone" options={opts(C.CONTACT_METHODS, t.labels.contactMethod)} error={e.contact_method} />
          <TextInput id="contact_value" label="Phone number or email" required autoComplete="tel" error={e.contact_value} hint="Indian mobile number or email address." />
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Consent</legend>
        <div className="stack">
          <Consent name="consent_processing" error={e.consent_processing}
            label="I agree that Nook rentals may store and process what I have submitted in order to review and publish this listing."
            detail={<>See the <Link href="/privacy">privacy policy</Link>. You can ask for correction or removal at any time.</>} />
          <Consent name="consent_photo_rights" error={e.consent_photo_rights}
            label="I confirm I have the right to share these photos and this information about the property." />
          <Consent name="consent_public_contact" tone="public"
            label="Optional: show my contact details publicly on the approved listing."
            detail="If you leave this unticked, your contact details stay private and renters will not see a contact button. Anyone on the internet could see public contact details, including scrapers." />
        </div>
      </fieldset>

      <div className="btn-row">
        <button type="submit" className="btn btn--primary" disabled={pending || uploading} aria-disabled={pending || uploading}>
          {pending ? 'Submitting…' : uploading ? 'Waiting for photos to upload…' : 'Submit for review'}
        </button>
      </div>
      <p className="small muted">
        Your listing stays private until a moderator approves it. Review checks completeness and rules — it does not prove ownership or availability.
      </p>
    </form>
  );
}

function SubmittedPanel({ token }: { token?: string }) {
  const [copied, setCopied] = useState(false);
  const link = token && typeof window !== 'undefined' ? `${window.location.origin}/manage/${token}` : token ? `/manage/${token}` : null;
  return (
    <div className="stack" role="status">
      <div className="alert alert--ok">
        <h2 style={{ fontSize: '1.7rem' }}>Thank you — your listing is in the review queue.</h2>
        <p>It is private for now. A moderator will check it for completeness and platform rules. If something needs fixing, you can correct it using the private link below.</p>
      </div>
      {link && (
        <div className="card card--pad stack">
          <h3>Save your private management link</h3>
          <p className="muted">
            This link lets you confirm the place is still available, mark it as taken, or answer a moderator’s request for changes — without an account.
            <strong> It is shown only once and we cannot show it again.</strong> Anyone with the link can manage this listing, so keep it private.
          </p>
          <input className="input" readOnly value={link} aria-label="Private management link" onFocus={(e) => e.currentTarget.select()} />
          <div className="btn-row">
            <button type="button" className="btn btn--accent btn--sm" onClick={() => navigator.clipboard?.writeText(link).then(() => setCopied(true))}>
              {copied ? 'Copied' : 'Copy link'}
            </button>
            <a className="btn btn--ghost btn--sm" href={`mailto:?subject=${encodeURIComponent('My Nook rentals management link')}&body=${encodeURIComponent(link)}`}>Email it to myself</a>
          </div>
        </div>
      )}
      <div className="btn-row">
        <Link className="btn btn--primary" href="/rentals">Browse rentals</Link>
        <Link className="btn btn--ghost" href="/share">Share another</Link>
      </div>
    </div>
  );
}
