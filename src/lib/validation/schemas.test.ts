import { describe, expect, it } from 'vitest';
import {
  createListingSchema,
  createRequirementSchema,
  createRoommateSchema,
  dataRequestSchema,
  formDataToRaw,
  reportSchema,
  zodErrors,
} from '@/lib/validation/schemas';

const NOW = new Date('2026-10-13T06:00:00Z');
const UUID = '3b241101-e2bb-4255-8caf-4136c566a962';
const PHOTO = `${UUID}.jpg`;

const validListing = () => ({
  listing_type: 'property',
  contributor_type: 'owner',
  title: 'Bright 2BHK near the park',
  description: 'A bright two-bedroom flat on the second floor with a balcony.',
  city: 'Bengaluru',
  locality: 'Koramangala',
  public_location_text: '',
  private_address: '',
  accommodation_type: 'apartment',
  rent_inr: '32000',
  deposit_inr: '',
  brokerage_status: 'none',
  brokerage_amount_inr: '',
  available_from: '2026-11-01',
  furnishing: 'semi_furnished',
  bedrooms: '2',
  bathrooms: '2',
  amenities: ['parking', 'lift'],
  contributor_display_name: 'Test Owner',
  contact_method: 'phone',
  contact_value: '98765 43210',
  consent_processing: 'on',
  consent_photo_rights: 'on',
  upload_session_id: UUID,
  photo_names: JSON.stringify([PHOTO]),
});

describe('listing schema', () => {
  const schema = createListingSchema(NOW);

  it('accepts a valid owner listing and normalizes it', () => {
    const r = schema.safeParse(validListing());
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.rent_inr).toBe(32000);
    expect(r.data.deposit_inr).toBeUndefined(); // "not specified" stays undefined, never 0
    expect(r.data.contact_value).toBe('+919876543210');
    expect(r.data.public_location_text).toBe('Koramangala, Bengaluru');
    expect(r.data.consent_public_contact).toBe(false); // never defaults to true
    expect(r.data.photo_names).toEqual([PHOTO]);
  });

  it('treats a deposit of 0 as 0 (distinct from not specified)', () => {
    const r = schema.safeParse({ ...validListing(), deposit_inr: '0' });
    expect(r.success && r.data.deposit_inr).toBe(0);
  });

  it('ignores any client-supplied status', () => {
    const r = schema.safeParse({ ...validListing(), status: 'approved' });
    expect(r.success).toBe(true);
    if (r.success) expect('status' in r.data).toBe(false);
  });

  it('requires both mandatory consents', () => {
    const r = schema.safeParse({ ...validListing(), consent_processing: '', consent_photo_rights: '' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const e = zodErrors(r.error);
      expect(e.consent_processing).toBeTruthy();
      expect(e.consent_photo_rights).toBeTruthy();
    }
  });

  it('requires at least one photo and rejects forged photo names', () => {
    const none = schema.safeParse({ ...validListing(), photo_names: '[]' });
    expect(none.success).toBe(false);
    const forged = schema.safeParse({ ...validListing(), photo_names: JSON.stringify(['../../etc/passwd']) });
    expect(forged.success).toBe(false);
    const broken = schema.safeParse({ ...validListing(), photo_names: 'not json' });
    expect(broken.success).toBe(false);
  });

  it('limits the number of photos', () => {
    const many = Array.from({ length: 9 }, (_, i) => `3b241101-e2bb-4255-8caf-4136c566a96${i}.jpg`);
    expect(schema.safeParse({ ...validListing(), photo_names: JSON.stringify(many) }).success).toBe(false);
  });

  it('validates contact details per method', () => {
    expect(schema.safeParse({ ...validListing(), contact_value: '12345' }).success).toBe(false);
    expect(
      schema.safeParse({ ...validListing(), contact_method: 'email', contact_value: 'a@example.com' }).success,
    ).toBe(true);
    expect(schema.safeParse({ ...validListing(), contact_method: 'email', contact_value: 'nope' }).success).toBe(false);
  });

  it('keeps accommodation type consistent with listing type', () => {
    expect(schema.safeParse({ ...validListing(), accommodation_type: 'private_room' }).success).toBe(false);
    expect(
      schema.safeParse({ ...validListing(), listing_type: 'room', accommodation_type: 'apartment' }).success,
    ).toBe(false);
    expect(
      schema.safeParse({ ...validListing(), listing_type: 'room', accommodation_type: 'private_room' }).success,
    ).toBe(true);
  });

  it('only accepts a brokerage amount when brokerage applies', () => {
    expect(schema.safeParse({ ...validListing(), brokerage_amount_inr: '5000' }).success).toBe(false);
    expect(
      schema.safeParse({ ...validListing(), brokerage_status: 'applies', brokerage_amount_inr: '5000' }).success,
    ).toBe(true);
  });

  it('rejects implausible rent and out-of-window dates', () => {
    expect(schema.safeParse({ ...validListing(), rent_inr: '50' }).success).toBe(false);
    expect(schema.safeParse({ ...validListing(), rent_inr: '99999999' }).success).toBe(false);
    expect(schema.safeParse({ ...validListing(), rent_inr: 'abc' }).success).toBe(false);
    expect(schema.safeParse({ ...validListing(), available_from: '2024-01-01' }).success).toBe(false);
    expect(schema.safeParse({ ...validListing(), available_from: '2030-01-01' }).success).toBe(false);
    expect(schema.safeParse({ ...validListing(), available_from: 'tomorrow' }).success).toBe(false);
    expect(schema.safeParse({ ...validListing(), available_from: '2026-10-13' }).success).toBe(true); // today (IST)
  });

  it('rejects unknown amenity values and enum values', () => {
    expect(schema.safeParse({ ...validListing(), amenities: ['helipad'] }).success).toBe(false);
    expect(schema.safeParse({ ...validListing(), contributor_type: 'landlord' }).success).toBe(false);
  });
});

