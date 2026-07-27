-- ============================================================================
-- 00000000000010_permissions_rbac.sql
-- Fine-grained permission grid layered on top of profiles.role, so the
-- Super Admin can grant/revoke individual capabilities to a staff member
-- without inventing a brand-new role for every combination.
-- ============================================================================

create table permissions (
  key text primary key,      -- e.g. 'appointments.manage_all'
  description text not null,
  category text not null     -- 'appointments' | 'billing' | 'messaging' | 'lms' | 'admin'
);

-- Default grants per base role. A staff member's effective permission set is
-- role_permissions[role] plus/minus user_permission_overrides for their id.
create table role_permissions (
  role user_role not null,
  permission_key text not null references permissions (key) on delete cascade,
  primary key (role, permission_key)
);

create table user_permission_overrides (
  user_id uuid not null references profiles (id) on delete cascade,
  permission_key text not null references permissions (key) on delete cascade,
  granted boolean not null, -- true = explicitly grant, false = explicitly revoke
  granted_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  primary key (user_id, permission_key)
);

create or replace view effective_permissions as
select
  p.id as user_id,
  perm.key as permission_key,
  coalesce(o.granted, rp.permission_key is not null) as granted
from profiles p
cross join permissions perm
left join role_permissions rp
  on rp.role = p.role and rp.permission_key = perm.key
left join user_permission_overrides o
  on o.user_id = p.id and o.permission_key = perm.key
where coalesce(o.granted, rp.permission_key is not null) = true;

comment on view effective_permissions is
  'Flattened (user_id, permission_key) grants: role defaults overridden per-user by admins.';
