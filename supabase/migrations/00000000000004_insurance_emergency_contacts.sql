-- ============================================================================
-- 00000000000004_insurance_emergency_contacts.sql
-- PHI-adjacent patient profile data. Sensitive columns are stored as bytea,
-- encrypted application-side (see src/lib/encryption.ts) before insert, using
-- FIELD_ENCRYPTION_KEY (AES-256-GCM). Supabase transport is TLS by default,
-- so this covers "encrypted at rest" for the specific columns HIPAA scopes
-- as sensitive, on top of Postgres's own at-rest disk encryption.
-- ============================================================================

create table insurance_info (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references profiles (id) on delete cascade,
  provider_name_encrypted bytea not null,
  policy_number_encrypted bytea not null,
  group_number_encrypted bytea,
  subscriber_name_encrypted bytea not null,
  subscriber_dob_encrypted bytea,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index insurance_info_patient_idx on insurance_info (patient_id);

create trigger insurance_info_set_updated_at
  before update on insurance_info
  for each row execute function set_updated_at();

create table emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references profiles (id) on delete cascade,
  full_name text not null,
  relationship text not null,
  phone text not null,
  email citext,
  created_at timestamptz not null default now()
);

create index emergency_contacts_patient_idx on emergency_contacts (patient_id);

-- Patient payment methods are never stored locally — only a pointer to the
-- Stripe Customer/PaymentMethod object, which itself is PCI-scoped to Stripe.
create table patient_payment_methods (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references profiles (id) on delete cascade,
  stripe_customer_id text not null,
  stripe_payment_method_id text not null,
  brand text,
  last4 text,
  exp_month smallint,
  exp_year smallint,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index patient_payment_methods_patient_idx on patient_payment_methods (patient_id);
