-- ============================================================================
-- 00000000000016_wellness_checkins.sql
-- Patient self-journaling: a lightweight mood rating + optional encrypted
-- reflection text, entered whenever the patient wants (not tied to a
-- specific appointment). Shown back to the patient as a running log, and
-- to their provider as read-only context (gated by permission, same
-- pattern as consents.view).
-- ============================================================================

create table wellness_checkins (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references profiles (id) on delete cascade,
  mood_rating smallint not null check (mood_rating between 1 and 5),
  reflection_encrypted bytea,
  created_at timestamptz not null default now()
);

create index wellness_checkins_patient_idx on wellness_checkins (patient_id, created_at desc);

alter table wellness_checkins enable row level security;

create policy "wellness_checkins_owner" on wellness_checkins
  for all using (patient_id = auth.uid()) with check (patient_id = auth.uid());

create policy "wellness_checkins_provider_view" on wellness_checkins
  for select using (has_permission('clinical.view_reflections'));

insert into permissions (key, description, category) values
  ('clinical.view_reflections', 'View patient wellness check-ins and reflections', 'compliance')
on conflict (key) do nothing;

insert into role_permissions (role, permission_key) values
  ('provider', 'clinical.view_reflections'),
  ('admin', 'clinical.view_reflections')
on conflict do nothing;
