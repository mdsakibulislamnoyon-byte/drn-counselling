-- ============================================================================
-- 00000000000014_seed_permissions.sql
-- Seed the permission grid and sensible default role grants.
-- ============================================================================

insert into permissions (key, description, category) values
  ('appointments.view_all',      'View every appointment across all providers', 'appointments'),
  ('appointments.manage_all',    'Create, reschedule, or cancel any appointment', 'appointments'),
  ('consents.view',              'View patient HIPAA consent records', 'compliance'),
  ('billing.view_insurance',     'View patient insurance details', 'billing'),
  ('billing.view_all',           'View all payments and invoices', 'billing'),
  ('billing.manage_promo_codes', 'Create and edit promo/discount codes', 'billing'),
  ('lms.manage_courses',         'Create/edit courses, modules, lessons, and quizzes', 'lms'),
  ('admin.manage_roles',         'Assign roles and permission overrides to other users', 'admin'),
  ('admin.view_analytics',       'View sales analytics and system health dashboards', 'admin')
on conflict (key) do nothing;

-- Providers: clinical + their own scheduling, not billing/admin.
insert into role_permissions (role, permission_key) values
  ('provider', 'appointments.view_all'),
  ('provider', 'consents.view'),
  ('provider', 'billing.view_insurance')
on conflict do nothing;

-- Staff: front-desk/operations defaults. Individual grants (e.g. billing)
-- are added per-person via user_permission_overrides from the Admin Dashboard.
insert into role_permissions (role, permission_key) values
  ('staff', 'appointments.view_all'),
  ('staff', 'appointments.manage_all'),
  ('staff', 'consents.view'),
  ('staff', 'billing.view_insurance')
on conflict do nothing;

-- Admin: everything.
insert into role_permissions (role, permission_key)
select 'admin', key from permissions
on conflict do nothing;
