# Rentified — Version 0.1

A community-powered rental directory for India: browse approved rentals, share a property or room, create roommate-seeker profiles, register renter requirements, report problems, and moderate everything from a private dashboard.

Stack: Next.js (App Router) · React · strict TypeScript · Supabase (Postgres, Storage, Auth) · Vercel.

> **Status: written but not yet built.** This code was produced in a sandbox with no npm access, so `npm install`, `next build`, ESLint and the full test run have **not** been executed. See *What has and has not been verified* below. Expect to fix a few small type/lint errors on first build.

## 1. Quick start

```bash
npm install
cp .env.example .env.local     # fill in the values (section 3)
npm run typecheck && npm run lint && npm test && npm run build
npm run dev                    # http://localhost:3000
```

Without Supabase credentials the site renders (landing page, forms, static pages), but browsing shows "not connected" and submissions are refused with a clear message. Nothing is silently faked or kept in memory.

## 2. Supabase setup

1. Create a project at supabase.com (free tier is fine to start; check current limits — free projects pause after inactivity and have storage/database size caps).
2. SQL editor → run, in order: `supabase/migrations/0001_schema.sql`, then `0002_security.sql`. (Or `supabase db push` with the CLI.)
3. Confirm the private storage bucket `listing-photos` exists (the migration creates it, `public = false`, 5 MB, jpeg/png/webp).
4. Copy the URL, anon key and service-role key into `.env.local`.
5. Run `npm run check:rls` — it uses only the anon key and must print "All anonymous-access checks passed".

### Security model
- Row Level Security is enabled on every table with **no policies**, and all table privileges are revoked from `anon`/`authenticated`. Visitors can read only three views: `public_listings`, `public_listing_photos`, `public_roommate_profiles`.
- Those views select only public-safe columns and only `approved`, unexpired rows. Contact values appear only when `consent_public_contact` is true. Private address, contributor name/contact, tokens and consent flags are never in a view.
- All writes and privileged reads use the service-role key **on the server only** (never `NEXT_PUBLIC_`). Moderator actions re-check authorization server-side on every call.
- Status changes go through `moderate_listing()` (atomic, writes history) and a DB trigger rejects illegal transitions. Clients cannot set status.
- Photos live in a private bucket; the browser uploads via short-lived signed upload URLs, the server re-verifies each object (existence, size, MIME), and public pages use short-lived signed download URLs for approved listings only.
- Known Supabase caveat: the public views run with owner rights by design; the Supabase linter may flag them as "security definer views". That is intentional here — they are the narrow, reviewed public surface.

## 3. Environment variables

See `.env.example`. Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (secret), `NEXT_PUBLIC_SITE_URL`, `RATE_LIMIT_SALT`, `CRON_SECRET`. Optional freshness settings: `FRESHNESS_STALE_AFTER_DAYS` (7), `FRESHNESS_EXPIRE_AFTER_DAYS` (14), `ROOMMATE_PROFILE_EXPIRE_AFTER_DAYS` (30) — defaults, not universal facts.

## 4. Granting administrator access

There is no admin signup and no hardcoded password.
1. Supabase → Authentication → Users → *Add user* (email + strong password; use "Auto confirm").
2. SQL editor: `insert into public.admin_users (user_id) select id from auth.users where email = 'you@example.com';`
3. Sign in at `/admin/login`. Anyone signed in but not in `admin_users` is refused. If env vars are missing, the page says admin access is not set up.
4. To revoke: `delete from public.admin_users where user_id = '…';`

## 5. Demo data (development only)

```bash
# .env.local → ALLOW_DEMO_SEED=true
npm run seed:demo          # 3 fictional listings, is_demo = true, no photos, no public contact
npm run seed:demo:remove
```
The script refuses to run unless `ALLOW_DEMO_SEED=true` and not in production. Demo listings are labelled "Demo" everywhere.

## 6. Freshness & expiry

Approval sets "last confirmed available" and `expires_at = now + expire_after_days`. The public views hide a listing the moment `expires_at` passes; a daily Vercel Cron (`vercel.json` → `/api/cron/expire`, protected by `CRON_SECRET`) flips status to `expired` and logs it. Contributors reconfirm or take down via the private `/manage/<token>` link shown once after submission (only a hash is stored). "Last confirmed" and "last edited" are separate fields.

## 7. Deployment (Vercel)

1. Push to GitHub, import the repo in Vercel (free Hobby tier; check current limits — Hobby cron runs once per day).
2. Add the env vars from section 3 (set `NEXT_PUBLIC_SITE_URL` to the Vercel URL). Mark the service-role key and `CRON_SECRET` as sensitive.
3. Deploy, then run `npm run check:rls` against production values, create your admin (section 4), and submit one real test listing end-to-end.
4. Use the temporary `*.vercel.app` URL; do not buy a domain yet.

## 8. Routes

Public: `/`, `/rentals`, `/rentals/[slug]`, `/share`, `/share/property`, `/share/room`, `/roommates`, `/roommates/new`, `/looking`, `/help`, `/contact`, `/privacy`, `/terms`, `/manage/[token]` (private). Admin: `/admin/login`, `/admin`, `/admin/listings`, `/admin/listings/[id]`, `/admin/reports`, `/admin/roommates`, `/admin/requests`, `/admin/requirements`.

## 9. Localization

All UI strings are in `src/messages/en.ts`; add sibling catalogues (ta, kn, te, ml, hi) with the same shape and register them in `src/messages/index.ts`. User-submitted text is never translated. No language selector yet.

## 10. What has and has not been verified

**Actually run in the build sandbox:**
- Both SQL migrations applied cleanly to a fresh PostgreSQL 16 (with stubbed Supabase `auth`/`storage` schemas and roles).
- `supabase/tests/rls.sql` passed: anon cannot read/write any base table or call server functions; public views show only approved, unexpired rows; contact only with consent; no private columns on views; illegal status transitions rejected (also for the service role). The test was shown to fail when a table grant or a leaky view column was introduced.
- Server functions exercised: approve, illegal-transition rejection, availability confirmation, expiry, rate limiting.
- 47 unit tests (validation, contact normalization, freshness, transitions incl. SQL-parity check, warnings, formatting) passed using a minimal runner shim in place of vitest — **not** vitest itself.
- Strict `tsc` passed on the pure-logic modules and their tests. All other files were only syntax-checked.

**Not run (needs your machine / Supabase):** `npm install`, `next build`, `next lint`, type-checking of React/Next/Supabase-dependent files, real Supabase Auth/Storage/PostgREST behaviour (signed upload/download URLs, the `list()` metadata the upload verification relies on, `.or()` search filters), browser/mobile layout and accessibility checks, Vercel deployment.

## 11. Known limitations & launch risks
- First build may surface type/lint errors in untested files — fix, then re-run all checks.
- Rate limiting is DB-backed and keyed on `x-forwarded-for`; adequate for an experiment, not for determined abuse. No CAPTCHA.
- No Content-Security-Policy header yet.
- Photo checks trust Storage metadata (size/MIME); there is no image scanning or EXIF stripping — location metadata in photos is not removed.
- Contact is shown only if the contributor opts in; there is no relay/enquiry form yet, so private-contact listings cannot be contacted.
- No email notifications. Contributors rely on their saved private link.
- Privacy policy and terms are plain-language drafts and have **not had legal review** (Indian data-protection, consumer and housing rules must be checked before public launch). Retention periods for private data are not finalised.
- No automated analytics; the admin overview shows real counts only.
