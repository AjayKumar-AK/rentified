// Black-box check against a LIVE Supabase project using the PUBLIC anon key only.
// Confirms anonymous visitors cannot read private tables or columns. Run: npm run check:rls
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anon) { console.error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'); process.exit(1); }
const db = createClient(url, anon, { auth: { persistSession: false } });

let failed = 0;
const ok = (name) => console.log(`  ✓ ${name}`);
const bad = (name, why) => { failed++; console.log(`  ✗ ${name} — ${why}`); };

const privateTables = ['listings', 'listing_photos', 'roommate_profiles', 'renter_requirements', 'moderation_actions', 'availability_confirmations', 'verification_checks', 'listing_reports', 'data_requests', 'consent_records', 'rate_limit_events', 'admin_users'];
for (const t of privateTables) {
  const { data, error } = await db.from(t).select('*').limit(1);
  if (error) ok(`anon cannot read ${t} (${error?.code ?? 'denied'})`);
  else bad(`anon read of ${t}`, `got ${data?.length ?? 0} row(s) and no error`);
}
for (const t of privateTables) {
  const { error } = await db.from(t).insert({}).select();
  if (error) ok(`anon cannot insert into ${t}`); else bad(`anon insert into ${t}`, 'succeeded');
}
for (const v of ['public_listings', 'public_listing_photos', 'public_roommate_profiles']) {
  const { error } = await db.from(v).select('*').limit(1);
  if (!error) ok(`anon can read public view ${v}`); else bad(`public view ${v}`, error.message);
}
const { data: cols } = await db.from('public_listings').select('*').limit(1);
const leaked = cols?.[0] ? ['private_address', 'contact_value', 'contributor_display_name', 'reconfirm_token_hash', 'consent_processing', 'status'].filter((c) => c in cols[0]) : [];
if (leaked.length) bad('public_listings columns', `leaks: ${leaked.join(', ')}`); else ok('public_listings exposes no private columns');
for (const fn of ['expire_stale_listings', 'check_rate_limit']) {
  const { error } = await db.rpc(fn, {});
  if (error) ok(`anon cannot call ${fn}`); else bad(`rpc ${fn}`, 'anon could execute it');
}
const { data: files, error: fe } = await db.storage.from('listing-photos').list('pending');
if (fe || !files || files.length === 0) ok('anon cannot list private photo bucket'); else bad('storage list', `${files.length} object(s) visible`);

console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll anonymous-access checks passed');
process.exit(failed ? 1 : 0);
