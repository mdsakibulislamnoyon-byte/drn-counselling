-- ============================================================================
-- 00000000000012_rls_policies.sql
-- Row Level Security. Enabled on every table; access is default-deny and
-- opened up explicitly per role. The service_role key (server-only, never
-- shipped to the client — see src/lib/supabase/server.ts) bypasses RLS
-- entirely, which is why API routes that need cross-user access (Stripe
-- webhooks, admin analytics, the drip-unlock cron) use that client.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so they can read profiles/permissions
-- regardless of the calling user's own RLS visibility into those tables).
-- ---------------------------------------------------------------------------

create or replace function current_role_name()
returns user_role
language sql stable security definer set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_staff_or_above()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(current_role_name() in ('provider', 'staff', 'admin'), false);
$$;

create or replace function is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(current_role_name() = 'admin', false);
$$;

create or replace function has_permission(perm_key text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from effective_permissions
    where user_id = auth.uid() and permission_key = perm_key
  );
$$;

create or replace function is_conversation_participant(conv_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from conversation_participants
    where conversation_id = conv_id and user_id = auth.uid()
  );
$$;

create or replace function is_enrolled_in_course(check_course_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from enrollments
    where course_id = check_course_id and student_id = auth.uid() and status in ('active', 'completed')
  );
$$;

-- ---------------------------------------------------------------------------
-- profiles / provider_profiles
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;

create policy "profiles_select_own" on profiles
  for select using (id = auth.uid());

create policy "profiles_select_staff" on profiles
  for select using (is_staff_or_above());

-- Provider directory: names/avatars for providers are public so patients can
-- pick who to book with; sensitive fields (license number) live separately
-- in provider_profiles.license_number_encrypted, which this policy does not touch.
create policy "profiles_select_providers_public" on profiles
  for select using (role = 'provider');

create policy "profiles_update_own" on profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));

create policy "profiles_admin_manage" on profiles
  for all using (is_admin()) with check (is_admin());

alter table provider_profiles enable row level security;

create policy "provider_profiles_public_read" on provider_profiles
  for select using (true); -- bios are public marketing content

create policy "provider_profiles_self_manage" on provider_profiles
  for all using (id = auth.uid() or is_admin()) with check (id = auth.uid() or is_admin());

-- ---------------------------------------------------------------------------
-- HIPAA consent
-- ---------------------------------------------------------------------------

alter table consent_documents enable row level security;

create policy "consent_documents_public_read" on consent_documents
  for select using (is_current);

create policy "consent_documents_admin_manage" on consent_documents
  for all using (is_admin()) with check (is_admin());

alter table hipaa_consents enable row level security;

create policy "hipaa_consents_self_insert" on hipaa_consents
  for insert with check (user_id = auth.uid());

create policy "hipaa_consents_self_select" on hipaa_consents
  for select using (user_id = auth.uid());

create policy "hipaa_consents_staff_select" on hipaa_consents
  for select using (has_permission('consents.view'));

create policy "hipaa_consents_admin_manage" on hipaa_consents
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- Insurance, emergency contacts, payment methods (patient-owned PHI)
-- ---------------------------------------------------------------------------

alter table insurance_info enable row level security;
alter table emergency_contacts enable row level security;
alter table patient_payment_methods enable row level security;

create policy "insurance_info_owner" on insurance_info
  for all using (patient_id = auth.uid()) with check (patient_id = auth.uid());
create policy "insurance_info_staff_view" on insurance_info
  for select using (has_permission('billing.view_insurance'));

create policy "emergency_contacts_owner" on emergency_contacts
  for all using (patient_id = auth.uid()) with check (patient_id = auth.uid());
create policy "emergency_contacts_staff_view" on emergency_contacts
  for select using (is_staff_or_above());