describe('roommate schema', () => {
  const schema = createRoommateSchema(NOW);
  const valid = () => ({
    display_name: 'Asha',
    city: 'Chennai',
    preferred_localities: 'Adyar, Velachery',
    budget_min_inr: '',
    budget_max_inr: '12000',
    move_in_date: '2026-11-05',
    accommodation_type: '',
    seeking: 'room',
    sharing_preference: 'either',
    lifestyle: ['early_riser'],
    introduction: 'Working professional looking for a calm shared flat.',
    contact_method: 'email',
    contact_value: 'asha@example.com',
    consent_processing: 'on',
    consent_public_profile: 'on',
  });
  it('accepts a valid profile with contact kept private by default', () => {
    const r = schema.safeParse(valid());
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.preferred_localities).toEqual(['Adyar', 'Velachery']);
      expect(r.data.consent_public_contact).toBe(false);
      expect(r.data.accommodation_type).toBeUndefined();
    }
  });
  it('refuses a profile without publication consent, and inverted budgets', () => {
    expect(schema.safeParse({ ...valid(), consent_public_profile: '' }).success).toBe(false);
    expect(schema.safeParse({ ...valid(), budget_min_inr: '20000' }).success).toBe(false);
  });
});

describe('requirement schema', () => {
  const schema = createRequirementSchema(NOW);
  const valid = () => ({
    city: 'Hyderabad',
    preferred_localities: '',
    budget_min_inr: '10000',
    budget_max_inr: '25000',
    accommodation_types: ['apartment', 'studio'],
    move_in_date: '2026-12-01',
    furnishing_pref: 'not_specified',
    brokerage_pref: 'no_brokerage_only',
    notes: '',
    contact_name: '',
    contact_method: 'whatsapp',
    contact_value: '9876543210',
    consent_processing: 'on',
  });
  it('accepts a valid requirement', () => {
    const r = schema.safeParse(valid());
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.consent_contact_me).toBe(false);
  });
  it('needs at least one accommodation type and consent', () => {
    expect(schema.safeParse({ ...valid(), accommodation_types: [] }).success).toBe(false);
    expect(schema.safeParse({ ...valid(), consent_processing: '' }).success).toBe(false);
  });
});

describe('report and data-request schemas', () => {
  it('requires consent if a reporter leaves contact details', () => {
    expect(reportSchema.safeParse({ listing_slug: 'abc-123', category: 'already_rented', reporter_contact: 'me@example.com' }).success).toBe(false);
    expect(
      reportSchema.safeParse({ listing_slug: 'abc-123', category: 'already_rented', reporter_contact: 'me@example.com', contact_consent: 'on' }).success,
    ).toBe(true);
    expect(reportSchema.safeParse({ listing_slug: 'abc-123', category: 'already_rented' }).success).toBe(true);
  });
  it('requires a description for "other"', () => {
    expect(reportSchema.safeParse({ listing_slug: 'abc-123', category: 'other' }).success).toBe(false);
  });
  it('requires contact for removal/correction but not feedback', () => {
    expect(dataRequestSchema.safeParse({ kind: 'removal', message: 'Please remove my listing' }).success).toBe(false);
    expect(dataRequestSchema.safeParse({ kind: 'feedback', message: 'Nice work on this' }).success).toBe(true);
  });
});

describe('formDataToRaw', () => {
  it('collects array fields and skips Next internals', () => {
    const fd = new FormData();
    fd.append('amenities', 'parking');
    fd.append('amenities', 'lift');
    fd.append('title', 'Hello');
    fd.append('$ACTION_ID_abc', '');
    const raw = formDataToRaw(fd);
    expect(raw.amenities).toEqual(['parking', 'lift']);
    expect(raw.title).toBe('Hello');
    expect('$ACTION_ID_abc' in raw).toBe(false);
  });
});
