-- ============================================================================
-- 00000000000001_extensions_and_enums.sql
-- Extensions and shared enum types used across the schema.
-- ============================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid(), digest()
create extension if not exists "citext";     -- case-insensitive email storage

-- Base role every account is assigned at signup. Fine-grained access beyond
-- this (e.g. a specific staff member allowed to view billing) is layered on
-- top via role_permissions / user_permission_overrides (see migration 010).
create type user_role as enum (
  'patient',
  'provider',
  'staff',
  'student',
  'admin'
);

create type appointment_status as enum (
  'requested',
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
);

create type appointment_type as enum (
  'initial_consult',
  'individual_session',
  'family_session',
  'telehealth',
  'in_person'
);

create type enrollment_status as enum (
  'active',
  'completed',
  'refunded',
  'cancelled'
);

create type lesson_progress_status as enum (
  'locked',
  'available',
  'in_progress',
  'completed'
);

create type payment_type as enum (
  'course_purchase',
  'course_installment',
  'patient_copay',
  'patient_invoice'
);

create type payment_status as enum (
  'pending',
  'succeeded',
  'failed',
  'refunded',
  'partially_refunded'
);

create type discount_type as enum (
  'percent',
  'fixed_amount'
);

create type notification_channel as enum (
  'in_app',
  'email',
  'sms'
);

-- Generic "updated_at" trigger reused by every table with that column.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
