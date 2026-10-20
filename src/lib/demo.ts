import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ListingWithPhotos } from '@/lib/types';

/** Uses /public/demo/<file> if you have added it; otherwise the card keeps its grey placeholder (never a broken image). */
function demoPhotos(file: string, alt: string): ListingWithPhotos['photos'] {
  return existsSync(join(process.cwd(), 'public', 'demo', file)) ? [{ url: `/demo/${file}`, alt }] : [];
}

/**
 * FICTIONAL examples used only to illustrate the interface on the landing page.
 * They are not real homes, people or prices, and are always labelled "Demo".
 */
const base: Pick<ListingWithPhotos, 'is_demo' | 'public_contact_method' | 'public_contact_value' | 'expires_at' | 'photos' | 'deposit_inr' | 'bedrooms' | 'bathrooms' | 'amenities'> = {
  is_demo: true,
  public_contact_method: null,
  public_contact_value: null,
  expires_at: null,
  photos: [],
  deposit_inr: null,
  bedrooms: null,
  bathrooms: null,
  amenities: [],
};

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

export function demoListings(): ListingWithPhotos[] {
  return [
    {
      ...base,
      id: 'demo-1', slug: 'demo-1', listing_type: 'property', contributor_type: 'owner',
      title: 'Example: bright 2BHK with balcony', description: 'Demo only.',
      photos: demoPhotos('flat-1.jpg', 'Illustrative photo of a flat interior'),
      city: 'Example City', locality: 'Sample Nagar', public_location_text: 'Sample Nagar, Example City',
      accommodation_type: 'apartment', rent_inr: 28000, deposit_inr: 84000,
      brokerage_status: 'none', brokerage_amount_inr: null, available_from: inDays(-1),
      furnishing: 'semi_furnished', approved_at: daysAgo(4), last_confirmed_at: daysAgo(2),
      identity_checked_at: null, property_checked_at: null,
    },
    {
      ...base,
      id: 'demo-2', slug: 'demo-2', listing_type: 'room', contributor_type: 'tenant',
      title: 'Example: private room in a shared flat', description: 'Demo only.',
      photos: demoPhotos('room-1.jpg', 'Illustrative photo of a room'),
      city: 'Example City', locality: 'Demo Colony', public_location_text: 'Demo Colony, Example City',
      accommodation_type: 'private_room', rent_inr: 9500, deposit_inr: 19000,
      brokerage_status: 'none', brokerage_amount_inr: null, available_from: inDays(12),
      furnishing: 'furnished', approved_at: daysAgo(9), last_confirmed_at: daysAgo(8),
      identity_checked_at: null, property_checked_at: null,
    },
    {
      ...base,
      id: 'demo-3', slug: 'demo-3', listing_type: 'property', contributor_type: 'broker',
      title: 'Example: 1BHK near the market', description: 'Demo only.',
      photos: demoPhotos('flat-2.jpg', 'Illustrative photo of a flat'),
      city: 'Example City', locality: 'Placeholder Road', public_location_text: 'Placeholder Road, Example City',
      accommodation_type: 'apartment', rent_inr: 16000, deposit_inr: null,
      brokerage_status: 'applies', brokerage_amount_inr: 8000, available_from: inDays(20),
      furnishing: 'unfurnished', approved_at: daysAgo(6), last_confirmed_at: daysAgo(5),
      identity_checked_at: null, property_checked_at: null,
    },
  ];
}