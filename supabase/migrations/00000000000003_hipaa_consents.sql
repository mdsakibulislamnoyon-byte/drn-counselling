-- ============================================================================
-- 00000000000003_hipaa_consents.sql
-- Immutable audit trail of HIPAA Acknowledgment / Privacy Consent signatures.
-- A patient cannot reach the portal until a row exists here for the current
-- document_version (enforced in application middleware, see src/lib/auth).
-- ============================================================================

create table consent_documents (
  id uuid primary key default gen_random_uuid(),
  document_type text not null,       -- 'hipaa_acknowledgment' | 'privacy_consent' | 'telehealth_consent'
  version text not null,             -- e.g. '2026-01'
  title text not null,
  body_md text not null,             -- full legal text shown to the user at signing time
  is_current boolean not null default true,
  published_at timestamptz not null default now(),
  unique (document_type, version)
);

-- Only one "current" version per document_type at a time.
create unique index consent_documents_current_idx
  on consent_documents (document_type)
  where is_current;

create table hipaa_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  consent_document_id uuid not null references consent_documents (id),
  -- Snapshot of the exact text the user agreed to, independent of later edits
  -- to consent_documents.body_md — required for a defensible audit trail.
  body_md_snapshot text not null,
  signature_full_name text not null,   -- typed e-signature
  signed_at timestamptz not null default now(),
  ip_address inet,
  user_agent text,
  revoked_at timestamptz,
  revoked_reason text
);

create index hipaa_consents_user_idx on hipaa_consents (user_id);
create index hipaa_consents_document_idx on hipaa_consents (consent_document_id);

comment on table hipaa_consents is
  'Append-only compliance record. Rows are never updated except to set revoked_at; '
  'a new consent event always inserts a new row.';

-- Used by middleware.ts to gate /portal and /student until every current
-- consent document has been signed by the calling user.
create or replace function has_pending_consent()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from consent_documents cd
    where cd.is_current
      and not exists (
        select 1 from hipaa_consents hc
        where hc.consent_document_id = cd.id
          and hc.user_id = auth.uid()
          and hc.revoked_at is null
      )
  );
$$;

grant execute on function has_pending_consent() to authenticated;