create policy "payment_methods_owner" on patient_payment_methods
  for all using (patient_id = auth.uid()) with check (patient_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Appointments
-- ---------------------------------------------------------------------------

alter table availability_slots enable row level security;

create policy "availability_public_read" on availability_slots
  for select using (not is_blocked);

create policy "availability_provider_manage" on availability_slots
  for all using (provider_id = auth.uid() or is_admin())
  with check (provider_id = auth.uid() or is_admin());

alter table appointments enable row level security;

create policy "appointments_patient_select" on appointments
  for select using (patient_id = auth.uid());
create policy "appointments_provider_select" on appointments
  for select using (provider_id = auth.uid());
create policy "appointments_staff_select" on appointments
  for select using (has_permission('appointments.view_all'));

create policy "appointments_patient_insert" on appointments
  for insert with check (patient_id = auth.uid() and status = 'requested');

create policy "appointments_patient_cancel" on appointments
  for update using (patient_id = auth.uid())
  with check (patient_id = auth.uid() and status = 'cancelled');

create policy "appointments_provider_manage" on appointments
  for update using (provider_id = auth.uid())
  with check (provider_id = auth.uid());

create policy "appointments_staff_manage" on appointments
  for all using (has_permission('appointments.manage_all'))
  with check (has_permission('appointments.manage_all'));

alter table appointment_reminders enable row level security;
create policy "appointment_reminders_staff_only" on appointment_reminders
  for all using (is_staff_or_above()) with check (is_staff_or_above());

-- ---------------------------------------------------------------------------
-- Messaging
-- ---------------------------------------------------------------------------

alter table conversations enable row level security;
alter table conversation_participants enable row level security;
alter table messages enable row level security;

create policy "conversations_participant_select" on conversations
  for select using (is_conversation_participant(id));

create policy "conversation_participants_select" on conversation_participants
  for select using (is_conversation_participant(conversation_id));

create policy "messages_participant_select" on messages
  for select using (is_conversation_participant(conversation_id));

create policy "messages_participant_insert" on messages
  for insert with check (
    sender_id = auth.uid() and is_conversation_participant(conversation_id)
  );

-- Conversation creation and adding participants happens through the
-- /api/messages route (service role), which validates that a patient can
-- only open a clinical thread with their own provider/care team.

-- ---------------------------------------------------------------------------
-- LMS catalog
-- ---------------------------------------------------------------------------

alter table courses enable row level security;
alter table course_modules enable row level security;
alter table lessons enable row level security;
alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_options enable row level security;
alter table quiz_attempts enable row level security;

create policy "courses_public_read" on courses
  for select using (is_published);
create policy "courses_admin_manage" on courses
  for all using (has_permission('lms.manage_courses')) with check (has_permission('lms.manage_courses'));

create policy "course_modules_public_read" on course_modules
  for select using (exists (select 1 from courses c where c.id = course_id and c.is_published));
create policy "course_modules_admin_manage" on course_modules
  for all using (has_permission('lms.manage_courses')) with check (has_permission('lms.manage_courses'));

-- Lesson video/content: preview lessons are public; the rest require an
-- active enrollment (drip-unlock status itself is enforced in the API layer
-- when issuing signed Mux playback tokens, not here).
create policy "lessons_preview_public_read" on lessons
  for select using (is_preview);
create policy "lessons_enrolled_read" on lessons
  for select using (
    is_enrolled_in_course((select course_id from course_modules cm where cm.id = module_id))
  );
create policy "lessons_admin_manage" on lessons
  for all using (has_permission('lms.manage_courses')) with check (has_permission('lms.manage_courses'));

create policy "quizzes_enrolled_read" on quizzes
  for select using (
    is_enrolled_in_course((select course_id from course_modules cm where cm.id = module_id))
  );
create policy "quiz_questions_enrolled_read" on quiz_questions
  for select using (
    exists (
      select 1 from quizzes q
      join course_modules cm on cm.id = q.module_id
      where q.id = quiz_id and is_enrolled_in_course(cm.course_id)
    )
  );
create policy "quiz_options_enrolled_read" on quiz_options
  for select using (
    exists (
      select 1 from quiz_questions qq
      join quizzes q on q.id = qq.quiz_id
      join course_modules cm on cm.id = q.module_id
      where qq.id = question_id and is_enrolled_in_course(cm.course_id)
    )
  );
create policy "quiz_admin_manage" on quizzes
  for all using (has_permission('lms.manage_courses')) with check (has_permission('lms.manage_courses'));
create policy "quiz_questions_admin_manage" on quiz_questions
  for all using (has_permission('lms.manage_courses')) with check (has_permission('lms.manage_courses'));
create policy "quiz_options_admin_manage" on quiz_options
  for all using (has_permission('lms.manage_courses')) with check (has_permission('lms.manage_courses'));

create policy "quiz_attempts_own" on quiz_attempts
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "quiz_attempts_staff_view" on quiz_attempts
  for select using (has_permission('lms.manage_courses'));

-- ---------------------------------------------------------------------------
-- Enrollments, progress, certificates
-- ---------------------------------------------------------------------------

alter table enrollments enable row level security;
alter table lesson_progress enable row level security;
alter table certificates enable row level security;

create policy "enrollments_own_select" on enrollments
  for select using (student_id = auth.uid());
create policy "enrollments_staff_manage" on enrollments
  for all using (has_permission('lms.manage_courses')) with check (has_permission('lms.manage_courses'));

create policy "lesson_progress_own" on lesson_progress
  for select using (
    exists (select 1 from enrollments e where e.id = enrollment_id and e.student_id = auth.uid())
  );
create policy "lesson_progress_own_update" on lesson_progress
  for update using (
    exists (select 1 from enrollments e where e.id = enrollment_id and e.student_id = auth.uid())
  )
  with check (
    exists (select 1 from enrollments e where e.id = enrollment_id and e.student_id = auth.uid())
  );
create policy "lesson_progress_staff_manage" on lesson_progress
  for all using (has_permission('lms.manage_courses')) with check (has_permission('lms.manage_courses'));

create policy "certificates_own_select" on certificates
  for select using (
    exists (select 1 from enrollments e where e.id = enrollment_id and e.student_id = auth.uid())
  );
create policy "certificates_staff_manage" on certificates
  for all using (has_permission('lms.manage_courses')) with check (has_permission('lms.manage_courses'));

-- ---------------------------------------------------------------------------
-- Payments / promo codes
-- ---------------------------------------------------------------------------

alter table payments enable row level security;
alter table installment_plans enable row level security;
alter table promo_codes enable row level security;

create policy "payments_own_select" on payments
  for select using (user_id = auth.uid());
create policy "payments_staff_select" on payments
  for select using (has_permission('billing.view_all'));
-- Inserts/updates to payments happen exclusively via the Stripe webhook
-- handler using the service role client, never directly from the client.

create policy "installment_plans_own_select" on installment_plans
  for select using (
    exists (select 1 from payments p where p.id = payment_id and p.user_id = auth.uid())
  );
create policy "installment_plans_staff_select" on installment_plans
  for select using (has_permission('billing.view_all'));

create policy "promo_codes_admin_manage" on promo_codes
  for all using (has_permission('billing.manage_promo_codes'))
  with check (has_permission('billing.manage_promo_codes'));
-- No client-side select policy: codes are validated server-side (service
-- role) in /api/checkout/validate-promo so redemption counts stay accurate
-- and codes aren't enumerable by browsing the table.

-- ---------------------------------------------------------------------------
-- RBAC tables
-- ---------------------------------------------------------------------------

alter table permissions enable row level security;
alter table role_permissions enable row level security;
alter table user_permission_overrides enable row level security;

create policy "permissions_admin_only" on permissions
  for all using (is_admin()) with check (is_admin());
create policy "role_permissions_admin_only" on role_permissions
  for all using (is_admin()) with check (is_admin());
create policy "user_permission_overrides_admin_only" on user_permission_overrides
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- Notifications / audit log
-- ---------------------------------------------------------------------------

alter table notifications enable row level security;
alter table audit_log enable row level security;

create policy "notifications_own" on notifications
  for select using (user_id = auth.uid());
create policy "notifications_own_update" on notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "audit_log_admin_select" on audit_log
  for select using (is_admin());
-- No insert/update/delete policy for authenticated users: audit rows are
-- written exclusively by API routes via the service role client.
