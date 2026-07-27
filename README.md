# Dominik Nicotera Counselling

A custom-coded web application and Learning Management System for a mental health counseling
practice: a public marketing site, a HIPAA-gated patient portal, a provider/staff dashboard, a
drip-content LMS academy for clinician trainees, and a super admin control panel.

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Supabase (Postgres + Auth +
Row Level Security). See `docs/` for the full architectural writeup.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — tech stack, directory layout, role-based
  access model, HIPAA consent flow, what's stubbed vs. production-ready.
- [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) — full schema walkthrough, ERD, and the
  Row Level Security posture that makes multi-role PHI access defensible.
- [`docs/API_ROUTES.md`](docs/API_ROUTES.md) — every API route, its auth requirement, and the
  end-to-end authentication flow.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — phased path from this scaffold to a live,
  revenue-processing production deployment.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Stripe + Mux credentials
npm run dev
```

Apply the database schema to a Supabase project:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Other scripts:

```bash
npm run build       # production build (also runs lint + typecheck)
npm run typecheck    # tsc --noEmit only
npm run lint         # next lint only
```

## Project structure

```
src/app/          Next.js App Router routes — marketing site, auth, and 4 role-based portals
src/components/    UI components, grouped by area (marketing, dashboard, messaging, consent...)
src/lib/           Supabase clients, auth/permission helpers, encryption, audit logging, Stripe
src/types/         Hand-maintained TypeScript mirror of the SQL schema
supabase/migrations/  14 ordered SQL migrations: schema, RLS policies, functions/triggers, seed data
docs/              Architecture, schema, API, and roadmap documentation
```
