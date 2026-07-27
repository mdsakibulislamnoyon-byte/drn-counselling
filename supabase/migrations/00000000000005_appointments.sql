-- ============================================================================
-- 00000000000005_appointments.sql
-- Provider availability, blocked time, and patient appointments.
-- ============================================================================

create table availability_slots (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references profiles (id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  -- true = provider blocked this time off (vacation, admin time); the slot
  -- is never offered for booking even though it "exists" on the calendar.
  is_blocked boolean not null default false,
  recurrence_rule text, -- iCal RRULE for recurring weekly availability
  created_at timestamptz not null default now(),
  constraint availability_time_order check (end_time > start_time)
);

create index availability_slots_provider_idx on availability_slots (provider_id, start_time);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references profiles (id) on delete cascade,
  provider_id uuid not null references profiles (id) on delete restrict,
  status appointment_status not null default 'requested',
  type appointment_type not null default 'individual_session',
  start_time timestamptz not null,
  end_time timestamptz not null,
  is_telehealth boolean not null default true,
  telehealth_link text,
  location text,
  patient_notes text,      -- what the patient shared when requesting
  provider_notes_encrypted bytea, -- clinical notes; PHI, encrypted app-side
  cancelled_by uuid references profiles (id),
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointment_time_order check (end_time > start_time)
);

create index appointments_patient_idx on appointments (patient_id, start_time);
create index appointments_provider_idx on appointments (provider_id, start_time);
create index appointments_status_idx on appointments (status);

create trigger appointments_set_updated_at
  before update on appointments
  for each row execute function set_updated_at();

create table appointment_reminders (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments (id) on delete cascade,
  channel notification_channel not null default 'email',
  send_at timestamptz not null,
  sent_at timestamptz,
  status text not null default 'scheduled', -- scheduled | sent | failed | cancelled
  created_at timestamptz not null default now()
);

create index appointment_reminders_send_at_idx
  on appointment_reminders (send_at)
  where sent_at is null;
