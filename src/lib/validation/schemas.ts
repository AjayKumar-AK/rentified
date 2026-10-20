import { z } from 'zod';
import * as C from '@/lib/constants';
import { contactErrorMessage, normalizeContact } from '@/lib/validation/contact';
import type { ContactMethod } from '@/lib/types';

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------
const blankToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

const text = (min: number, max: number, label: string) =>
  z
    .string({ required_error: `${label} is required`, invalid_type_error: `${label} is required` })
    .trim()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

const optText = (max: number) =>
  z.preprocess(blankToUndefined, z.string().trim().max(max, `Keep this under ${max} characters`).optional());

const reqInt = (label: string, min: number, max: number) =>
  z.preprocess(
    (v) => {
      const b = blankToUndefined(v);
      return b === undefined ? undefined : Number(b);
    },
    z
      .number({ required_error: `${label} is required`, invalid_type_error: `${label} must be a number` })
      .int(`${label} must be a whole number`)
      .min(min, `${label} must be at least ${min.toLocaleString('en-IN')}`)
      .max(max, `${label} must be at most ${max.toLocaleString('en-IN')}`),
  );

const optInt = (label: string, min: number, max: number) =>
  z.preprocess(
    (v) => {
      const b = blankToUndefined(v);
      return b === undefined ? undefined : Number(b);
    },
    z
      .number({ invalid_type_error: `${label} must be a number` })
      .int(`${label} must be a whole number`)
      .min(min, `${label} must be at least ${min.toLocaleString('en-IN')}`)
      .max(max, `${label} must be at most ${max.toLocaleString('en-IN')}`)
      .optional(),
  );

const checkbox = z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean());
const mustBeTrue = (message: string) => checkbox.refine((v) => v === true, { message });

function choice<T extends readonly [string, ...string[]]>(values: T) {
  return z.enum(values, { errorMap: () => ({ message: 'Choose an option' }) });
}
function optChoice<T extends readonly [string, ...string[]]>(values: T) {
  return z.preprocess(blankToUndefined, choice(values).optional());
}

const isoDate = z
  .string({ required_error: 'Date is required', invalid_type_error: 'Date is required' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date')
  .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), 'Enter a valid date');

const splitList = (max: number) =>
  z.preprocess(
    (v) =>
      typeof v === 'string'
        ? v
            .split(/[,;\n]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : Array.isArray(v)
          ? v
          : [],
    z.array(z.string().trim().min(2, 'Too short').max(60, 'Too long')).max(max, `Add at most ${max} items`),
  );

const jsonArray = (v: unknown) => {
  if (Array.isArray(v)) return v;
  try {
    const parsed = JSON.parse(typeof v === 'string' ? v : '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/** Filenames minted by the server for signed uploads: <uuid>.<ext> */
export const PHOTO_NAME_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

const DAY_MS = 24 * 60 * 60 * 1000;
const todayIso = (now: Date) => new Date(now.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10); // IST date

function checkContact(
  data: { contact_method: ContactMethod; contact_value: string },
  ctx: z.RefinementCtx,
  path: string = 'contact_value',
) {
  if (!normalizeContact(data.contact_method, data.contact_value)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message: contactErrorMessage(data.contact_method) });
  }
}

function checkBudget(
  data: { budget_min_inr?: number; budget_max_inr: number },
  ctx: z.RefinementCtx,
) {
  if (data.budget_min_inr !== undefined && data.budget_min_inr > data.budget_max_inr) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['budget_min_inr'],
      message: 'Minimum budget cannot be higher than the maximum',
    });
  }
}

function checkDateWindow(iso: string, now: Date, path: string, ctx: z.RefinementCtx) {
  const today = todayIso(now);
  const earliest = new Date(Date.parse(`${today}T00:00:00Z`) - 31 * DAY_MS).toISOString().slice(0, 10);
  const latest = new Date(Date.parse(`${today}T00:00:00Z`) + 365 * DAY_MS).toISOString().slice(0, 10);
  if (iso < earliest || iso > latest) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [path],
      message: 'Choose a date within the next year (or today, if available now)',
    });
  }
}

