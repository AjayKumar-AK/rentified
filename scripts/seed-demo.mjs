// Loads or removes clearly-marked FICTIONAL demo listings for local development.
//   npm run seed:demo           (requires ALLOW_DEMO_SEED=true and a non-production target)
//   npm run seed:demo:remove
// Demo rows have is_demo = true, fictional names, and invalid-by-design contact values (@example.invalid / +91 00000 numbers
// are NOT used publicly because consent_public_contact is false). They have no photos; the UI shows a placeholder.
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local'); process.exit(1); }

const remove = process.argv.includes('--remove');
if (!remove) {
  if (process.env.ALLOW_DEMO_SEED !== 'true') { console.error('Refusing to seed: set ALLOW_DEMO_SEED=true (development only).'); process.exit(1); }
  if (process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production') { console.error('Refusing to seed demo data in production.'); process.exit(1); }
}

const db = createClient(url, key, { auth: { persistSession: false } });

if (remove) {
  const { error, count } = await db.from('listings').delete({ count: 'exact' }).eq('is_demo', true);
  if (error) { console.error(error.message); process.exit(1); }
  console.log(`Removed ${count ?? 0} demo listing(s).`);
  process.exit(0);
}

const inDays = (n) => new Date(Date.now() + n * 86_400_000).toISOString();
const dateIn = (n) => inDays(n).slice(0, 10);
const common = {
  is_demo: true, status: 'approved', consent_processing: true, consent_photo_rights: true, consent_public_contact: false,
  policy_version: 'demo', contact_method: 'email', contributor_display_name: 'Demo Contributor',
  approved_at: new Date().toISOString(), last_confirmed_at: new Date().toISOString(), expires_at: inDays(14),
};
const rows = [
  { slug: 'demo-sunny-2bhk-example', listing_type: 'property', contributor_type: 'owner', title: 'DEMO: Sunny 2BHK with balcony', description: 'Fictional demo listing used only to test the interface. Not a real home.', city: 'Demoville', locality: 'Gandhi nagar', public_location_text: 'Gandhi nagar, Demoville', accommodation_type: 'apartment', rent_inr: 28000, deposit_inr: 84000, brokerage_status: 'none', available_from: dateIn(-1), furnishing: 'semi_furnished', bedrooms: 2, bathrooms: 2, amenities: ['parking', 'lift'], contact_value: 'demo-owner@example.invalid' },
  { slug: 'demo-private-room-example', listing_type: 'room', contributor_type: 'tenant', title: 'DEMO: Private room in a shared flat', description: 'Fictional demo listing used only to test the interface. Not a real room.', city: 'Demoville', locality: 'Placeholder Colony', public_location_text: 'Placeholder Colony, Demoville', accommodation_type: 'private_room', rent_inr: 9500, deposit_inr: 19000, brokerage_status: 'none', available_from: dateIn(10), furnishing: 'furnished', bedrooms: 3, bathrooms: 2, amenities: ['wifi', 'washing_machine'], contact_value: 'demo-tenant@example.invalid' },
  { slug: 'demo-1bhk-broker-example', listing_type: 'property', contributor_type: 'broker', title: 'DEMO: 1BHK near the market', description: 'Fictional demo listing used only to test the interface. Not a real home.', city: 'Demoville', locality: 'Sample Road', public_location_text: 'Sample Road, Demoville', accommodation_type: 'apartment', rent_inr: 16000, deposit_inr: null, brokerage_status: 'applies', brokerage_amount_inr: 8000, available_from: dateIn(20), furnishing: 'unfurnished', bedrooms: 1, bathrooms: 1, amenities: [], contact_value: 'demo-broker@example.invalid' },
].map((r) => ({ ...common, ...r }));

const { error } = await db.from('listings').upsert(rows, { onConflict: 'slug' });
if (error) { console.error(error.message); process.exit(1); }
console.log(`Seeded ${rows.length} demo listings (is_demo = true, no photos, no public contact).`);
