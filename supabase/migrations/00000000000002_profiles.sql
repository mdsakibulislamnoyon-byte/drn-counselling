-- ============================================================================
-- 00000000000002_profiles.sql
-- One row per auth.users account. Holds the role used for RBAC everywhere
-- else in the schema, plus non-clinical identity fields.
-- ============================================================================

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'patient',
  full_name text not null,
  email citext not null,
  phone text,
  avatar_url text,
  timezone text not null default 'America/New_York',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_email_idx on profiles (email);
create index profiles_role_idx on profiles (role);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Auto-create a profile row whenever a new Supabase auth user is created.
-- Role defaults to 'patient' and is elevated later by an admin via the
-- Super Admin Dashboard (see role_permissions in migration 010).
create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    -- Self-service signup may only ever create a patient or student account.
    -- provider/staff/admin accounts are elevated later by an admin via the
    -- Super Admin Dashboard (role_permissions / profiles RLS restricts this).
    case when requested_role = 'student' then 'student'::user_role else 'patient'::user_role end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- Extended, provider-only profile fields (credentials, specialties, bio).
create table provider_profiles (
  id uuid primary key references profiles (id) on delete cascade,
  credentials text,               -- e.g. "LPC, PhD"
  license_number_encrypted bytea, -- pgsodium/pgcrypto-encrypted at write time
  license_state text,
  specialties text[] not null default '{}',
  bio text,
  accepting_new_patients boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger provider_profiles_set_updated_at
  before update on provider_profiles
  for each row execute function set_updated_at();

comment on table profiles is 'One row per authenticated user; role drives RBAC across the app.';
comment on table provider_profiles is 'Public-facing bio/credentials for staff shown on the marketing site.';