// ---------------------------------------------------------------------------
// Listing submission (owner / tenant / broker / other; property or room)
// ---------------------------------------------------------------------------
export function createListingSchema(now: Date = new Date()) {
  return z
    .object({
      listing_type: choice(C.LISTING_TYPES),
      contributor_type: choice(C.CONTRIBUTOR_TYPES),
      title: text(5, 90, 'Title'),
      description: text(20, 2000, 'Description'),
      city: text(2, 60, 'City'),
      locality: text(2, 80, 'Locality'),
      public_location_text: optText(140),
      private_address: optText(250),
      accommodation_type: choice(C.ACCOMMODATION_TYPES),
      rent_inr: reqInt('Monthly rent', 500, 1_000_000),
      deposit_inr: optInt('Deposit', 0, 10_000_000),
      brokerage_status: choice(C.BROKERAGE_STATUSES),
      brokerage_amount_inr: optInt('Brokerage amount', 0, 10_000_000),
      available_from: isoDate,
      furnishing: choice(C.FURNISHING_STATUSES),
      bedrooms: optInt('Bedrooms', 0, 20),
      bathrooms: optInt('Bathrooms', 0, 20),
      amenities: z.array(z.enum(C.AMENITIES)).default([]),
      contributor_display_name: text(2, 60, 'Name'),
      contact_method: choice(C.CONTACT_METHODS),
      contact_value: text(5, 120, 'Contact'),
      consent_processing: mustBeTrue('You need to agree to this to submit'),
      consent_photo_rights: mustBeTrue('Please confirm you have the right to share these photos and details'),
      consent_public_contact: checkbox,
      upload_session_id: z.string({ required_error: 'Photo session missing' }).uuid('Please add your photos again'),
      photo_names: z.preprocess(
        jsonArray,
        z
          .array(z.string().regex(PHOTO_NAME_RE, 'Invalid photo reference'))
          .min(1, 'Add at least one photo')
          .max(C.MAX_PHOTOS, `You can add at most ${C.MAX_PHOTOS} photos`),
      ),
    })
    .superRefine((data, ctx) => {
      const isRoomType = (C.ROOM_ACCOMMODATION_TYPES as readonly string[]).includes(data.accommodation_type);
      if (data.listing_type === 'room' && !isRoomType) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['accommodation_type'], message: 'Choose a room or shared type' });
      }
      if (data.listing_type === 'property' && isRoomType) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['accommodation_type'], message: 'Choose a home type, or use the room form' });
      }
      if (data.brokerage_status !== 'applies' && data.brokerage_amount_inr !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['brokerage_amount_inr'],
          message: 'Only enter an amount if brokerage applies',
        });
      }
      checkDateWindow(data.available_from, now, 'available_from', ctx);
      checkContact(data, ctx);
    })
    .transform((data) => ({
      ...data,
      contact_value: normalizeContact(data.contact_method, data.contact_value) as string,
      public_location_text: data.public_location_text ?? `${data.locality}, ${data.city}`,
    }));
}
export type ListingInput = z.infer<ReturnType<typeof createListingSchema>>;

// ---------------------------------------------------------------------------
// Contributor correction (only while a moderator has requested changes)
// ---------------------------------------------------------------------------
export function createListingCorrectionSchema(now: Date = new Date()) {
  return z
    .object({
      title: text(5, 90, 'Title'),
      description: text(20, 2000, 'Description'),
      rent_inr: reqInt('Monthly rent', 500, 1_000_000),
      deposit_inr: optInt('Deposit', 0, 10_000_000),
      available_from: isoDate,
    })
    .superRefine((data, ctx) => checkDateWindow(data.available_from, now, 'available_from', ctx));
}

// ---------------------------------------------------------------------------
// Roommate seeker profile
// ---------------------------------------------------------------------------
export function createRoommateSchema(now: Date = new Date()) {
  return z
    .object({
      display_name: text(2, 40, 'Display name'),
      city: text(2, 60, 'City'),
      preferred_localities: splitList(6),
      budget_min_inr: optInt('Minimum budget', 0, 1_000_000),
      budget_max_inr: reqInt('Maximum budget', 500, 1_000_000),
      move_in_date: isoDate,
      accommodation_type: optChoice(C.ACCOMMODATION_TYPES),
      seeking: choice(C.SEEKING_TYPES),
      sharing_preference: choice(C.SHARING_PREFERENCES),
      lifestyle: z.array(z.enum(C.LIFESTYLE_TAGS)).default([]),
      introduction: text(20, 600, 'Introduction'),
      contact_method: choice(C.CONTACT_METHODS),
      contact_value: text(5, 120, 'Contact'),
      consent_processing: mustBeTrue('You need to agree to this to submit'),
      consent_public_profile: mustBeTrue('Your profile can only be submitted if you agree to it being shown publicly once approved'),
      consent_public_contact: checkbox,
    })
    .superRefine((data, ctx) => {
      checkBudget(data, ctx);
      checkDateWindow(data.move_in_date, now, 'move_in_date', ctx);
      checkContact(data, ctx);
    })
    .transform((data) => ({
      ...data,
      contact_value: normalizeContact(data.contact_method, data.contact_value) as string,
    }));
}
export type RoommateInput = z.infer<ReturnType<typeof createRoommateSchema>>;

