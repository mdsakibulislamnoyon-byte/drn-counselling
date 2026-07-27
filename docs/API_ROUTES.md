# API Route Architecture & Authentication Flow

## Authentication flow

1. **Sign up** — `POST` via `supabase.auth.signUp()` client-side (`src/app/(auth)/register/register-form.tsx`),
   with `options.data = { full_name, role: 'patient' | 'student' }`. The `handle_new_auth_user`
   Postgres trigger creates the matching `profiles` row server-side — the client's requested role
   is only ever honored for `patient`/`student`; anything else silently falls back to `patient`,
   so a crafted signup request can't self-elevate to `provider`/`staff`/`admin`.
2. **Session cookies** — `@supabase/ssr` stores the session as httpOnly cookies. `src/middleware.ts`
   refreshes the session on every request (required so Server Components downstream see a valid
   token) and enforces two things before a request reaches a page:
   - **Role match**: is this user's `profiles.role` allowed under the route prefix they're
     hitting (`/portal` → patient, `/provider` → provider/staff/admin, `/student` → student,
     `/admin` → admin)? If not, redirect to their own home.
   - **HIPAA consent**: for `/portal` and `/student`, calls the `has_pending_consent()` SQL
     function; if any current consent document is unsigned, redirect to
     `.../onboarding/consent` before anything else in that portal is reachable.
3. **Every subsequent request** carries the session cookie. Server Components and Route Handlers
   both construct a Supabase client scoped to that session (`src/lib/supabase/server.ts`), so
   **Row Level Security — not application code — is the actual authorization boundary**. A Route
   Handler bug that forgets a `.eq('patient_id', ...)` filter still can't return another patient's
   row, because Postgres itself won't return it for that JWT.
4. **Server-to-server operations** (Stripe/Mux webhooks, scheduled jobs, cross-user admin
   analytics) use `src/lib/supabase/admin.ts`'s service-role client, which bypasses RLS entirely.
   This client is imported in exactly four places today (`stripe/webhook`, `certificates/verify`,
   `audit.ts`, and is intentionally *not* imported anywhere reachable from the browser bundle).

## Route inventory

All routes live under `src/app/api/`. Unless noted, "auth required" means the route calls
`supabase.auth.getUser()` and 401s if there's no session; RLS then further restricts which rows
the query can actually touch or write.

### Consent

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/consent` | POST | required | Records one e-signature per `documentIds[]` against `hipaa_consents`, snapshotting the signed text + IP/user-agent. Writes an `audit_log` row per document. |

### Appointments

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/appointments` | POST | required (patient) | Patient requests an appointment → inserted as `status='requested'`; notifies the provider. |
| `/api/appointments/[id]` | PATCH | required | Updates status/time. RLS decides *who* can actually succeed: patients may only cancel their own row, providers may only update their own, staff/admin with `appointments.manage_all` can do anything. |

### Messaging

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/messages` | GET | required | Lists the caller's conversations with the other participant resolved. |
| `/api/messages` | POST | required | Starts a new conversation + sends the first message (encrypts `body` before insert). |
| `/api/messages/[conversationId]` | GET | required (participant) | Returns decrypted messages; RLS's `is_conversation_participant()` check means a non-participant gets an empty result even before decryption is attempted. |
| `/api/messages/[conversationId]` | POST | required (participant) | Sends a message into an existing thread. |

### Patient profile

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/profile` | PATCH | required | Updates phone/timezone/name on the caller's own `profiles` row. |
| `/api/insurance` | GET / PUT | required | Decrypts/encrypts the caller's primary `insurance_info` row. |
| `/api/emergency-contacts` | GET / POST | required | Lists/adds the caller's `emergency_contacts`. |

### Commerce

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/checkout` | POST | required | Validates an optional promo code server-side, computes net price, creates a Stripe Checkout Session (`mode: 'payment'` one-time or `mode: 'subscription'` for installments), and a `pending` `payments` row. |
| `/api/stripe/webhook` | POST | Stripe signature, not user session | Source of truth for payment status. `checkout.session.completed` → marks payment `succeeded`, creates the `enrollments` row (which cascades to `lesson_progress` via trigger), bumps promo redemption count. `invoice.payment_succeeded`/`failed` → advances/flags `installment_plans`, auto-cancels the subscription once the installment count is reached. |

### LMS

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/lms/lessons/[id]/complete` | POST | required (enrolled student) | Marks a lesson `completed` for the caller's own enrollment (rejects if the lesson isn't unlocked yet), then calls `maybe_complete_enrollment()` — which issues a certificate if that was the last lesson. |
| `/api/certificates/verify/[number]` | GET | public | Service-role lookup returning only certificate number, issue date, course title, and student name — for third-party credential verification, without exposing contact info. |

### Admin

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/admin/users/[id]` | PATCH | required (admin, enforced by RLS) | Changes a user's `role` and/or `user_permission_overrides`. |
| `/api/admin/courses` | POST | required (`lms.manage_courses`) | Creates a draft course. |
| `/api/admin/courses/[id]` | PATCH | required (`lms.manage_courses`) | Publishes/unpublishes a course. |
| `/api/admin/promo-codes` | POST | required (`billing.manage_promo_codes`) | Creates a promo code. |

### Misc

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/contact` | POST | public | Marketing-site contact form. Deliberately doesn't touch the database — pre-account correspondence isn't PHI. |

## Request validation

Every Route Handler that accepts a body validates it with `zod` before touching Supabase —
malformed input 400s before any query runs, and TypeScript infers the parsed shape from the same
schema so there's one source of truth per endpoint.

## Why webhooks and not client-confirmed payment

`/api/checkout` never marks a payment `succeeded` — only `/api/stripe/webhook`, triggered by
Stripe itself after the charge actually clears, does that. This closes the standard "user closes
the tab after paying but before the success redirect fires" gap, and means a client can't forge a
success state by hitting an endpoint directly.
