-- ============================================================================
-- 00000000000011_notifications_audit_log.sql
-- In-app/email notification queue and the HIPAA-required access audit trail.
-- ============================================================================

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  channel notification_channel not null default 'in_app',
  type text not null, -- 'appointment_reminder' | 'new_message' | 'module_unlocked' | 'certificate_ready' | ...
  title text not null,
  body text,
  link_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on notifications (user_id, is_read, created_at desc);

-- Append-only. Every read/write touching PHI-adjacent tables (consents,
-- insurance_info, appointments.provider_notes_encrypted, messages) is logged
-- here by the API layer (src/lib/audit.ts) for compliance review.
create table audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references profiles (id),
  action text not null,        -- 'view' | 'create' | 'update' | 'delete' | 'export'
  entity_type text not null,   -- 'hipaa_consent' | 'insurance_info' | 'appointment' | 'message' | ...
  entity_id uuid,
  metadata jsonb not null default '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index audit_log_actor_idx on audit_log (actor_id, created_at desc);
create index audit_log_entity_idx on audit_log (entity_type, entity_id);

-- Defense in depth: no update/delete on audit_log, even for the table owner
-- role used by the service client, short of a superuser migration.
revoke update, delete on audit_log from public;