// ---------------------------------------------------------------------------
// Renter requirement (private)
// ---------------------------------------------------------------------------
export function createRequirementSchema(now: Date = new Date()) {
  return z
    .object({
      city: text(2, 60, 'City'),
      preferred_localities: splitList(6),
      budget_min_inr: optInt('Minimum budget', 0, 1_000_000),
      budget_max_inr: reqInt('Maximum budget', 500, 1_000_000),
      accommodation_types: z
        .array(z.enum(C.ACCOMMODATION_TYPES))
        .min(1, 'Choose at least one accommodation type'),
      move_in_date: isoDate,
      furnishing_pref: choice(C.FURNISHING_STATUSES),
      brokerage_pref: choice(C.BROKERAGE_PREFERENCES),
      notes: optText(800),
      contact_name: optText(60),
      contact_method: choice(C.CONTACT_METHODS),
      contact_value: text(5, 120, 'Contact'),
      consent_processing: mustBeTrue('You need to agree to this to submit'),
      consent_contact_me: checkbox,
    })
    .superRefine((data, ctx) => {
      checkBudget(data, ctx);
      checkDateWindow(data.move_in_date, now, 'move_in_date', ctx);
      checkContact(data, ctx);
    })
    .transform((data) => ({
      ...data,
      contact_value: normalizeContact(data.contact_method, data.contact_value) as string,
    }));
}
export type RequirementInput = z.infer<ReturnType<typeof createRequirementSchema>>;

// ---------------------------------------------------------------------------
// Reports and data requests
// ---------------------------------------------------------------------------
export const reportSchema = z
  .object({
    listing_slug: text(3, 160, 'Listing'),
    category: choice(C.REPORT_CATEGORIES),
    description: optText(1000),
    reporter_contact: optText(120),
    contact_consent: checkbox,
  })
  .superRefine((data, ctx) => {
    if (data.reporter_contact && !data.contact_consent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['contact_consent'],
        message: 'Tick this box if you want us to be able to contact you, or remove your contact details',
      });
    }
    if (data.category === 'other' && !data.description) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['description'], message: 'Please describe the problem' });
    }
  });
export type ReportInput = z.infer<typeof reportSchema>;

export const dataRequestSchema = z
  .object({
    kind: choice(C.DATA_REQUEST_KINDS),
    listing_ref: optText(200),
    message: text(5, 1500, 'Message'),
    contact_value: optText(120),
  })
  .superRefine((data, ctx) => {
    if (data.kind !== 'feedback' && !data.contact_value) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['contact_value'],
        message: 'Add an email or phone number so we can reach you about this request',
      });
    }
  });
export type DataRequestInput = z.infer<typeof dataRequestSchema>;

// ---------------------------------------------------------------------------
// Moderator inputs
// ---------------------------------------------------------------------------
export const verificationCheckSchema = z.object({
  listing_id: z.string().uuid(),
  check_type: choice(C.CHECK_TYPES),
  status: choice(C.CHECK_STATUSES),
  method: text(3, 200, 'Method'),
  notes: optText(1000),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Keys whose values should be collected with FormData.getAll() */
export const ARRAY_FIELDS = ['amenities', 'lifestyle', 'accommodation_types'] as const;

export function formDataToRaw(fd: FormData): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  for (const key of Array.from(new Set(fd.keys()))) {
    if (key.startsWith('$ACTION')) continue; // Next.js internals
    raw[key] = (ARRAY_FIELDS as readonly string[]).includes(key)
      ? fd.getAll(key).filter((v): v is string => typeof v === 'string')
      : typeof fd.get(key) === 'string'
        ? fd.get(key)
        : '';
  }
  return raw;
}

/** First error message per top-level field. */
export function zodErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_form');
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
