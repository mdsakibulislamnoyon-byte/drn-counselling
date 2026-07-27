-- ============================================================================
-- 00000000000007_courses_lms.sql
-- Course catalog: courses -> modules -> lessons, with optional quizzes.
-- Video is hosted on Mux; we only store the playback/asset id.
-- ============================================================================

create table courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  description_md text not null default '',
  thumbnail_url text,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'usd',
  -- Number of days after enrollment before module N unlocks = (n - 1) * drip_interval_days.
  drip_interval_days integer not null default 7,
  -- Months of included post-completion mentorship messaging (default: 1 year).
  mentorship_months integer not null default 12,
  is_published boolean not null default false,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index courses_published_idx on courses (is_published);

create trigger courses_set_updated_at
  before update on courses
  for each row execute function set_updated_at();

create table course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses (id) on delete cascade,
  title text not null,
  position integer not null,
  -- Overrides course.drip_interval_days if set; otherwise computed as
  -- (position - 1) * course.drip_interval_days.
  drip_day_offset integer,
  unique (course_id, position)
);

create index course_modules_course_idx on course_modules (course_id, position);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references course_modules (id) on delete cascade,
  title text not null,
  position integer not null,
  content_md text,
  mux_asset_id text,
  mux_playback_id text,
  duration_seconds integer,
  is_preview boolean not null default false, -- viewable pre-purchase (marketing)
  unique (module_id, position)
);

create index lessons_module_idx on lessons (module_id, position);

create table quizzes (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references course_modules (id) on delete cascade,
  title text not null,
  passing_score_percent integer not null default 80,
  max_attempts integer not null default 3
);

create table quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes (id) on delete cascade,
  position integer not null,
  prompt text not null,
  unique (quiz_id, position)
);

create table quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references quiz_questions (id) on delete cascade,
  position integer not null,
  label text not null,
  is_correct boolean not null default false,
  unique (question_id, position)
);

create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes (id) on delete cascade,
  student_id uuid not null references profiles (id) on delete cascade,
  score_percent integer not null,
  passed boolean not null,
  answers jsonb not null default '{}', -- { question_id: option_id }
  attempted_at timestamptz not null default now()
);

create index quiz_attempts_student_idx on quiz_attempts (student_id, quiz_id);
