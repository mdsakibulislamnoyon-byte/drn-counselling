-- ============================================================================
-- 00000000000013_functions_triggers.sql
-- Drip-content unlock logic and course-completion -> certificate issuance.
-- ============================================================================

-- When a student enrolls, create a locked lesson_progress row for every
-- lesson in the course, then immediately unlock whatever is due at t=0
-- (module 1 is always drip_day_offset 0 unless overridden).
create or replace function initialize_enrollment_progress()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into lesson_progress (enrollment_id, lesson_id, status, unlocked_at)
  select
    new.id,
    l.id,
    case
      when coalesce(cm.drip_day_offset, (cm.position - 1) * c.drip_interval_days) <= 0
        then 'available'::lesson_progress_status
      else 'locked'::lesson_progress_status
    end,
    case
      when coalesce(cm.drip_day_offset, (cm.position - 1) * c.drip_interval_days) <= 0
        then new.drip_anchor_at
      else null
    end
  from course_modules cm
  join lessons l on l.module_id = cm.id
  join courses c on c.id = cm.course_id
  where cm.course_id = new.course_id;

  return new;
end;
$$;

create trigger enrollments_initialize_progress
  after insert on enrollments
  for each row execute function initialize_enrollment_progress();

-- Run on a scheduled Edge Function / cron (see docs/ROADMAP.md phase 4) to
-- unlock any module whose drip offset has now elapsed for active enrollments.
create or replace function unlock_due_lessons()
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  unlocked_count integer;
begin
  with due as (
    select lp.id
    from lesson_progress lp
    join enrollments e on e.id = lp.enrollment_id
    join lessons l on l.id = lp.lesson_id
    join course_modules cm on cm.id = l.module_id
    join courses c on c.id = cm.course_id
    where lp.status = 'locked'
      and e.status = 'active'
      and now() >= e.drip_anchor_at
        + make_interval(days => coalesce(cm.drip_day_offset, (cm.position - 1) * c.drip_interval_days))
  )
  update lesson_progress
  set status = 'available', unlocked_at = now()
  where id in (select id from due);

  get diagnostics unlocked_count = row_count;

  -- Notify students whose module just unlocked.
  insert into notifications (user_id, type, title, body, link_url)
  select distinct e.student_id, 'module_unlocked', 'A new module just unlocked',
    c.title || ' has new content available.', '/portal/courses/' || c.slug
  from lesson_progress lp
  join enrollments e on e.id = lp.enrollment_id
  join lessons l on l.id = lp.lesson_id
  join course_modules cm on cm.id = l.module_id
  join courses c on c.id = cm.course_id
  where lp.status = 'available'
    and lp.unlocked_at >= now() - interval '5 minutes';

  return unlocked_count;
end;
$$;

-- Atomically bumps a promo code's redemption counter. Called from the
-- Stripe webhook handler (service role) after a checkout using that code
-- completes successfully.
create or replace function increment_promo_redemption(promo_id uuid)
returns void
language sql
security definer set search_path = public
as $$
  update promo_codes set times_redeemed = times_redeemed + 1 where id = promo_id;
$$;

-- Marks an enrollment completed and issues a certificate once every lesson
-- in the course has status = 'completed'. Called from the API route that
-- marks a lesson complete (src/app/api/lms/lessons/[id]/complete/route.ts)
-- after updating lesson_progress, wrapped in the same transaction.
create or replace function maybe_complete_enrollment(target_enrollment_id uuid)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  total_lessons integer;
  completed_lessons integer;
  target_course_id uuid;
  mentorship_months integer;
begin
  select count(*) into total_lessons
  from lesson_progress where enrollment_id = target_enrollment_id;

  select count(*) into completed_lessons
  from lesson_progress where enrollment_id = target_enrollment_id and status = 'completed';

  if total_lessons = 0 or completed_lessons < total_lessons then
    return false;
  end if;

  select course_id into target_course_id from enrollments where id = target_enrollment_id;
  select c.mentorship_months into mentorship_months from courses c where c.id = target_course_id;

  update enrollments
  set status = 'completed', completed_at = now()
  where id = target_enrollment_id and status <> 'completed';

  insert into certificates (enrollment_id, certificate_number, mentorship_expires_at)
  values (
    target_enrollment_id,
    generate_certificate_number(),
    now() + make_interval(months => coalesce(mentorship_months, 12))
  )
  on conflict (enrollment_id) do nothing;

  return true;
end;
$$;
