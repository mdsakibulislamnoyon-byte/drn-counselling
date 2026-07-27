-- ============================================================================
-- 00000000000008_enrollments_progress_certificates.sql
-- Enrollment, drip-unlock progress tracking, and certificate issuance.
-- ============================================================================

create table enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles (id) on delete cascade,
  course_id uuid not null references courses (id) on delete restrict,
  status enrollment_status not null default 'active',
  payment_id uuid, -- fk added in migration 009 after payments exists
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  -- Drip schedule is anchored here so a course's drip_interval_days can
  -- change later without shifting already-enrolled students' unlock dates.
  drip_anchor_at timestamptz not null default now(),
  unique (student_id, course_id)
);

create index enrollments_student_idx on enrollments (student_id);
create index enrollments_course_idx on enrollments (course_id);

alter table conversations
  add constraint conversations_enrollment_fkey
  foreign key (related_enrollment_id) references enrollments (id) on delete set null;

create table lesson_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references enrollments (id) on delete cascade,
  lesson_id uuid not null references lessons (id) on delete cascade,
  status lesson_progress_status not null default 'locked',
  unlocked_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  watch_seconds integer not null default 0,
  unique (enrollment_id, lesson_id)
);

create index lesson_progress_enrollment_idx on lesson_progress (enrollment_id);

create table certificates (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references enrollments (id) on delete cascade unique,
  certificate_number text not null unique,
  issued_at timestamptz not null default now(),
  pdf_url text,
  -- Mentorship messaging with Dominik is available until this date
  -- (courses.mentorship_months after issuance).
  mentorship_expires_at timestamptz not null
);

create index certificates_enrollment_idx on certificates (enrollment_id);

-- Human-friendly, collision-resistant certificate numbers, e.g. DRN-2026-000482.
create or replace function generate_certificate_number()
returns text
language sql
as $$
  select 'DRN-' || to_char(now(), 'YYYY') || '-' ||
         lpad((floor(random() * 999999))::text, 6, '0');
$$;
