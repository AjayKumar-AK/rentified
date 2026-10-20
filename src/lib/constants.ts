// Value lists shared by validation, forms and filters. Human-readable labels live in
// src/messages/en.ts so the UI can be localized later without touching logic.

export const LISTING_TYPES = ['property', 'room'] as const;
export const CONTRIBUTOR_TYPES = ['owner', 'tenant', 'broker', 'other'] as const;
export const LISTING_STATUSES = [
  'pending_review',
  'changes_requested',
  'approved',
  'rejected',
  'unavailable',
  'expired',
  'removed',
] as const;
export const ACCOMMODATION_TYPES = [
  'apartment',
  'independent_house',
  'villa',
  'studio',
  'private_room',
  'shared_room',
  'pg_hostel',
] as const;
export const PROPERTY_ACCOMMODATION_TYPES = ['apartment', 'independent_house', 'villa', 'studio'] as const;
export const ROOM_ACCOMMODATION_TYPES = ['private_room', 'shared_room', 'pg_hostel'] as const;
export const FURNISHING_STATUSES = ['unfurnished', 'semi_furnished', 'furnished', 'not_specified'] as const;
export const BROKERAGE_STATUSES = ['none', 'applies', 'not_specified'] as const;
export const CONTACT_METHODS = ['phone', 'whatsapp', 'email'] as const;
export const AMENITIES = [
  'parking',
  'lift',
  'power_backup',
  'water_supply',
  'wifi',
  'security',
  'ac',
  'washing_machine',
  'geyser',
  'balcony',
  'pets_allowed',
] as const;
export const LIFESTYLE_TAGS = [
  'early_riser',
  'night_owl',
  'non_smoking',
  'pet_friendly',
  'works_from_home',
  'working_professional',
  'student',
] as const;
export const REPORT_CATEGORIES = [
  'already_rented',
  'incorrect_price',
  'misleading',
  'suspicious',
  'duplicate',
  'inappropriate',
  'other',
] as const;
export const REPORT_STATUSES = ['open', 'reviewing', 'actioned', 'dismissed'] as const;
export const SEEKING_TYPES = ['room', 'roommate'] as const;
export const SHARING_PREFERENCES = ['private_room', 'shared_room', 'either'] as const;
export const BROKERAGE_PREFERENCES = ['no_brokerage_only', 'open_to_brokerage', 'no_preference'] as const;
export const REQUIREMENT_STATUSES = ['new', 'reviewed', 'archived'] as const;
export const DATA_REQUEST_KINDS = ['correction', 'removal', 'access', 'feedback'] as const;
export const DATA_REQUEST_STATUSES = ['open', 'done', 'declined'] as const;
export const CHECK_TYPES = ['identity', 'property'] as const;
export const CHECK_STATUSES = ['passed', 'failed', 'not_applicable'] as const;

export const MODERATION_ACTIONS = [
  'approve',
  'reject',
  'request_changes',
  'mark_unavailable',
  'expire',
  'unpublish',
  'reinstate',
] as const;

// Uploads
export const MAX_PHOTOS = 8;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const PHOTO_BUCKET = 'listing-photos';
export const PHOTO_URL_TTL_SECONDS = 60 * 60;

// Bump when the privacy policy / terms materially change; stored with every consent record.
export const POLICY_VERSION = '2026-10-v0.1';

export const PAGE_SIZE = 12;
