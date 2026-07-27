-- ============================================================================
-- 00000000000015_course_content_management.sql
-- Lets both admins and providers author full course content: a direct video
-- URL per lesson (works immediately without a Mux account — Mux remains
-- supported via lessons.mux_playback_id for when that's wired up), plus
-- downloadable/linked resources attached to a lesson.
-- ============================================================================

alter table lessons add column if not exists video_url text;

comment on column lessons.video_url is
  'Direct video URL (YouTube/Vimeo/MP4/etc). Preferred over mux_playback_id '
  'by the player when both are set — lets course authors use video today '
  'without a Mux integration.';

create table lesson_resources (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons (id) on delete cascade,
  title text not null,
  url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index lesson_resources_lesson_idx on lesson_resources (lesson_id, position);

alter table lesson_resources enable row level security;

create policy "lesson_resources_preview_public_read" on lesson_resources
  for select using (
    exists (select 1 from lessons l where l.id = lesson_id and l.is_preview)
  );

create policy "lesson_resources_enrolled_read" on lesson_resources
  for select using (
    is_enrolled_in_course((
      select cm.course_id
      from lessons l
      join course_modules cm on cm.id = l.module_id
      where l.id = lesson_id
    ))
  );

create policy "lesson_resources_manage" on lesson_resources
  for all using (has_permission('lms.manage_courses')) with check (has_permission('lms.manage_courses'));

-- Providers author their own course content day-to-day, not just admins.
insert into role_permissions (role, permission_key)
values ('provider', 'lms.manage_courses')
on conflict do nothing;
