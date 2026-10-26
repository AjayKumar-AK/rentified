-- Nook rentals v0.1 — core schema
-- Run order: 0001_schema.sql -> 0002_security.sql
-- Design rule: base tables are NEVER readable by anon/authenticated roles.
-- Public data is exposed only through the views at the bottom of this file.

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.listing_type as enum ('property', 'room');
create type public.contributor_type as enum ('owner', 'tenant', 'broker', 'other');
create type public.listing_status as enum (
  'pending_review', 'changes_requested', 'approved', 'rejected', 'unavailable', 'expired', 'removed'
);
create type public.accommodation_type as enum (
  'apartment', 'independent_house', 'villa', 'studio', 'private_room', 'shared_room', 'pg_hostel'
);
create type public.furnishing_status as enum ('unfurnished', 'semi_furnished', 'furnished', 'not_specified');
create type public.brokerage_status as enum ('none', 'applies', 'not_specified');
create type public.contact_method as enum ('phone', 'whatsapp', 'email');
create type public.moderation_action as enum (
  'submit', 'approve', 'reject', 'request_changes', 'resubmit',
  'mark_unavailable', 'expire', 'unpublish', 'reinstate', 'reconfirm', 'note'
);
create type public.confirmation_source as enum ('contributor_at_submission', 'contributor_link', 'moderator');
create type public.check_type as enum ('identity', 'property');
create type public.check_status as enum ('passed', 'failed', 'not_applicable');
create type public.report_category as enum (
  'already_rented', 'incorrect_price', 'misleading', 'suspicious', 'duplicate', 'inappropriate', 'other'
);
create type public.report_status as enum ('open', 'reviewing', 'actioned', 'dismissed');
create type public.sharing_preference as enum ('private_room', 'shared_room', 'either');
create type public.seeking_type as enum ('room', 'roommate');
create type public.brokerage_preference as enum ('no_brokerage_only', 'open_to_brokerage', 'no_preference');
create type public.requirement_status as enum ('new', 'reviewed', 'archived');
create type public.data_request_kind as enum ('correction', 'removal', 'access', 'feedback');
create type public.data_request_status as enum ('open', 'done', 'declined');
create type public.consent_type as enum ('processing', 'photo_rights', 'public_contact', 'public_profile', 'contact_me');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Single source of truth for allowed publication-status transitions.
-- Mirrored in src/lib/moderation/transitions.ts (keep in sync; tests cover the TS side).
create or replace function public.listing_transition_allowed(p_from public.listing_status, p_to public.listing_status)
returns boolean language sql immutable as $$
  select case p_from
    when 'pending_review'    then p_to in ('approved', 'rejected', 'changes_requested', 'removed')
    when 'changes_requested' then p_to in ('pending_review', 'approved', 'rejected', 'removed')
    when 'approved'          then p_to in ('unavailable', 'expired', 'removed', 'changes_requested')
    when 'rejected'          then p_to in ('pending_review', 'removed')
    when 'unavailable'       then p_to in ('approved', 'removed')
    when 'expired'           then p_to in ('approved', 'removed')
    else false
  end
$$;

