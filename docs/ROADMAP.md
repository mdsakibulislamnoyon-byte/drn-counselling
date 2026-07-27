# Development Roadmap

Status: **Phase 0 complete** — this repository is a working, typed, RLS-secured scaffold
(`npm run build` passes) covering every screen and table in the brief, with the integrations
that need real third-party credentials (Stripe, Mux, email) stubbed at a clearly marked seam.
The phases below take it from scaffold to a live, revenue-processing production system.

## Phase 0 — Foundation (done in this PR)

- [x] Next.js 14 / TypeScript / Tailwind project scaffold
- [x] Full Postgres schema + RLS policies (`supabase/migrations/`, 14 files)
- [x] Auth flow: signup → HIPAA e-signature gate → role-based portal
- [x] Patient portal: appointments, encrypted messaging, profile/insurance/emergency contacts
- [x] Provider dashboard: schedule management, patient chart (consents + insurance), messaging
- [x] Student portal: enrollment, drip-locked module player, mark-complete, certificates, mentorship messaging
- [x] Super admin: role/permission management, analytics overview, rosters, course + promo code management
- [x] Stripe Checkout (one-time + installment-subscription) with server-validated promo codes
- [x] Audit log for every PHI-adjacent read/write

## Phase 1 — Stand up real infrastructure

1. Create the Supabase project; run `supabase link` and `supabase db push` to apply
   `supabase/migrations/*.sql` against it.
2. Run `supabase gen types typescript --project-id <ref>` and reconcile with the hand-written
   `src/types/database.ts` (or replace it outright — see the note at the bottom of
   `docs/DATABASE_SCHEMA.md`).
3. Generate `FIELD_ENCRYPTION_KEY` (`openssl rand -base64 32`), set every variable in
   `.env.example` in Vercel + Supabase project settings. Rotate the service-role key out of any
   local `.env` before it ever touches source control.
4. Seed `consent_documents` with the practice's actual HIPAA Acknowledgment and Privacy Consent
   legal text (this gates the entire portal — nothing else in Phase 1 matters if this is empty).
5. Create the first `admin` account by hand (Supabase dashboard → SQL editor:
   `update profiles set role = 'admin' where email = '...'`) — there is intentionally no
   self-service path to admin.
6. Deploy to Vercel, point DNS, confirm `middleware.ts` redirects behave correctly against the
   live Supabase project (not local).

## Phase 2 — Payments & video, for real

1. Stripe: create the account, add the webhook endpoint (`/api/stripe/webhook`) in the Stripe
   dashboard, copy the signing secret into `STRIPE_WEBHOOK_SECRET`. Test with `stripe listen
   --forward-to localhost:3000/api/stripe/webhook` before going live.
2. For each promo code created in `/admin/promo-codes`, optionally mirror it as a real Stripe
   Coupon/PromotionCode and store the id in `promo_codes.stripe_coupon_id` so the discount also
   shows correctly on the Stripe-hosted checkout page.
3. Mux: create an account, upload/transcode course videos, store `mux_asset_id` /
   `mux_playback_id` on each `lessons` row (via a new `/admin/courses/[id]/lessons` editor —
   not yet built; today lesson rows are seeded directly in SQL or a follow-up admin UI).
4. Replace `src/components/student/lesson-video.tsx`'s public HLS URL with
   `@mux/mux-player-react` fed by a signed playback URL minted server-side per request
   (a new `/api/lms/lessons/[id]/playback-url` route that re-checks `lesson_progress.status`
   before signing — the enrollment check that already exists in `/api/lms/lessons/[id]/complete`
   is the pattern to copy).

## Phase 3 — Content & operations tooling

1. Build the course content editor (`/admin/courses/[id]`): add/reorder modules and lessons,
   attach Mux assets, write quiz questions. Phase 0 ships course *creation* and publish/unpublish
   only; full curriculum authoring is the highest-value next admin feature.
2. Build the provider availability editor (`/provider/schedule/availability`) on top of the
   existing `availability_slots` table and its RLS policies — Phase 0 lets a patient request any
   time; a real practice needs the provider to define bookable windows first.
3. Add quiz-taking UI on top of `quizzes`/`quiz_questions`/`quiz_options`/`quiz_attempts` (schema
   is ready; no UI yet) and gate module completion on `passed = true` where a course requires it.
4. Certificate PDF generation: a Route Handler using `@react-pdf/renderer` (or a headless-browser
   HTML→PDF render) triggered from `maybe_complete_enrollment()`'s webhook-adjacent flow,
   uploading to Supabase Storage and writing the URL to `certificates.pdf_url`.

## Phase 4 — Scheduled jobs

Two functions in `supabase/migrations/00000000000013_functions_triggers.sql` are designed to run
on a schedule, not on-demand:

1. **`select unlock_due_lessons();`** — every 15–60 minutes, via a Supabase Edge Function +
   `pg_cron`, or a Vercel Cron Job hitting a small `/api/cron/unlock-lessons` Route Handler that
   calls the same RPC with the service-role client.
2. **Appointment reminders** — a new scheduled job that reads `appointment_reminders` where
   `send_at <= now() and sent_at is null`, sends via Resend/Twilio, and stamps `sent_at`. The
   rows themselves need a populate step too (insert one `appointment_reminders` row — e.g. 24h
   and 1h before `start_time` — whenever an appointment is confirmed).

Protect any `/api/cron/*` route with a shared secret header checked against an env var; Vercel
Cron and Supabase Edge Functions both support custom headers on the trigger request.

## Phase 5 — Compliance hardening before go-live

1. Execute a Business Associate Agreement (BAA) with Supabase and with any email/SMS provider
   that will ever see PHI in a message body — this is a legal/contractual step, not a code change,
   but it gates whether Phase 1–4's infrastructure choices are actually HIPAA-eligible.
2. Enable Supabase's Point-in-Time Recovery and confirm backup retention meets the practice's
   policy.
3. Review `audit_log` retention — the schema never deletes rows; decide the practice's retention
   window and, if needed, add an archival (not deletion) job.
4. Run a third-party security review of the RLS policy set (`docs/DATABASE_SCHEMA.md` →
   "Row Level Security posture") and the encryption implementation
   (`src/lib/encryption.ts`) before handling real patient data.
5. Load-test `/api/checkout` and `/api/stripe/webhook` for idempotency under retry (Stripe retries
   webhooks on non-2xx; confirm double-delivery of `checkout.session.completed` can't create two
   `enrollments` rows — add a unique constraint or an idempotency check keyed on
   `stripe_checkout_session_id` if not already sufficiently covered by the existing
   `payments_checkout_session_idx` unique index).

## Suggested team sequencing

For a solo or small team, Phases 1 → 2 → 5 (infra, payments, compliance) unblock accepting real
patients and real money; Phases 3 → 4 (content tooling, scheduled jobs) can run in parallel once
Phase 1 is live, since they don't block the core patient/payment path.
