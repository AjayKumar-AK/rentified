import type * as C from '@/lib/constants';

export type ListingType = (typeof C.LISTING_TYPES)[number];
export type ContributorType = (typeof C.CONTRIBUTOR_TYPES)[number];
export type ListingStatus = (typeof C.LISTING_STATUSES)[number];
export type AccommodationType = (typeof C.ACCOMMODATION_TYPES)[number];
export type FurnishingStatus = (typeof C.FURNISHING_STATUSES)[number];
export type BrokerageStatus = (typeof C.BROKERAGE_STATUSES)[number];
export type ContactMethod = (typeof C.CONTACT_METHODS)[number];
export type Amenity = (typeof C.AMENITIES)[number];
export type LifestyleTag = (typeof C.LIFESTYLE_TAGS)[number];
export type ReportCategory = (typeof C.REPORT_CATEGORIES)[number];
export type ReportStatus = (typeof C.REPORT_STATUSES)[number];
export type SeekingType = (typeof C.SEEKING_TYPES)[number];
export type SharingPreference = (typeof C.SHARING_PREFERENCES)[number];
export type BrokeragePreference = (typeof C.BROKERAGE_PREFERENCES)[number];
export type RequirementStatus = (typeof C.REQUIREMENT_STATUSES)[number];
export type DataRequestKind = (typeof C.DATA_REQUEST_KINDS)[number];
export type DataRequestStatus = (typeof C.DATA_REQUEST_STATUSES)[number];
export type CheckType = (typeof C.CHECK_TYPES)[number];
export type CheckStatus = (typeof C.CHECK_STATUSES)[number];
export type ModerationActionName = (typeof C.MODERATION_ACTIONS)[number];

/** Row shape of the `public_listings` view — the only listing data the public can read. */
export interface PublicListing {
  id: string;
  slug: string;
  listing_type: ListingType;
  contributor_type: ContributorType;
  title: string;
  description: string;
  city: string;
  locality: string;
  public_location_text: string;
  accommodation_type: AccommodationType;
  rent_inr: number;
  deposit_inr: number | null;
  brokerage_status: BrokerageStatus;
  brokerage_amount_inr: number | null;
  available_from: string;
  furnishing: FurnishingStatus;
  bedrooms: number | null;
  bathrooms: number | null;
  amenities: string[];
  is_demo: boolean;
  approved_at: string | null;
  last_confirmed_at: string | null;
  expires_at: string | null;
  public_contact_method: ContactMethod | null;
  public_contact_value: string | null;
  identity_checked_at: string | null;
  property_checked_at: string | null;
}

/** A listing plus signed photo URLs, ready to render. */
export interface ListingWithPhotos extends PublicListing {
  photos: { url: string; alt: string }[];
}

/** Row shape of the `public_roommate_profiles` view. */
export interface PublicRoommateProfile {
  id: string;
  display_name: string;
  city: string;
  preferred_localities: string[];
  budget_min_inr: number | null;
  budget_max_inr: number;
  move_in_date: string;
  accommodation_type: AccommodationType | null;
  seeking: SeekingType;
  sharing_preference: SharingPreference;
  lifestyle: string[];
  introduction: string;
  approved_at: string | null;
  expires_at: string | null;
  public_contact_method: ContactMethod | null;
  public_contact_value: string | null;
}

/** Full private listing row (service-role reads only; used by the moderation dashboard). */
export interface AdminListing extends Omit<PublicListing, 'public_contact_method' | 'public_contact_value' | 'identity_checked_at' | 'property_checked_at'> {
  status: ListingStatus;
  private_address: string | null;
  contributor_display_name: string;
  contact_method: ContactMethod;
  contact_value: string;
  consent_processing: boolean;
  consent_photo_rights: boolean;
  consent_public_contact: boolean;
  policy_version: string;
  submitted_at: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DirectoryFilters {
  q?: string;
  city?: string;
  minRent?: number;
  maxRent?: number;
  accommodation?: AccommodationType;
  contributor?: ContributorType;
  brokerage?: 'none';
  category?: ListingType;
  availability?: 'now' | '30d';
  page?: number;
}
