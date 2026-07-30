# Architecture

Web application and Learning Management System for Dominick Nicotera's mental health
counseling practice: a public marketing site, a HIPAA-gated patient portal, a provider/staff
dashboard, a drip-content LMS for clinician trainees, and a super admin control panel — one
Next.js codebase, one Postgres database, role-based access enforced at the database layer.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14 (App Router)** + React 18 + TypeScript | Server Components keep PHI-adjacent queries off the client bundle; Route Handlers give us a real backend without a second service. |
| Styling | **Tailwind CSS** | Fast to iterate, no component library lock-in, easy to hand to a designer later. |
| Database | **Supabase (Postgres)** | Managed Postgres + built-in auth + Row Level Security, which is what makes multi-role PHI access defensible without hand-rolling an authorization layer. |
| Auth | **Supabase Auth** (`@supabase/ssr`) | Cookie-based sessions that work across Server Components, Route Handlers, and middleware. |
| Payments | **Stripe** (Checkout + Webhooks) | PCI scope stays with Stripe entirely; we never touch card data. |
| Video | **Mux** | Signed playback + per-asset access control fits "video unlocks over time" better than a generic file host. |
| Email | **Resend** (stubbed) | Transactional email for reminders, receipts, certificates. |
| Hosting | **Vercel** (app) + **Supabase Cloud** (DB/auth/storage) | Both have generous free tiers for a practice this size and scale to paid tiers without a re-platform. |

Nothing here is exotic on purpose: every layer is something one full-stack engineer can operate
without a platform team.

## Why Supabase + RLS instead of a custom Node/Express backend

The brief asks for "encrypted database fields... for HIPAA-compliant handling." The two things
that actually make a system defensible in a compliance audit are: **(1) authorization decisions
that can't be bypassed by an API bug**, and **(2) an audit trail of who touched what**. Postgres
Row Level Security gives us (1) as a database-enforced guarantee — even a bug in a Route Handler
that forgets an `.eq('patient_id', ...)` filter still can't leak another patient's row, because
the database itself won't return it. A hand-rolled Express + raw-SQL backend would require every
single query to remember to apply that filter correctly, forever. See `supabase/migrations/*.sql`
for the full policy set and `docs/DATABASE_SCHEMA.md` for the reasoning table-by-table.

Field-level AES-256-GCM encryption (`src/lib/encryption.ts`) is layered on top of RLS for the
handful of columns that are sensitive even to someone who has legitimate row access at rest —
insurance policy numbers, message bodies, clinical notes — so a database dump or misconfigured
backup doesn't expose plaintext PHI.

## Directory layout

```
src/
  app/
    (marketing)/          Public site: home, about, services, courses, contact, FAQ
    (auth)/                register, login
    portal/                Patient portal (role: patient)
      onboarding/consent/  HIPAA gate — see middleware.ts
    provider/              Provider/staff dashboard (roles: provider, staff, admin)
    student/               LMS / student portal (role: student)
      onboarding/consent/
    admin/                 Super Admin dashboard (role: admin)
    api/                   Route Handlers — see docs/API_ROUTES.md
  components/
    marketing/ dashboard/ messaging/ consent/ portal/ student/
  lib/
    supabase/              client.ts (browser) · server.ts (SSR) · admin.ts (service role)
    auth.ts                requireRole(), hasCurrentConsent()
    permissions.ts         hasPermission() — reads the effective_permissions view
    encryption.ts          AES-256-GCM field encryption + Postgres bytea hex helpers
    audit.ts               logAudit() — writes to audit_log
    stripe.ts
  middleware.ts             Route protection + HIPAA consent gate
  types/database.ts         Hand-maintained mirror of the SQL schema
supabase/
  migrations/                14 ordered SQL files — see docs/DATABASE_SCHEMA.md
```

## Role-based access model

Five roles (`profiles.role`): `patient`, `provider`, `staff`, `student`, `admin`. Self-service
signup can only create `patient` or `student` accounts (enforced in the `handle_new_auth_user`
trigger, not just the UI) — `provider`/`staff`/`admin` accounts are created by an admin promoting
an existing account from `/admin/users`.

Route protection happens twice, deliberately:

1. **`src/middleware.ts`** — coarse-grained. Redirects unauthenticated users to `/login`, and
   redirects a signed-in user whose role doesn't match a route prefix (`/portal`, `/provider`,
   `/student`, `/admin`) back to their own home. Also enforces the HIPAA consent gate: a
   `patient`/`student` with an unsigned current consent document is redirected to
   `.../onboarding/consent` before reaching any other page under their portal.
2. **Row Level Security policies** — fine-grained, and the one that actually matters for
   security. Every table lists exactly which roles/permissions can select/insert/update which
   rows (`supabase/migrations/00000000000012_rls_policies.sql`). Middleware is a UX nicety;
   RLS is the security boundary.

On top of the five base roles, `role_permissions` + `user_permission_overrides` (migration 010)
let an admin grant a specific staff member an individual capability — e.g. "can view insurance"
— without inventing a sixth role. `src/lib/permissions.ts#hasPermission()` reads the flattened
`effective_permissions` view.

## HIPAA consent flow

1. `consent_documents` holds the current HIPAA Acknowledgment / Privacy Consent text
   (`is_current = true`, one row per `document_type`).
2. On signup, `middleware.ts` calls the `has_pending_consent()` SQL function on every request
   into `/portal` or `/student`. Any current document not yet signed by that user redirects them
   to the consent onboarding page.
3. `HipaaConsentForm` (`src/components/consent/hipaa-consent-form.tsx`) renders the full legal
   text, requires a typed full-name e-signature + an explicit checkbox, then POSTs to
   `/api/consent`.
4. `/api/consent` snapshots the *exact* text signed (`body_md_snapshot`), the signer's name,
   server timestamp, IP, and user-agent into `hipaa_consents` — an append-only table (no update
   policy except `revoked_at`) — and writes an `audit_log` row. That snapshot is what a compliance
   review reads, independent of any later edits to the document template.

## Encrypted messaging

`messages.body_encrypted` is `bytea`, AES-256-GCM-encrypted server-side before insert
(`src/lib/encryption.ts`). Nothing decrypts it except a Route Handler holding
`FIELD_ENCRYPTION_KEY` — RLS restricts *which rows* a user can reach, encryption protects the
*content* even from someone who reaches the row outside the app (e.g. a raw DB export). The same
pattern covers `insurance_info` and `appointments.provider_notes_encrypted`.

## Payments & the LMS drip engine

- **Checkout** (`/api/checkout`) validates a promo code server-side against `promo_codes`
  (never exposed via a public RLS select policy, so codes aren't enumerable), computes the net
  price, and creates a Stripe Checkout Session — `mode: 'payment'` for one-time, `mode:
  'subscription'` for installments.
- **`/api/stripe/webhook`** is the only writer of `payments.status`. On
  `checkout.session.completed` it creates the `enrollments` row, which fires the
  `enrollments_initialize_progress` trigger (migration 013) to seed a `lesson_progress` row per
  lesson — locked or available depending on each module's drip offset.
- **Drip unlock** is date-driven, not polling-driven from the client: `unlock_due_lessons()` is
  a SQL function meant to run on a scheduled Edge Function / cron every 15–60 minutes (see
  `docs/ROADMAP.md` phase 4), flipping `lesson_progress.status` to `available` once
  `enrollments.drip_anchor_at + module.drip_day_offset` has passed, and queuing a notification.
- **Certificates** issue automatically: `maybe_complete_enrollment()` runs after every
  "mark lesson complete" API call and, once every lesson in the course is `completed`, inserts a
  `certificates` row with a generated certificate number and a `mentorship_expires_at` date
  (enrollment completion + `courses.mentorship_months`).

## What's a stub vs. production-ready here

This repo is a working, typed, RLS-secured scaffold — `npm run build` passes clean — not a
finished production deployment. Explicitly stubbed, with the real integration point marked in
code:

- **Mux playback** (`src/components/student/lesson-video.tsx`) uses a public HLS URL; production
  needs signed playback URLs issued server-side per request, since course video is paid content.
- **Email** (`/api/contact`, appointment reminders) logs instead of sending; wire up
  `RESEND_API_KEY`.
- **Appointment reminders** (`appointment_reminders` table) has no sender job yet — same cron
  pattern as the drip unlock.
- **Certificate PDFs** — `certificates.pdf_url` is populated by a generation job (e.g.
  `@react-pdf/renderer` in a Route Handler) that isn't wired up yet.

See `docs/ROADMAP.md` for the phase these land in.
