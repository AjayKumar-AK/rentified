-- Nook rentals v0.1 — security: RLS, grants, storage
-- Model: deny by default. All privileged reads/writes happen server-side with the
-- service_role key (which bypasses RLS) AFTER application-level authorization.
-- anon/authenticated may only SELECT the three public_* views.

-- 1. Row Level Security on every base table, with intentionally NO policies.
alter table public.admin_users                enable row level security;
alter table public.listings                   enable row level security;
alter table public.listing_photos             enable row level security;
alter table public.roommate_profiles          enable row level security;
alter table public.renter_requirements        enable row level security;
alter table public.moderation_actions         enable row level security;
alter table public.availability_confirmations enable row level security;
alter table public.verification_checks        enable row level security;
alter table public.listing_reports            enable row level security;
alter table public.data_requests              enable row level security;
alter table public.consent_records            enable row level security;
alter table public.rate_limit_events          enable row level security;

-- 2. Supabase grants broad default privileges to anon/authenticated. Remove them.
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- 3. The only public surface.
grant select on public.public_listings          to anon, authenticated;
grant select on public.public_listing_photos    to anon, authenticated;
grant select on public.public_roommate_profiles to anon, authenticated;

-- 4. Server-side functions: service_role only.
grant execute on function public.check_rate_limit(text, text, integer, integer)                  to service_role;
grant execute on function public.moderate_listing(uuid, uuid, public.moderation_action, public.listing_status, text, timestamptz)           to service_role;
grant execute on function public.moderate_roommate_profile(uuid, uuid, public.moderation_action, public.listing_status, text, timestamptz) to service_role;
grant execute on function public.record_availability(uuid, public.confirmation_source, uuid, timestamptz, text) to service_role;
grant execute on function public.expire_stale_listings()                                         to service_role;
-- Used by the status-guard trigger and the moderation functions.
grant execute on function public.listing_transition_allowed(public.listing_status, public.listing_status) to service_role;

-- 5. Private storage bucket for ALL listing photos (pending and approved).
--    Approved photos are served through short-lived signed URLs minted server-side.
--    Bucket-level limits are enforced by Supabase Storage itself (defence in depth).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- No storage.objects policies are created: anon/authenticated cannot list, read or write objects.
-- Uploads use signed upload URLs created by the server; reads use signed download URLs.
