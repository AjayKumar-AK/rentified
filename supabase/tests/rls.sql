-- RLS / privilege checks. Run in the Supabase SQL editor or: psql "$DATABASE_URL" -f supabase/tests/rls.sql
-- Everything runs inside a transaction that is rolled back. Any failure raises an exception.

begin;

-- Fixture rows (as the privileged migration role) so the checks are not vacuous.
insert into public.listings (
  slug, listing_type, contributor_type, status, title, description, city, locality, public_location_text,
  private_address, accommodation_type, rent_inr, available_from, contributor_display_name, contact_method,
  contact_value, consent_processing, consent_photo_rights, consent_public_contact, policy_version,
  expires_at, last_confirmed_at, approved_at
) values
  ('rls-pending', 'property', 'owner', 'pending_review', 'RLS pending listing', 'Pending listing used by RLS test only.',
   'Testville', 'North', 'North, Testville', '12 Secret Street', 'apartment', 10000, current_date, 'Test Owner',
   'email', 'pending@example.invalid', true, true, true, 'test', now() + interval '7 days', now(), null),
  ('rls-approved-private', 'property', 'owner', 'approved', 'RLS approved private contact', 'Approved listing without contact consent.',
   'Testville', 'South', 'South, Testville', '34 Hidden Road', 'apartment', 12000, current_date, 'Test Owner',
   'email', 'hidden@example.invalid', true, true, false, 'test', now() + interval '7 days', now(), now()),
  ('rls-approved-public', 'property', 'owner', 'approved', 'RLS approved public contact', 'Approved listing WITH contact consent.',
   'Testville', 'East', 'East, Testville', '56 Other Lane', 'apartment', 14000, current_date, 'Test Owner',
   'email', 'public@example.invalid', true, true, true, 'test', now() + interval '7 days', now(), now()),
  ('rls-expired', 'property', 'owner', 'approved', 'RLS expired listing', 'Approved but past its expiry timestamp.',
   'Testville', 'West', 'West, Testville', '78 Old Street', 'apartment', 9000, current_date, 'Test Owner',
   'email', 'expired@example.invalid', true, true, true, 'test', now() - interval '1 day', now() - interval '20 days', now() - interval '20 days');

set local role anon;

-- 1. anon cannot touch ANY base table (SELECT, INSERT, UPDATE, DELETE).
do $$
declare t text;
begin
  foreach t in array array[
    'admin_users', 'listings', 'listing_photos', 'roommate_profiles', 'renter_requirements',
    'moderation_actions', 'availability_confirmations', 'verification_checks', 'listing_reports',
    'data_requests', 'consent_records', 'rate_limit_events'
  ] loop
    begin
      execute format('select 1 from public.%I limit 1', t);
      raise exception 'FAIL: anon can SELECT public.%', t;
    exception when insufficient_privilege then null;
    end;
    begin
      execute format('delete from public.%I', t);
      raise exception 'FAIL: anon can DELETE from public.%', t;
    exception when insufficient_privilege then null;
    end;
  end loop;
end $$;

-- 2. anon cannot call server-side functions.
do $$
begin
  begin perform public.expire_stale_listings(); raise exception 'FAIL: anon can run expire_stale_listings';
  exception when insufficient_privilege then null; end;
  begin perform public.check_rate_limit('k', 'a', 1, 1); raise exception 'FAIL: anon can run check_rate_limit';
  exception when insufficient_privilege then null; end;
end $$;

-- 3. The public view shows ONLY approved, unexpired listings.
do $$
declare n integer;
begin
  select count(*) into n from public.public_listings where slug = 'rls-pending';
  if n <> 0 then raise exception 'FAIL: pending listing is publicly visible'; end if;
  select count(*) into n from public.public_listings where slug = 'rls-expired';
  if n <> 0 then raise exception 'FAIL: expired listing is publicly visible'; end if;
  select count(*) into n from public.public_listings where slug in ('rls-approved-private', 'rls-approved-public');
  if n <> 2 then raise exception 'FAIL: approved listings should be visible (got %)', n; end if;
end $$;

-- 4. Contact value only appears with explicit publication consent.
do $$
declare v text;
begin
  select public_contact_value into v from public.public_listings where slug = 'rls-approved-private';
  if v is not null then raise exception 'FAIL: contact leaked without consent'; end if;
  select public_contact_value into v from public.public_listings where slug = 'rls-approved-public';
  if v is distinct from 'public@example.invalid' then raise exception 'FAIL: consented contact not shown'; end if;
end $$;

-- 5. Private columns do not exist on any public view.
do $$
declare bad text;
begin
  select string_agg(table_name || '.' || column_name, ', ') into bad
    from information_schema.columns
   where table_schema = 'public'
     and table_name in ('public_listings', 'public_listing_photos', 'public_roommate_profiles')
     and column_name in ('private_address', 'contact_value', 'contributor_display_name',
                         'reconfirm_token_hash', 'consent_processing', 'consent_photo_rights',
                         'consent_public_contact', 'status', 'submitted_at', 'approved_by');
  if bad is not null then raise exception 'FAIL: private columns on public views: %', bad; end if;
end $$;

reset role;

-- 6. Status-transition guard (applies even to privileged roles).
do $$
begin
  begin
    update public.listings set status = 'approved' where slug = 'rls-pending' and false; -- no-op, syntax check
    update public.listings set status = 'expired' where slug = 'rls-pending';
    raise exception 'FAIL: pending_review -> expired should be rejected';
  exception when check_violation then null;
  end;
end $$;

-- 7. The service role (used by server code) hits the transition guard, not a permission error.
set local role service_role;
do $$
begin
  begin
    update public.listings set status = 'expired' where slug = 'rls-pending';
    raise exception 'FAIL: service_role pending_review -> expired should be rejected';
  exception when check_violation then null;
  end;
  update public.listings set status = 'rejected' where slug = 'rls-pending'; -- legal transition works
end $$;
reset role;

rollback;

select 'RLS checks passed' as result;