create or replace function public.enforce_status_transition() returns trigger
language plpgsql as $$
begin
  if new.status is distinct from old.status
     and not public.listing_transition_allowed(old.status, new.status) then
    raise exception 'illegal_status_transition: % -> %', old.status, new.status
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Administrators (granted manually via SQL; see README)
-- ---------------------------------------------------------------------------
create table public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'moderator' check (role in ('moderator')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Listings
-- ---------------------------------------------------------------------------
create table public.listings (
  id                      uuid primary key default gen_random_uuid(),
  slug                    text not null unique,
  listing_type            public.listing_type not null,
  contributor_type        public.contributor_type not null,
  status                  public.listing_status not null default 'pending_review',

  title                   text not null check (char_length(title) between 5 and 90),
  description             text not null check (char_length(description) between 20 and 2000),

  city                    text not null check (char_length(city) between 2 and 60),
  locality                text not null check (char_length(locality) between 2 and 80),
  public_location_text    text not null check (char_length(public_location_text) between 2 and 140),
  private_address         text check (private_address is null or char_length(private_address) <= 250),

  accommodation_type      public.accommodation_type not null,
  rent_inr                integer not null check (rent_inr between 500 and 1000000),
  deposit_inr             integer check (deposit_inr is null or deposit_inr between 0 and 10000000),
  brokerage_status        public.brokerage_status not null default 'not_specified',
  brokerage_amount_inr    integer check (brokerage_amount_inr is null or brokerage_amount_inr between 0 and 10000000),
  available_from          date not null,
  furnishing              public.furnishing_status not null default 'not_specified',
  bedrooms                smallint check (bedrooms is null or bedrooms between 0 and 20),
  bathrooms               smallint check (bathrooms is null or bathrooms between 0 and 20),
  amenities               text[] not null default '{}',

  -- Contributor identity & contact (PRIVATE; see public_listings view for what is exposed)
  contributor_display_name text not null check (char_length(contributor_display_name) between 2 and 60),
  contact_method          public.contact_method not null,
  contact_value           text not null check (char_length(contact_value) between 5 and 120),
  consent_processing      boolean not null check (consent_processing),
  consent_photo_rights    boolean not null check (consent_photo_rights),
  consent_public_contact  boolean not null default false,
  policy_version          text not null,

  -- Contributor "magic link" for reconfirming availability. Only the hash is stored.
  reconfirm_token_hash    text unique,

  is_demo                 boolean not null default false,

  submitted_at            timestamptz not null default now(),
  approved_at             timestamptz,
  approved_by             uuid references auth.users (id) on delete set null,
  last_confirmed_at       timestamptz,
  expires_at              timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  constraint brokerage_amount_only_when_applies
    check (brokerage_status = 'applies' or brokerage_amount_inr is null)
);

create trigger listings_set_updated_at before update on public.listings
  for each row execute function public.set_updated_at();
create trigger listings_status_guard before update of status on public.listings
  for each row execute function public.enforce_status_transition();

create index listings_status_idx        on public.listings (status);
create index listings_public_filter_idx on public.listings (status, expires_at, rent_inr);
create index listings_city_idx          on public.listings (lower(city));
create index listings_locality_trgm_idx on public.listings using gin (locality gin_trgm_ops);
create index listings_title_trgm_idx    on public.listings using gin (title gin_trgm_ops);
create index listings_expiry_idx        on public.listings (expires_at) where status = 'approved';
create index listings_contact_idx       on public.listings (contact_value);

-- ---------------------------------------------------------------------------
-- Photos (files live in the PRIVATE storage bucket 'listing-photos')
-- ---------------------------------------------------------------------------
create table public.listing_photos (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references public.listings (id) on delete cascade,
  storage_path text not null unique,
  position     smallint not null default 0,
  content_type text not null,
  size_bytes   integer not null check (size_bytes > 0),
  alt_text     text,
  created_at   timestamptz not null default now()
);
create index listing_photos_listing_idx on public.listing_photos (listing_id, position);

-- ---------------------------------------------------------------------------
-- Roommate-seeker profiles (separate from listings on purpose)
-- ---------------------------------------------------------------------------
create table public.roommate_profiles (
  id                      uuid primary key default gen_random_uuid(),
  status                  public.listing_status not null default 'pending_review',
  display_name            text not null check (char_length(display_name) between 2 and 40),
  city                    text not null check (char_length(city) between 2 and 60),
  preferred_localities    text[] not null default '{}',
  budget_min_inr          integer check (budget_min_inr is null or budget_min_inr >= 0),
  budget_max_inr          integer not null check (budget_max_inr between 500 and 1000000),
  move_in_date            date not null,
  accommodation_type      public.accommodation_type,
  seeking                 public.seeking_type not null,
  sharing_preference      public.sharing_preference not null default 'either',
  lifestyle               text[] not null default '{}',
  introduction            text not null check (char_length(introduction) between 20 and 600),
  contact_method          public.contact_method not null,
  contact_value           text not null check (char_length(contact_value) between 5 and 120),
  consent_processing      boolean not null check (consent_processing),
  consent_public_profile  boolean not null check (consent_public_profile),
  consent_public_contact  boolean not null default false,
  policy_version          text not null,
  approved_at             timestamptz,
  expires_at              timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create trigger roommate_profiles_set_updated_at before update on public.roommate_profiles
  for each row execute function public.set_updated_at();
create trigger roommate_profiles_status_guard before update of status on public.roommate_profiles
  for each row execute function public.enforce_status_transition();
create index roommate_profiles_public_idx on public.roommate_profiles (status, expires_at);
create index roommate_profiles_city_idx on public.roommate_profiles (lower(city));

-- ---------------------------------------------------------------------------
-- Renter requirements (always private; never publicly readable)
-- ---------------------------------------------------------------------------
create table public.renter_requirements (
  id                    uuid primary key default gen_random_uuid(),
  status                public.requirement_status not null default 'new',
  city                  text not null check (char_length(city) between 2 and 60),
  preferred_localities  text[] not null default '{}',
  budget_min_inr        integer check (budget_min_inr is null or budget_min_inr >= 0),
  budget_max_inr        integer not null check (budget_max_inr between 500 and 1000000),
  accommodation_types   public.accommodation_type[] not null default '{}',
  move_in_date          date not null,
  furnishing_pref       public.furnishing_status not null default 'not_specified',
  brokerage_pref        public.brokerage_preference not null default 'no_preference',
  notes                 text check (notes is null or char_length(notes) <= 800),
  contact_name          text check (contact_name is null or char_length(contact_name) <= 60),
  contact_method        public.contact_method not null,
  contact_value         text not null check (char_length(contact_value) between 5 and 120),
  consent_processing    boolean not null check (consent_processing),
  consent_contact_me    boolean not null default false,
  policy_version        text not null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create trigger renter_requirements_set_updated_at before update on public.renter_requirements
  for each row execute function public.set_updated_at();
create index renter_requirements_status_idx on public.renter_requirements (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Moderation history, availability, verification, reports, requests, consent
-- ---------------------------------------------------------------------------
create table public.moderation_actions (
  id                  uuid primary key default gen_random_uuid(),
  listing_id          uuid references public.listings (id) on delete cascade,
  roommate_profile_id uuid references public.roommate_profiles (id) on delete cascade,
  moderator_id        uuid references auth.users (id) on delete set null, -- null = contributor or system
  action              public.moderation_action not null,
  from_status         public.listing_status,
  to_status           public.listing_status,
  reason              text check (reason is null or char_length(reason) <= 1000),
  created_at          timestamptz not null default now(),
  constraint moderation_subject_present check (num_nonnulls(listing_id, roommate_profile_id) = 1)
);
create index moderation_actions_listing_idx on public.moderation_actions (listing_id, created_at desc);
create index moderation_actions_roommate_idx on public.moderation_actions (roommate_profile_id, created_at desc);

create table public.availability_confirmations (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid not null references public.listings (id) on delete cascade,
  confirmed_at  timestamptz not null default now(),
  source        public.confirmation_source not null,
  actor_user_id uuid references auth.users (id) on delete set null,
  note          text check (note is null or char_length(note) <= 500)
);
create index availability_confirmations_listing_idx on public.availability_confirmations (listing_id, confirmed_at desc);

create table public.verification_checks (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings (id) on delete cascade,
  check_type  public.check_type not null,
  status      public.check_status not null,
  method      text not null check (char_length(method) between 3 and 200), -- how it was actually checked
  notes       text check (notes is null or char_length(notes) <= 1000),
  reviewer_id uuid references auth.users (id) on delete set null,
  checked_at  timestamptz not null default now()
);
create index verification_checks_listing_idx on public.verification_checks (listing_id, check_type, checked_at desc);

create table public.listing_reports (
  id                uuid primary key default gen_random_uuid(),
  listing_id        uuid not null references public.listings (id) on delete cascade,
  category          public.report_category not null,
  description       text check (description is null or char_length(description) <= 1000),
  reporter_contact  text check (reporter_contact is null or char_length(reporter_contact) <= 120),
  status            public.report_status not null default 'open',
  reviewed_by       uuid references auth.users (id) on delete set null,
  reviewed_at       timestamptz,
  internal_notes    text check (internal_notes is null or char_length(internal_notes) <= 1000),
  created_at        timestamptz not null default now()
);
create index listing_reports_status_idx on public.listing_reports (status, created_at desc);
create index listing_reports_listing_idx on public.listing_reports (listing_id);

create table public.data_requests (
  id            uuid primary key default gen_random_uuid(),
  kind          public.data_request_kind not null,
  listing_id    uuid references public.listings (id) on delete set null,
  message       text not null check (char_length(message) between 5 and 1500),
  contact_value text check (contact_value is null or char_length(contact_value) <= 120),
  status        public.data_request_status not null default 'open',
  handled_by    uuid references auth.users (id) on delete set null,
  handled_at    timestamptz,
  created_at    timestamptz not null default now()
);
create index data_requests_status_idx on public.data_requests (status, created_at desc);

-- Consent records hold NO personal data: only what was agreed to, when, under which policy version.
create table public.consent_records (
  id             uuid primary key default gen_random_uuid(),
  subject_table  text not null check (subject_table in ('listings', 'roommate_profiles', 'renter_requirements')),
  subject_id     uuid not null,
  consent_type   public.consent_type not null,
  granted        boolean not null,
  policy_version text not null,
  created_at     timestamptz not null default now()
);
create index consent_records_subject_idx on public.consent_records (subject_table, subject_id);

-- Anti-abuse: hashed visitor key + action + time. No raw IPs are stored.
create table public.rate_limit_events (
  id         bigserial primary key,
  key_hash   text not null,
  action     text not null,
  created_at timestamptz not null default now()
);
create index rate_limit_events_lookup_idx on public.rate_limit_events (key_hash, action, created_at desc);

-- ---------------------------------------------------------------------------
-- Server-side functions (EXECUTE is granted to service_role only; see 0002)
-- ---------------------------------------------------------------------------
create or replace function public.check_rate_limit(
  p_key text, p_action text, p_max integer, p_window_seconds integer
) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  select count(*) into v_count from public.rate_limit_events
   where key_hash = p_key and action = p_action
     and created_at > now() - make_interval(secs => p_window_seconds);
  if v_count >= p_max then
    return false;
  end if;
  insert into public.rate_limit_events (key_hash, action) values (p_key, p_action);
  return true;
end $$;

-- Atomic status change + history row. p_moderator is null for contributor/system actions.
create or replace function public.moderate_listing(
  p_listing_id uuid,
  p_moderator uuid,
  p_action public.moderation_action,
  p_to public.listing_status,
  p_reason text,
  p_expires_at timestamptz
) returns void
language plpgsql security definer set search_path = public as $$
declare v_from public.listing_status;
begin
  select status into v_from from public.listings where id = p_listing_id for update;
  if not found then
    raise exception 'listing_not_found' using errcode = 'no_data_found';
  end if;
  if not public.listing_transition_allowed(v_from, p_to) then
    raise exception 'illegal_status_transition: % -> %', v_from, p_to using errcode = 'check_violation';
  end if;

  update public.listings set
    status      = p_to,
    approved_at = case when p_action = 'approve' then now() else approved_at end,
    approved_by = case when p_action = 'approve' then p_moderator else approved_by end,
    expires_at  = case when p_to = 'approved' then coalesce(p_expires_at, expires_at) else expires_at end
  where id = p_listing_id;

  insert into public.moderation_actions (listing_id, moderator_id, action, from_status, to_status, reason)
  values (p_listing_id, p_moderator, p_action, v_from, p_to, p_reason);
end $$;

create or replace function public.moderate_roommate_profile(
  p_profile_id uuid,
  p_moderator uuid,
  p_action public.moderation_action,
  p_to public.listing_status,
  p_reason text,
  p_expires_at timestamptz
) returns void
language plpgsql security definer set search_path = public as $$
declare v_from public.listing_status;
begin
  select status into v_from from public.roommate_profiles where id = p_profile_id for update;
  if not found then
    raise exception 'profile_not_found' using errcode = 'no_data_found';
  end if;
  if not public.listing_transition_allowed(v_from, p_to) then
    raise exception 'illegal_status_transition: % -> %', v_from, p_to using errcode = 'check_violation';
  end if;

  update public.roommate_profiles set
    status      = p_to,
    approved_at = case when p_action = 'approve' then now() else approved_at end,
    expires_at  = case when p_to = 'approved' then coalesce(p_expires_at, expires_at) else expires_at end
  where id = p_profile_id;

  insert into public.moderation_actions (roommate_profile_id, moderator_id, action, from_status, to_status, reason)
  values (p_profile_id, p_moderator, p_action, v_from, p_to, p_reason);
end $$;

-- Records "last confirmed available" (distinct from updated_at / "last edited").
create or replace function public.record_availability(
  p_listing_id uuid,
  p_source public.confirmation_source,
  p_actor uuid,
  p_expires_at timestamptz,
  p_note text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.availability_confirmations (listing_id, source, actor_user_id, note)
  values (p_listing_id, p_source, p_actor, p_note);

  update public.listings set
    last_confirmed_at = now(),
    expires_at = case when status in ('approved', 'expired') then coalesce(p_expires_at, expires_at) else expires_at end
  where id = p_listing_id;
end $$;

-- Daily housekeeping: expire stale listings/profiles, purge old rate-limit rows. Returns counts.
create or replace function public.expire_stale_listings() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_listings integer; v_profiles integer; r record;
begin
  v_listings := 0;
  for r in
    update public.listings set status = 'expired'
     where status = 'approved' and expires_at is not null and expires_at <= now()
    returning id
  loop
    insert into public.moderation_actions (listing_id, moderator_id, action, from_status, to_status, reason)
    values (r.id, null, 'expire', 'approved', 'expired', 'Freshness policy: no availability confirmation in time');
    v_listings := v_listings + 1;
  end loop;

  v_profiles := 0;
  for r in
    update public.roommate_profiles set status = 'expired'
     where status = 'approved' and expires_at is not null and expires_at <= now()
    returning id
  loop
    insert into public.moderation_actions (roommate_profile_id, moderator_id, action, from_status, to_status, reason)
    values (r.id, null, 'expire', 'approved', 'expired', 'Profile expiry policy');
    v_profiles := v_profiles + 1;
  end loop;

  delete from public.rate_limit_events where created_at < now() - interval '2 days';

  return jsonb_build_object('listings_expired', v_listings, 'profiles_expired', v_profiles);
end $$;

-- ---------------------------------------------------------------------------
-- Public views — the ONLY objects anon/authenticated may read.
-- Views run with owner rights, so they deliberately select only public-safe columns.
-- NOT exposed: private_address, contact_value, contributor_display_name, reconfirm_token_hash,
--              consent flags, status history, reports.
-- ---------------------------------------------------------------------------
create view public.public_listings as
select
  l.id, l.slug, l.listing_type, l.contributor_type,
  l.title, l.description,
  l.city, l.locality, l.public_location_text,
  l.accommodation_type, l.rent_inr, l.deposit_inr,
  l.brokerage_status, l.brokerage_amount_inr,
  l.available_from, l.furnishing, l.bedrooms, l.bathrooms, l.amenities,
  l.is_demo, l.approved_at, l.last_confirmed_at, l.expires_at,
  case when l.consent_public_contact then l.contact_method end as public_contact_method,
  case when l.consent_public_contact then l.contact_value end  as public_contact_value,
  (select max(v.checked_at) from public.verification_checks v
    where v.listing_id = l.id and v.check_type = 'identity' and v.status = 'passed'
      and not exists (select 1 from public.verification_checks v2
                       where v2.listing_id = l.id and v2.check_type = 'identity' and v2.checked_at > v.checked_at)
  ) as identity_checked_at,
  (select max(v.checked_at) from public.verification_checks v
    where v.listing_id = l.id and v.check_type = 'property' and v.status = 'passed'
      and not exists (select 1 from public.verification_checks v2
                       where v2.listing_id = l.id and v2.check_type = 'property' and v2.checked_at > v.checked_at)
  ) as property_checked_at
from public.listings l
where l.status = 'approved'
  and l.expires_at is not null
  and l.expires_at > now();

create view public.public_listing_photos as
select p.listing_id, p.storage_path, p.position, p.alt_text
from public.listing_photos p
join public.public_listings l on l.id = p.listing_id;

create view public.public_roommate_profiles as
select
  r.id, r.display_name, r.city, r.preferred_localities,
  r.budget_min_inr, r.budget_max_inr, r.move_in_date,
  r.accommodation_type, r.seeking, r.sharing_preference, r.lifestyle, r.introduction,
  r.approved_at, r.expires_at,
  case when r.consent_public_contact then r.contact_method end as public_contact_method,
  case when r.consent_public_contact then r.contact_value end  as public_contact_value
from public.roommate_profiles r
where r.status = 'approved'
  and r.expires_at is not null
  and r.expires_at > now();
